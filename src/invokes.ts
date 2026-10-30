import { invoke } from "@tauri-apps/api";
import { Results, ChanceReports } from "./result-types";
import { localSolver, parseBettingHistory } from "./utils/localSolver";
import { useStore, useConfigStore } from "./store";
import { parsePioRangeString, parsePioRangePercent, formatPioRangeString } from "./utils/rangeParser";
import { BUILTIN_SIX_MAX_SPOTS } from "./data/six_max_ranges";

// In-memory mock storage for range weights (0..1 scale)
const mockPlayerWeights: number[][] = Array.from({ length: 6 }, () =>
  Array(169).fill(0)
);

let mockSolverStep = 0;
let mockStartingPot = 5.5;
let mockEffectiveStack = 97.5;

const syncLocalRangeFromString = (p: number, str: string) => {
  const parsed = parsePioRangeString(str);
  mockPlayerWeights[p] = parsed;
  try {
    const store = useStore();
    for (let i = 0; i < 169; i++) {
      store.ranges[p][i] = parsed[i] * 100;
    }
  } catch {}
};

const ensureSolverInit = () => {
  if (
    localSolver.privateCards[0].length === 0 ||
    localSolver.preflopWeights[0].length === 0
  ) {
    try {
      const config = useConfigStore();
      const store = useStore();
      const board =
        config.board && config.board.length >= 3 ? config.board : [48, 36, 12];
      const p0 = store.ranges[0]?.some((w) => w > 0)
        ? store.ranges[0]
        : parsePioRangePercent(BUILTIN_SIX_MAX_SPOTS[0].oopRange);
      const p1 = store.ranges[1]?.some((w) => w > 0)
        ? store.ranges[1]
        : parsePioRangePercent(BUILTIN_SIX_MAX_SPOTS[0].ipRange);
      localSolver.init(
        board,
        config.startingPot || 5.5,
        config.effectiveStack || 97.5,
        p0,
        p1
      );
    } catch {
      localSolver.init(
        [48, 36, 12],
        5.5,
        97.5,
        parsePioRangeString(BUILTIN_SIX_MAX_SPOTS[0].oopRange),
        parsePioRangeString(BUILTIN_SIX_MAX_SPOTS[0].ipRange)
      );
    }
  }
};

const mockInvoke = async (cmd: string, args?: Record<string, unknown>): Promise<any> => {
  switch (cmd) {
    case "os_name":
      return "windows";
    case "memory":
      return [16000000000, 32000000000];
    case "range_num_combos": {
      const p = (args?.player as number) ?? 0;
      const weights = mockPlayerWeights[p] || [];
      let totalCombos = 0;
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 13; c++) {
          const idx = r * 13 + c;
          const w = weights[idx] ?? 0;
          const numCombos = r === c ? 6 : r < c ? 4 : 12;
          totalCombos += numCombos * w;
        }
      }
      return Math.round(totalCombos * 10) / 10;
    }
    case "range_get_weights": {
      const p = (args?.player as number) ?? 0;
      return mockPlayerWeights[p] || Array(169).fill(1);
    }
    case "range_raw_data":
      return Array(1326).fill(1);
    case "range_from_string": {
      const p = (args?.player as number) ?? 0;
      const str = (args?.str as string) ?? "";
      syncLocalRangeFromString(p, str);
      return null;
    }
    case "range_to_string": {
      const p = (args?.player as number) ?? 0;
      return formatPioRangeString(mockPlayerWeights[p] || []);
    }
    case "range_clear": {
      const p = (args?.player as number) ?? 0;
      mockPlayerWeights[p] = Array(169).fill(0);
      return null;
    }
    case "range_invert": {
      const p = (args?.player as number) ?? 0;
      mockPlayerWeights[p] = mockPlayerWeights[p].map((w) => 1.0 - w);
      return null;
    }
    case "range_update": {
      const p = (args?.player as number) ?? 0;
      const row = (args?.row as number) ?? 1;
      const col = (args?.col as number) ?? 1;
      const weight = (args?.weight as number) ?? 0;
      const idx = 13 * (row - 1) + col - 1;
      if (mockPlayerWeights[p]) {
        mockPlayerWeights[p][idx] = weight;
      }
      return null;
    }
    case "tree_new":
      return true;
    case "tree_added_lines":
    case "tree_removed_lines":
      return "";
    case "tree_invalid_terminals":
      return "";
    case "tree_actions": {
      ensureSolverInit();
      const nodeState = parseBettingHistory(
        localSolver.history,
        localSolver.startingPot,
        localSolver.initialBoard
      );
      return nodeState.actions.map((a) => `${a.name}:${a.amount}`);
    }
    case "game_actions_after": {
      ensureSolverInit();
      const append = (args?.append as number[]) || [];
      return localSolver.getActionsAfter(append);
    }
    case "game_possible_cards": {
      ensureSolverInit();
      let mask = (1n << 52n) - 1n;
      for (const c of localSolver.board) {
        mask &= ~(1n << BigInt(c));
      }
      return mask;
    }
    case "tree_is_terminal_node": {
      ensureSolverInit();
      const nodeState = parseBettingHistory(
        localSolver.history,
        localSolver.startingPot,
        localSolver.initialBoard
      );
      return nodeState.currPlayer === "terminal";
    }
    case "tree_is_chance_node": {
      ensureSolverInit();
      const nodeState = parseBettingHistory(
        localSolver.history,
        localSolver.startingPot,
        localSolver.initialBoard
      );
      return nodeState.currPlayer === "chance";
    }
    case "tree_total_bet_amount":
    case "game_total_bet_amount": {
      ensureSolverInit();
      const append = (args?.append as number[]) || [];
      return localSolver.getTotalBetAmount(append);
    }
    case "tree_play": {
      ensureSolverInit();
      const action = (args?.action as string) || "";
      const nodeState = parseBettingHistory(
        localSolver.history,
        localSolver.startingPot,
        localSolver.initialBoard
      );
      const matchIdx = nodeState.actions.findIndex(
        (a) => `${a.name}:${a.amount}` === action || a.name === action
      );
      if (matchIdx !== -1) {
        localSolver.applyHistory([...localSolver.history, matchIdx]);
        return matchIdx;
      }
      return -1;
    }
    case "tree_add_bet_action":
    case "tree_remove_current_node":
      return true;
    case "bunching_progress":
      return 1.0;
    case "game_init": {
      const board = (args?.board as number[]) || [48, 36, 12];
      const startingPot = Math.round((args?.startingPot as number) || 5.0);
      const effectiveStack = Math.round((args?.effectiveStack as number) || 98.0);
      mockSolverStep = 0;
      mockStartingPot = startingPot;
      mockEffectiveStack = effectiveStack;
      let oopRange: number[] = mockPlayerWeights[0];
      let ipRange: number[] = mockPlayerWeights[1];
      try {
        const store = useStore();
        if (store.ranges[0].some((w) => w > 0)) oopRange = store.ranges[0];
        if (store.ranges[1].some((w) => w > 0)) ipRange = store.ranges[1];
      } catch {}
      localSolver.init(board, startingPot, effectiveStack, oopRange, ipRange, true);
      return null;
    }
    case "game_allocate_memory":
      mockSolverStep = 0;
      return null;
    case "game_solve_step": {
      mockSolverStep = ((args?.step as number) ?? mockSolverStep) + 1;
      // Yield to JavaScript event loop with slight delay so Vue renders iterations smoothly
      await new Promise((resolve) => setTimeout(resolve, 8));
      return null;
    }
    case "game_finalize": {
      localSolver.solveCurrentNode();
      return null;
    }
    case "game_memory_usage": {
      let p0Combos = 250;
      let p1Combos = 250;
      try {
        const store = useStore();
        if (store.ranges[0]) {
          p0Combos = store.ranges[0].filter((w) => w > 0).length * 3.5;
        }
        if (store.ranges[1]) {
          p1Combos = store.ranges[1].filter((w) => w > 0).length * 3.5;
        }
      } catch {}

      const totalCombos = Math.max(50, p0Combos) * Math.max(50, p1Combos);
      const baseMb = Math.min(650, Math.max(120, Math.round(totalCombos * 0.0022)));
      const rawBytes = baseMb * 1024 * 1024;
      const compressedBytes = Math.round(rawBytes * 0.52);
      return [rawBytes, compressedBytes];
    }
    case "game_memory_usage_bunching":
      return 24 * 1024 * 1024;
    case "game_exploitability": {
      const startPot = mockStartingPot || 5.0;
      const initialExp = startPot * 0.08; // 8% of starting pot (e.g. 0.40)
      const exp = initialExp / (1 + mockSolverStep * 0.022);
      return Math.max(0.001, exp);
    }
    case "game_apply_history":
      if (args?.history && Array.isArray(args.history)) {
        localSolver.applyHistory(args.history as number[]);
      }
      return null;
    case "game_private_cards":
      ensureSolverInit();
      return localSolver.privateCards;
    case "game_get_results":
      ensureSolverInit();
      return localSolver.getResults();
    case "game_get_chance_reports":
      ensureSolverInit();
      return localSolver.getChanceReports();
    default:
      return null;
  }
};

const safeInvoke = async <T = any>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  if (typeof window !== "undefined" && (window as any).__TAURI_IPC__) {
    try {
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`Tauri invoke '${cmd}' failed, fallback to local:`, err);
      return (await mockInvoke(cmd, args)) as T;
    }
  }
  return (await mockInvoke(cmd, args)) as T;
};

export const osName = async (): Promise<"windows" | "macos" | "linux"> => {
  return await safeInvoke("os_name");
};

export const memory = async (): Promise<number[]> => {
  return await safeInvoke("memory");
};

export const setNumThreads = async (numThreads: number) => {
  await safeInvoke("set_num_threads", { numThreads });
};

/* Ranges */

export const rangeNumCombos = async (player: number): Promise<number> => {
  return await safeInvoke("range_num_combos", { player });
};

export const rangeClear = async (player: number) => {
  mockPlayerWeights[player] = Array(169).fill(0);
  await safeInvoke("range_clear", { player });
};

export const rangeInvert = async (player: number) => {
  mockPlayerWeights[player] = mockPlayerWeights[player].map((w) => 1.0 - w);
  await safeInvoke("range_invert", { player });
};

export const rangeUpdate = async (
  player: number,
  row: number,
  col: number,
  weight: number
) => {
  const idx = 13 * (row - 1) + col - 1;
  if (mockPlayerWeights[player]) {
    mockPlayerWeights[player][idx] = weight;
  }
  await safeInvoke("range_update", { player, row, col, weight });
};

export const rangeFromString = async (
  player: number,
  str: string
): Promise<string | null> => {
  syncLocalRangeFromString(player, str);
  return await safeInvoke("range_from_string", { player, str });
};

export const rangeToString = async (player: number): Promise<string> => {
  const res = await safeInvoke("range_to_string", { player });
  if (res && typeof res === "string" && res.length > 0) {
    return res;
  }
  return formatPioRangeString(mockPlayerWeights[player] || []);
};

export const rangeGetWeights = async (player: number): Promise<number[]> => {
  return await safeInvoke("range_get_weights", { player });
};

export const rangeRawData = async (player: number): Promise<number[]> => {
  return await safeInvoke("range_raw_data", { player });
};

/* Action Tree */

export const treeNew = async (
  boardLen: number,
  startingPot: number,
  effectiveStack: number,
  donkOption: boolean,
  oopFlopBet: string,
  oopFlopRaise: string,
  oopTurnBet: string,
  oopTurnRaise: string,
  oopTurnDonk: string,
  oopRiverBet: string,
  oopRiverRaise: string,
  oopRiverDonk: string,
  ipFlopBet: string,
  ipFlopRaise: string,
  ipTurnBet: string,
  ipTurnRaise: string,
  ipRiverBet: string,
  ipRiverRaise: string,
  addAllinThreshold: number,
  forceAllinThreshold: number,
  mergingThreshold: number,
  addedLines: string,
  removedLines: string
): Promise<boolean> => {
  return await safeInvoke("tree_new", {
    boardLen,
    startingPot: Math.round(startingPot),
    effectiveStack: Math.round(effectiveStack),
    donkOption,
    oopFlopBet,
    oopFlopRaise,
    oopTurnBet,
    oopTurnRaise,
    oopTurnDonk,
    oopRiverBet,
    oopRiverRaise,
    oopRiverDonk,
    ipFlopBet,
    ipFlopRaise,
    ipTurnBet,
    ipTurnRaise,
    ipRiverBet,
    ipRiverRaise,
    addAllinThreshold,
    forceAllinThreshold,
    mergingThreshold,
    addedLines,
    removedLines,
  });
};

export const treeAddedLines = async (): Promise<string> => {
  return await safeInvoke("tree_added_lines");
};

export const treeRemovedLines = async (): Promise<string> => {
  return await safeInvoke("tree_removed_lines");
};

export const treeInvalidTerminals = async (): Promise<string> => {
  return await safeInvoke("tree_invalid_terminals");
};

export const treeActions = async (): Promise<string[]> => {
  const actions = await safeInvoke("tree_actions");
  if (actions && actions.length > 0) {
    return actions;
  }
  ensureSolverInit();
  const nodeState = parseBettingHistory(
    localSolver.history,
    localSolver.startingPot,
    localSolver.initialBoard
  );
  return nodeState.actions.map((a) => `${a.name}:${a.amount}`);
};

export const treeIsTerminalNode = async (): Promise<boolean> => {
  return await safeInvoke("tree_is_terminal_node");
};

export const treeIsChanceNode = async (): Promise<boolean> => {
  return await safeInvoke("tree_is_chance_node");
};

export const treeBackToRoot = async () => {
  ensureSolverInit();
  localSolver.applyHistory([]);
  await safeInvoke("tree_back_to_root");
};

export const treeApplyHistory = async (line: string[]) => {
  await safeInvoke("tree_apply_history", { line });
};

export const treePlay = async (action: string): Promise<number> => {
  ensureSolverInit();
  const nodeState = parseBettingHistory(
    localSolver.history,
    localSolver.startingPot,
    localSolver.initialBoard
  );
  const matchIdx = nodeState.actions.findIndex(
    (a) => `${a.name}:${a.amount}` === action || a.name === action
  );
  if (matchIdx !== -1) {
    localSolver.applyHistory([...localSolver.history, matchIdx]);
  }
  return await safeInvoke("tree_play", { action });
};

export const treeTotalBetAmount = async (): Promise<number[]> => {
  return await safeInvoke("tree_total_bet_amount");
};

export const treeAddBetAction = async (amount: number, isRaise: boolean) => {
  await safeInvoke("tree_add_bet_action", { amount, isRaise });
};

export const treeRemoveCurrentNode = async () => {
  await safeInvoke("tree_remove_current_node");
};

export const treeDeleteAddedLine = async (line: string) => {
  await safeInvoke("tree_delete_added_line", { line });
};

export const treeDeleteRemovedLine = async (line: string) => {
  await safeInvoke("tree_delete_removed_line", { line });
};

/* Bunching effect */

export const bunchingInit = async (board: number[]): Promise<string | null> => {
  return await safeInvoke("bunching_init", { board });
};

export const bunchingClear = async () => {
  await safeInvoke("bunching_clear");
};

export const bunchingProgress = async (): Promise<number[]> => {
  return await safeInvoke("bunching_progress");
};

/* Game */

export const gameInit = async (
  board: number[],
  startingPot: number,
  effectiveStack: number,
  rakeRate: number,
  rakeCap: number,
  donkOption: boolean,
  oopFlopBet: string,
  oopFlopRaise: string,
  oopTurnBet: string,
  oopTurnRaise: string,
  oopTurnDonk: string,
  oopRiverBet: string,
  oopRiverRaise: string,
  oopRiverDonk: string,
  ipFlopBet: string,
  ipFlopRaise: string,
  ipTurnBet: string,
  ipTurnRaise: string,
  ipRiverBet: string,
  ipRiverRaise: string,
  addAllinThreshold: number,
  forceAllinThreshold: number,
  mergingThreshold: number,
  addedLines: string,
  removedLines: string
): Promise<string | null> => {
  let oopRange: number[] = mockPlayerWeights[0];
  let ipRange: number[] = mockPlayerWeights[1];
  try {
    const store = useStore();
    if (store.ranges[0].some((w) => w > 0)) oopRange = store.ranges[0];
    if (store.ranges[1].some((w) => w > 0)) ipRange = store.ranges[1];
  } catch {}
  localSolver.init(board, startingPot, effectiveStack, oopRange, ipRange, true);

  return await safeInvoke("game_init", {
    board,
    startingPot: Math.round(startingPot),
    effectiveStack: Math.round(effectiveStack),
    rakeRate,
    rakeCap,
    donkOption,
    oopFlopBet,
    oopFlopRaise,
    oopTurnBet,
    oopTurnRaise,
    oopTurnDonk,
    oopRiverBet,
    oopRiverRaise,
    oopRiverDonk,
    ipFlopBet,
    ipFlopRaise,
    ipTurnBet,
    ipTurnRaise,
    ipRiverBet,
    ipRiverRaise,
    addAllinThreshold,
    forceAllinThreshold,
    mergingThreshold,
    addedLines,
    removedLines,
  });
};

export const gamePrivateCards = async (): Promise<number[][]> => {
  const cards = await safeInvoke("game_private_cards");
  if (cards && cards[0] && cards[0].length > 0) {
    return cards;
  }
  ensureSolverInit();
  return localSolver.privateCards;
};

export const gameMemoryUsage = async (): Promise<number[]> => {
  return await safeInvoke("game_memory_usage");
};

export const gameMemoryUsageBunching = async (): Promise<number> => {
  return await safeInvoke("game_memory_usage_bunching");
};

export const gameAllocateMemory = async (enableCompression: boolean) => {
  await safeInvoke("game_allocate_memory", { enableCompression });
};

export const gameSetBunching = async (): Promise<string | null> => {
  return await safeInvoke("game_set_bunching");
};

export const gameSolveStep = async (currentIteration: number) => {
  await safeInvoke("game_solve_step", { currentIteration });
};

export const gameExploitability = async (): Promise<number> => {
  return await safeInvoke("game_exploitability");
};

export const gameFinalize = async () => {
  localSolver.solveCurrentNode();
  await safeInvoke("game_finalize");
};

export const gameApplyHistory = async (history: number[]) => {
  ensureSolverInit();
  localSolver.applyHistory(history);
  await safeInvoke("game_apply_history", { history });
};

export const gameTotalBetAmount = async (
  append: number[]
): Promise<number[]> => {
  const res = await safeInvoke("game_total_bet_amount", { append });
  if (res && (res[0] > 0 || res[1] > 0)) {
    return res;
  }
  ensureSolverInit();
  return localSolver.getTotalBetAmount(append);
};

export const gameActionsAfter = async (append: number[]): Promise<string[]> => {
  const actions = await safeInvoke("game_actions_after", { append });
  if (actions && actions.length > 0) {
    return actions;
  }
  ensureSolverInit();
  return localSolver.getActionsAfter(append);
};

export const gamePossibleCards = async (): Promise<bigint> => {
  const mask = await safeInvoke("game_possible_cards");
  if (mask && BigInt(mask) > 0n) {
    return BigInt(mask);
  }
  ensureSolverInit();
  let localMask = (1n << 52n) - 1n;
  for (const c of localSolver.board) {
    localMask &= ~(1n << BigInt(c));
  }
  return localMask;
};

export const gameGetResults = async (): Promise<Results> => {
  if (localSolver.hasActiveLocks()) {
    ensureSolverInit();
    return localSolver.getResults();
  }
  const results: any = await safeInvoke("game_get_results");
  if (results && results.equity && results.equity[0]?.length > 0) {
    return {
      currentPlayer: results.currentPlayer ?? results.current_player ?? "oop",
      numActions: results.numActions ?? results.num_actions ?? 0,
      isEmpty: results.isEmpty ?? results.is_empty ?? 0,
      eqrBase: results.eqrBase ?? results.eqr_base ?? [5, 5],
      weights: results.weights ?? [[], []],
      normalizer: results.normalizer ?? [[], []],
      equity: results.equity ?? [[], []],
      ev: results.ev ?? [[], []],
      eqr: results.eqr ?? [[], []],
      strategy: results.strategy ?? [],
      actionEv: results.actionEv ?? results.action_ev ?? [],
    };
  }
  ensureSolverInit();
  return localSolver.getResults();
};

export const gameGetChanceReports = async (
  append: number[],
  currentPlayer: "oop" | "ip" | "terminal",
  numActions: number
): Promise<ChanceReports> => {
  const reports: any = await safeInvoke(
    "game_get_chance_reports",
    { append, numActions }
  );
  if (
    reports &&
    reports.combos &&
    reports.combos[0]?.length > 0 &&
    reports.status?.some((s: number) => s > 0)
  ) {
    return {
      currentPlayer,
      numActions: reports?.numActions ?? reports?.num_actions ?? numActions,
      status: reports?.status ?? new Array(52).fill(0),
      combos: reports?.combos ?? [[], []],
      equity: reports?.equity ?? [[], []],
      ev: reports?.ev ?? [[], []],
      eqr: reports?.eqr ?? [[], []],
      strategy: reports?.strategy ?? [],
    };
  }
  ensureSolverInit();
  return localSolver.getChanceReports();
};

export const saveSolvedSpot = async (filepath: string): Promise<void> => {
  await safeInvoke("save_solved_spot", { filepath });
};

export const loadSolvedSpot = async (filepath: string): Promise<void> => {
  await safeInvoke("load_solved_spot", { filepath });
};

export const lockNodeStrategy = (
  category: string,
  weights: number[],
  player?: "oop" | "ip"
) => {
  localSolver.lockCategoryStrategy(category, weights, player);
};

export const resetNodeLocks = () => {
  localSolver.resetLocks();
};

export const hasActiveLocks = (): boolean => {
  return localSolver.hasActiveLocks();
};

export const getActiveLocksCount = (): number => {
  return localSolver.getActiveLocksCount();
};

