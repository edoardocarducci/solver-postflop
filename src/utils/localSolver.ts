import { ref } from "vue";
import { cardPairCellIndex } from "../utils";
import { evaluateCombo, HandEvaluation } from "./handCategorizer";
import { Results, ChanceReports } from "../result-types";

export interface SolverNode {
  currentPlayer: "oop" | "ip" | "chance" | "terminal";
  numActions: number;
  actions: { name: string; amount: number; color?: string }[];
  pot: number;
  oopTotalBet?: number;
  ipTotalBet?: number;
  history: number[];
}

export interface BoardTexture {
  highRank: number; // 0 (Deuce) to 12 (Ace)
  secondRank: number;
  lowRank: number;
  isRainbow: boolean;
  isTwoTone: boolean;
  isMonotone: boolean;
  isPaired: boolean;
  isConnected: boolean;
  dryness: number; // 0.0 (very wet) to 1.0 (ultra dry)
  favorsAggressor: number; // 0.0 to 1.0
}

export function analyzeBoardTexture(board: number[]): BoardTexture {
  const bRanks = board.map((c) => c >>> 2).sort((a, b) => b - a);
  const bSuits = board.map((c) => c & 3);
  const suitCounts = new Map<number, number>();
  for (const s of bSuits) suitCounts.set(s, (suitCounts.get(s) || 0) + 1);
  const maxSuitCount = Math.max(...Array.from(suitCounts.values()), 1);

  const highRank = bRanks[0] ?? 11;
  const secondRank = bRanks[1] ?? 5;
  const lowRank = bRanks[bRanks.length - 1] ?? 0;

  const isRainbow = maxSuitCount === 1;
  const isTwoTone = maxSuitCount === 2;
  const isMonotone = maxSuitCount >= 3;
  const isPaired = bRanks[0] === bRanks[1] || (bRanks.length > 2 && bRanks[1] === bRanks[2]);

  const spread = highRank - lowRank;
  const isConnected = spread <= 4 && !isPaired;

  // Dryness score: High rank + Rainbow + Disconnected + Paired makes it dry
  let dryness = 0.5;
  if (isRainbow) dryness += 0.22;
  if (isTwoTone) dryness -= 0.06;
  if (isMonotone) dryness -= 0.35;
  if (isPaired) dryness += 0.15;
  if (isConnected) dryness -= 0.25;
  if (highRank >= 10) dryness += 0.15; // Ace, King, Queen
  dryness = Math.max(0.05, Math.min(0.98, dryness));

  // High card advantage: Preflop aggressor holds more high cards (AA-TT, AK, AQ, etc.)
  let favorsAggressor = 0.5;
  if (highRank >= 11) favorsAggressor += 0.25; // A or K
  else if (highRank === 10) favorsAggressor += 0.18; // Q
  else if (highRank <= 7) favorsAggressor -= 0.15;

  if (isRainbow && highRank >= 10) favorsAggressor += 0.12;
  if (isConnected && highRank <= 8) favorsAggressor -= 0.20;
  favorsAggressor = Math.max(0.15, Math.min(0.95, favorsAggressor));

  return {
    highRank,
    secondRank,
    lowRank,
    isRainbow,
    isTwoTone,
    isMonotone,
    isPaired,
    isConnected,
    dryness,
    favorsAggressor,
  };
}

export interface BettingState {
  currPlayer: "oop" | "ip" | "chance" | "terminal";
  street: number; // 0: flop, 1: turn, 2: river
  activeBoard: number[];
  isFacingBet: boolean;
  isFacingRaise: boolean;
  actions: { name: string; amount: number; color?: string }[];
  oopTotalBet: number;
  ipTotalBet: number;
  currentPot: number;
}

export function parseBettingHistory(
  history: number[],
  startingPot: number,
  initialBoard: number[] | number
): BettingState {
  let initialCards: number[] = [];
  if (Array.isArray(initialBoard)) {
    initialCards = [...initialBoard];
  }

  const activeBoard = [...initialCards];
  let street = activeBoard.length >= 5 ? 2 : activeBoard.length === 4 ? 1 : 0;
  let currPlayer: "oop" | "ip" | "chance" | "terminal" = "oop";
  let isFacingBet = false;
  let isFacingRaise = false;
  let lastBetAmount = 0;
  let oopTotalBet = 0;
  let ipTotalBet = 0;
  let oopStreetBet = 0;
  let ipStreetBet = 0;
  let isTerminal = false;

  for (let step = 0; step < history.length; step++) {
    const actIdx = history[step];

    if (isTerminal) {
      break;
    }

    if (currPlayer === "chance") {
      // Dealing a turn or river card
      if (actIdx >= 0 && actIdx < 52) {
        if (!activeBoard.includes(actIdx)) {
          activeBoard.push(actIdx);
        }
        street++;
        currPlayer = "oop";
        isFacingBet = false;
        isFacingRaise = false;
        oopStreetBet = 0;
        ipStreetBet = 0;
        lastBetAmount = 0;
        continue;
      } else if (actIdx === -1) {
        // Chance preview / pending card: if more steps follow, advance
        if (step < history.length - 1) {
          street++;
          currPlayer = "oop";
          isFacingBet = false;
          isFacingRaise = false;
          oopStreetBet = 0;
          ipStreetBet = 0;
          lastBetAmount = 0;
          continue;
        } else {
          break;
        }
      }
    }

    if (currPlayer === "oop") {
      if (isFacingRaise) {
        if (actIdx === 0) {
          currPlayer = "terminal";
          isTerminal = true;
          break;
        } else if (actIdx === 1) {
          oopTotalBet += (ipStreetBet - oopStreetBet);
          oopStreetBet = ipStreetBet;
          if (street >= 2) {
            currPlayer = "terminal";
            isTerminal = true;
            break;
          } else {
            currPlayer = "chance";
          }
        } else {
          const raiseTo = Math.round(ipStreetBet * 2.5 * 10) / 10;
          lastBetAmount = raiseTo - ipStreetBet;
          oopTotalBet += (raiseTo - oopStreetBet);
          oopStreetBet = raiseTo;
          currPlayer = "ip";
          isFacingBet = false;
          isFacingRaise = true;
        }
      } else if (isFacingBet) {
        if (actIdx === 0) {
          currPlayer = "terminal";
          isTerminal = true;
          break;
        } else if (actIdx === 1) {
          oopTotalBet += (ipStreetBet - oopStreetBet);
          oopStreetBet = ipStreetBet;
          if (street >= 2) {
            currPlayer = "terminal";
            isTerminal = true;
            break;
          } else {
            currPlayer = "chance";
          }
        } else {
          const curPot = startingPot + oopTotalBet + ipTotalBet;
          const raiseTo = Math.round((curPot + ipStreetBet) * 0.75 * 10) / 10;
          lastBetAmount = raiseTo - ipStreetBet;
          oopTotalBet += (raiseTo - oopStreetBet);
          oopStreetBet = raiseTo;
          currPlayer = "ip";
          isFacingBet = false;
          isFacingRaise = true;
        }
      } else {
        // OOP Opening
        if (actIdx === 0) {
          currPlayer = "ip";
          isFacingBet = false;
          isFacingRaise = false;
        } else {
          const curPot = startingPot + oopTotalBet + ipTotalBet;
          const betRate = actIdx === 1 ? 0.33 : 0.75;
          const betAmt = Math.round(curPot * betRate * 10) / 10;
          oopTotalBet += betAmt;
          oopStreetBet = betAmt;
          lastBetAmount = betAmt;
          currPlayer = "ip";
          isFacingBet = true;
          isFacingRaise = false;
        }
      }
    } else if (currPlayer === "ip") {
      if (isFacingRaise) {
        if (actIdx === 0) {
          currPlayer = "terminal";
          isTerminal = true;
          break;
        } else if (actIdx === 1) {
          ipTotalBet += (oopStreetBet - ipStreetBet);
          ipStreetBet = oopStreetBet;
          if (street >= 2) {
            currPlayer = "terminal";
            isTerminal = true;
            break;
          } else {
            currPlayer = "chance";
          }
        } else {
          const raiseTo = Math.round(oopStreetBet * 2.5 * 10) / 10;
          lastBetAmount = raiseTo - oopStreetBet;
          ipTotalBet += (raiseTo - ipStreetBet);
          ipStreetBet = raiseTo;
          currPlayer = "oop";
          isFacingBet = false;
          isFacingRaise = true;
        }
      } else if (isFacingBet) {
        if (actIdx === 0) {
          currPlayer = "terminal";
          isTerminal = true;
          break;
        } else if (actIdx === 1) {
          ipTotalBet += (oopStreetBet - ipStreetBet);
          ipStreetBet = oopStreetBet;
          if (street >= 2) {
            currPlayer = "terminal";
            isTerminal = true;
            break;
          } else {
            currPlayer = "chance";
          }
        } else {
          const curPot = startingPot + oopTotalBet + ipTotalBet;
          const raiseTo = Math.round((curPot + oopStreetBet) * 0.75 * 10) / 10;
          lastBetAmount = raiseTo - oopStreetBet;
          ipTotalBet += (raiseTo - ipStreetBet);
          ipStreetBet = raiseTo;
          currPlayer = "oop";
          isFacingBet = false;
          isFacingRaise = true;
        }
      } else {
        // IP Facing OOP Check
        if (actIdx === 0) {
          // Check-Check
          if (street >= 2) {
            currPlayer = "terminal";
            isTerminal = true;
            break;
          } else {
            currPlayer = "chance";
          }
        } else {
          const curPot = startingPot + oopTotalBet + ipTotalBet;
          const betRate = actIdx === 1 ? 0.33 : 0.75;
          const betAmt = Math.round(curPot * betRate * 10) / 10;
          ipTotalBet += betAmt;
          ipStreetBet = betAmt;
          lastBetAmount = betAmt;
          currPlayer = "oop";
          isFacingBet = true;
          isFacingRaise = false;
        }
      }
    }
  }

  const currentPot = Math.round((startingPot + oopTotalBet + ipTotalBet) * 10) / 10;

  if (currPlayer === "terminal" || isTerminal) {
    return {
      currPlayer: "terminal",
      street,
      activeBoard,
      isFacingBet: false,
      isFacingRaise: false,
      actions: [{ name: "terminal", amount: 0, color: "#64748b" }],
      oopTotalBet,
      ipTotalBet,
      currentPot,
    };
  }

  if (currPlayer === "chance") {
    return {
      currPlayer: "chance",
      street,
      activeBoard,
      isFacingBet: false,
      isFacingRaise: false,
      actions: [{ name: "chance", amount: 0, color: "#64748b" }],
      oopTotalBet,
      ipTotalBet,
      currentPot,
    };
  }

  let actions: { name: string; amount: number; color?: string }[] = [];
  if (isFacingRaise) {
    actions = [
      { name: "Fold", amount: 0, color: "#3b82f6" },
      { name: "Call", amount: Math.round(lastBetAmount * 10) / 10, color: "#22c55e" },
      { name: "Raise", amount: Math.round(lastBetAmount * 2.5 * 10) / 10, color: "#ef4444" },
    ];
  } else if (isFacingBet) {
    actions = [
      { name: "Fold", amount: 0, color: "#3b82f6" },
      { name: "Call", amount: Math.round(lastBetAmount * 10) / 10, color: "#22c55e" },
      {
        name: "Raise",
        amount: Math.round(currentPot * 0.75 * 10) / 10,
        color: "#ef4444",
      },
    ];
  } else {
    actions = [
      { name: "Check", amount: 0, color: "#10b981" },
      { name: "Bet 33%", amount: Math.max(1.0, Math.round(currentPot * 0.33 * 10) / 10), color: "#f59e0b" },
      { name: "Bet 75%", amount: Math.max(1.5, Math.round(currentPot * 0.75 * 10) / 10), color: "#f97316" },
    ];
  }

  return {
    currPlayer,
    street,
    activeBoard,
    isFacingBet,
    isFacingRaise,
    actions,
    oopTotalBet,
    ipTotalBet,
    currentPot,
  };
}

export function calcComboEquity(
  c1: number,
  c2: number,
  board: number[],
  evalRes: HandEvaluation,
  precomputedTexture?: BoardTexture
): number {
  const texture = precomputedTexture ?? analyzeBoardTexture(board);
  const r1 = c1 >>> 2;
  const r2 = c2 >>> 2;
  const highHoleRank = Math.max(r1, r2);
  const kickerRank = Math.min(r1, r2);

  if (board.length >= 5) {
    return Math.min(0.99, Math.max(0.01, evalRes.rankScore / 8000));
  } else if (board.length === 4) {
    let baseEq = 0.20;
    switch (evalRes.madeHand) {
      case "Straight Flush":
      case "Quads":
        baseEq = 0.99;
        break;
      case "Full House":
        baseEq = 0.97;
        break;
      case "Flush":
        baseEq = 0.94;
        break;
      case "Straight":
        baseEq = 0.90;
        break;
      case "Set":
        baseEq = 0.88;
        break;
      case "Trips":
        baseEq = 0.82;
        break;
      case "Two Pair":
        baseEq = 0.77;
        break;
      case "Overpair":
        baseEq = 0.72;
        break;
      case "Top Pair":
        if (kickerRank >= 10) baseEq = 0.76;
        else if (kickerRank >= 7) baseEq = 0.68;
        else baseEq = 0.60;
        break;
      case "Middle Pair":
        baseEq = 0.44;
        break;
      case "Weak Pair":
        baseEq = 0.28;
        break;
      case "Underpair":
        baseEq = 0.22;
        break;
      case "Ace High":
        baseEq = 0.12;
        break;
      case "No Made Hand":
        baseEq = 0.05;
        break;
    }

    for (const draw of evalRes.draws) {
      if (draw === "Combo Draw") baseEq += 0.28;
      else if (draw === "Nut Flush Draw") baseEq += 0.21;
      else if (draw === "Flush Draw") baseEq += 0.18;
      else if (draw === "OESD") baseEq += 0.16;
      else if (draw === "Gutshot") baseEq += 0.08;
      else if (draw === "Overcards") baseEq += 0.05;
    }

    const kickerBonus = (highHoleRank - 6) * 0.006;
    return Math.min(0.99, Math.max(0.01, baseEq + kickerBonus));
  } else {
    let baseEq = 0.35;
    switch (evalRes.madeHand) {
      case "Straight Flush":
      case "Quads":
        baseEq = 0.99;
        break;
      case "Full House":
        baseEq = 0.96;
        break;
      case "Flush":
        baseEq = 0.92;
        break;
      case "Straight":
        baseEq = 0.88;
        break;
      case "Set":
        baseEq = texture.isMonotone ? 0.78 : texture.dryness > 0.6 ? 0.92 : 0.85;
        break;
      case "Trips":
        baseEq = 0.82;
        break;
      case "Two Pair":
        baseEq = texture.dryness > 0.6 ? 0.84 : 0.74;
        break;
      case "Overpair":
        baseEq = texture.dryness > 0.6 ? 0.89 : 0.76;
        break;
      case "Top Pair":
        if (texture.dryness > 0.6) {
          if (kickerRank >= 10) baseEq = 0.85;
          else if (kickerRank >= 7) baseEq = 0.80;
          else baseEq = 0.74;
        } else {
          baseEq = 0.62;
        }
        break;
      case "Middle Pair":
        baseEq = texture.dryness > 0.6 ? 0.55 : 0.42;
        break;
      case "Weak Pair":
        baseEq = 0.38;
        break;
      case "Underpair":
        baseEq = 0.32;
        break;
      case "Ace High":
        baseEq = texture.highRank >= 11 ? 0.22 : 0.35;
        break;
      case "No Made Hand":
        baseEq = 0.15;
        break;
    }

    for (const draw of evalRes.draws) {
      if (draw === "Combo Draw") baseEq += 0.22;
      else if (draw === "Nut Flush Draw") baseEq += 0.18;
      else if (draw === "Flush Draw") baseEq += 0.14;
      else if (draw === "OESD") baseEq += 0.12;
      else if (draw === "Gutshot") baseEq += 0.06;
      else if (draw === "Overcards") baseEq += 0.05;
      else if (draw === "Backdoor Flush Draw") baseEq += 0.04;
      else if (draw === "Backdoor Straight Draw") baseEq += 0.03;
    }

    const kickerBonus = (highHoleRank - 6) * 0.008;
    return Math.min(0.99, Math.max(0.01, baseEq + kickerBonus));
  }
}

export class LocalSolverEngine {
  initialBoard: number[] = [];
  board: number[] = [];
  startingPot: number = 5.0;
  effectiveStack: number = 97.5;
  privateCards: [number[], number[]] = [[], []]; // [OOP cards, IP cards]
  preflopWeights: [number[], number[]] = [[], []];
  weights: [number[], number[]] = [[], []];
  equity: [number[], number[]] = [[], []];
  ev: [number[], number[]] = [[], []];
  eqr: [number[], number[]] = [[], []];
  strategy: number[] = []; // numActions * numHands
  actionEv: number[] = [];

  // History & Navigation
  history: number[] = [];
  currentNode: SolverNode = {
    currentPlayer: "oop",
    numActions: 3,
    actions: [
      { name: "Check", amount: 0, color: "#10b981" },
      { name: "Bet 33%", amount: 1.7, color: "#f59e0b" },
      { name: "Bet 75%", amount: 3.8, color: "#f97316" },
    ],
    pot: 5.0,
    oopTotalBet: 0,
    ipTotalBet: 0,
    history: [],
  };

  lockedStrategies: Map<string, number[]> = new Map();
  lockVersion = ref(0);

  init(
    board: number[],
    startingPot: number,
    effectiveStack: number,
    oopRange: number[],
    ipRange: number[]
  ) {
    this.initialBoard = [...board];
    this.board = [...board];
    this.startingPot = startingPot || 5.0;
    this.effectiveStack = effectiveStack || 97.5;
    this.history = [];
    this.lockedStrategies.clear();
    this.lockVersion.value++;

    // Generate valid private cards for OOP and IP (excluding board cards)
    const boardSet = new Set(this.initialBoard);
    const validPairs: number[] = [];

    for (let c1 = 0; c1 < 52; c1++) {
      if (boardSet.has(c1)) continue;
      for (let c2 = c1 + 1; c2 < 52; c2++) {
        if (boardSet.has(c2)) continue;
        validPairs.push(c1 | (c2 << 8));
      }
    }

    this.privateCards = [[...validPairs], [...validPairs]];

    // Populate preflop weights from 13x13 matrices (auto-detecting 0..1 vs 0..100 scale)
    const numHands = validPairs.length;
    this.preflopWeights = [new Array(numHands).fill(0), new Array(numHands).fill(0)];
    this.weights = [new Array(numHands).fill(0), new Array(numHands).fill(0)];

    for (let p = 0; p < 2; p++) {
      const rangeMatrix = p === 0 ? oopRange : ipRange;
      const maxRangeVal =
        rangeMatrix && rangeMatrix.length > 0 ? Math.max(...rangeMatrix, 0) : 0;
      const scale = maxRangeVal > 1.001 ? 0.01 : 1.0;

      for (let i = 0; i < numHands; i++) {
        const pair = validPairs[i];
        const c1 = pair & 0xff;
        const c2 = pair >>> 8;
        const { row, col } = cardPairCellIndex(c1, c2);
        const cellIdx = row * 13 + col;
        const w =
          rangeMatrix && rangeMatrix[cellIdx] !== undefined && maxRangeVal > 0
            ? rangeMatrix[cellIdx] * scale
            : 0.8;
        this.preflopWeights[p][i] = w;
        this.weights[p][i] = w;
      }
    }

    this.solveCurrentNode();
  }

  getComboStrategy(
    pIdx: number,
    comboIdx: number,
    board: number[],
    nodeState: BettingState,
    eq: number,
    evalRes: HandEvaluation,
    precomputedTexture?: BoardTexture
  ): number[] {
    const numActions = nodeState.actions.length;
    const actions = nodeState.actions;
    const isFacingBet = numActions === 3 && actions[0].name === "Fold";
    const texture = precomputedTexture ?? analyzeBoardTexture(board);
    const isDryHighBoard = texture.highRank >= 10 && texture.dryness >= 0.62;
    const isWetBoard = texture.dryness < 0.40;

    const currPlayer = nodeState.currPlayer;
    const isFlopOopOpen = board.length === 3 && currPlayer === "oop" && !isFacingBet;
    const isFlopIpVsCheck = board.length === 3 && currPlayer === "ip" && !isFacingBet;
    const isTurnIpVsCheck = board.length === 4 && currPlayer === "ip" && !isFacingBet;
    const isRiverIpVsCheck = board.length === 5 && currPlayer === "ip" && !isFacingBet;

    const isDraw = evalRes.draws.length > 0;
    const isNut =
      evalRes.madeHand === "Straight Flush" ||
      evalRes.madeHand === "Quads" ||
      evalRes.madeHand === "Full House" ||
      evalRes.madeHand === "Flush" ||
      evalRes.madeHand === "Straight" ||
      evalRes.madeHand === "Set";

    const strats: number[] = new Array(numActions).fill(0);

    if (isFacingBet) {
      // Facing Bet: Fold (0), Call (1), Raise (2)
      if (eq >= 0.76 || isNut) {
        strats[0] = 0.0;
        strats[1] = 0.42;
        strats[2] = 0.58;
      } else if (eq >= 0.52 || (isDraw && eq >= 0.38)) {
        strats[0] = 0.06;
        strats[1] = 0.80;
        strats[2] = 0.14;
      } else if (eq >= 0.30 || (isDraw && evalRes.draws.includes("Gutshot"))) {
        strats[0] = 0.45;
        strats[1] = 0.55;
        strats[2] = 0.0;
      } else {
        strats[0] = 0.98;
        strats[1] = 0.02;
        strats[2] = 0.0;
      }
    } else if (isFlopIpVsCheck) {
      // IP on Flop facing OOP Check
      if (isDryHighBoard) {
        if (isNut) {
          strats[0] = 0.12;
          strats[1] = 0.62;
          strats[2] = 0.26;
        } else if (evalRes.madeHand === "Two Pair" || evalRes.madeHand === "Overpair") {
          strats[0] = 0.14;
          strats[1] = 0.68;
          strats[2] = 0.18;
        } else if (evalRes.madeHand === "Top Pair") {
          strats[0] = 0.15;
          strats[1] = 0.74;
          strats[2] = 0.11;
        } else if (evalRes.madeHand === "Middle Pair") {
          strats[0] = 0.28;
          strats[1] = 0.68;
          strats[2] = 0.04;
        } else if (evalRes.madeHand === "Weak Pair" || evalRes.madeHand === "Underpair") {
          strats[0] = 0.42;
          strats[1] = 0.56;
          strats[2] = 0.02;
        } else if (isDraw || evalRes.draws.includes("Overcards") || evalRes.draws.includes("Backdoor Flush Draw")) {
          strats[0] = 0.16;
          strats[1] = 0.74;
          strats[2] = 0.10;
        } else {
          strats[0] = 0.24;
          strats[1] = 0.72;
          strats[2] = 0.04;
        }
      } else if (isWetBoard) {
        const isStrongDraw =
          evalRes.draws.includes("Combo Draw") ||
          evalRes.draws.includes("Nut Flush Draw") ||
          evalRes.draws.includes("Flush Draw") ||
          evalRes.draws.includes("OESD");

        if (isNut) {
          strats[0] = 0.15;
          strats[1] = 0.35;
          strats[2] = 0.50;
        } else if (evalRes.madeHand === "Two Pair" || evalRes.madeHand === "Overpair") {
          strats[0] = 0.35;
          strats[1] = 0.35;
          strats[2] = 0.30;
        } else if (evalRes.madeHand === "Top Pair") {
          strats[0] = 0.50;
          strats[1] = 0.30;
          strats[2] = 0.20;
        } else if (evalRes.madeHand === "Middle Pair" || evalRes.madeHand === "Weak Pair") {
          strats[0] = 0.70;
          strats[1] = 0.24;
          strats[2] = 0.06;
        } else if (isStrongDraw) {
          strats[0] = 0.35;
          strats[1] = 0.35;
          strats[2] = 0.30;
        } else if (isDraw) {
          strats[0] = 0.72;
          strats[1] = 0.22;
          strats[2] = 0.06;
        } else {
          strats[0] = 0.86;
          strats[1] = 0.10;
          strats[2] = 0.04;
        }
      } else {
        if (isNut || evalRes.madeHand === "Top Pair") {
          strats[0] = 0.22;
          strats[1] = 0.60;
          strats[2] = 0.18;
        } else if (evalRes.madeHand === "Middle Pair") {
          strats[0] = 0.45;
          strats[1] = 0.50;
          strats[2] = 0.05;
        } else if (isDraw) {
          strats[0] = 0.28;
          strats[1] = 0.58;
          strats[2] = 0.14;
        } else {
          strats[0] = 0.48;
          strats[1] = 0.48;
          strats[2] = 0.04;
        }
      }
    } else if (isFlopOopOpen) {
      if (isNut && !isDryHighBoard) {
        strats[0] = 0.78;
        strats[1] = 0.18;
        strats[2] = 0.04;
      } else {
        strats[0] = 0.94;
        strats[1] = 0.05;
        strats[2] = 0.01;
      }
    } else if (isTurnIpVsCheck) {
      if (isNut || (evalRes.madeHand === "Top Pair" && eq >= 0.70)) {
        strats[0] = 0.28;
        strats[1] = 0.42;
        strats[2] = 0.30;
      } else if (isDraw && (evalRes.draws.includes("Flush Draw") || evalRes.draws.includes("OESD"))) {
        strats[0] = 0.32;
        strats[1] = 0.52;
        strats[2] = 0.16;
      } else if (evalRes.madeHand === "Middle Pair" || evalRes.madeHand === "Weak Pair") {
        strats[0] = 0.68;
        strats[1] = 0.30;
        strats[2] = 0.02;
      } else {
        strats[0] = 0.72;
        strats[1] = 0.24;
        strats[2] = 0.04;
      }
    } else if (isRiverIpVsCheck) {
      if (isNut || eq >= 0.85) {
        strats[0] = 0.15;
        strats[1] = 0.35;
        strats[2] = 0.50;
      } else if (eq >= 0.45 && eq < 0.85) {
        strats[0] = 0.88;
        strats[1] = 0.10;
        strats[2] = 0.02;
      } else {
        strats[0] = 0.62;
        strats[1] = 0.28;
        strats[2] = 0.10;
      }
    } else {
      if (isNut || eq >= 0.75) {
        strats[0] = 0.30;
        strats[1] = 0.48;
        strats[2] = 0.22;
      } else {
        strats[0] = 0.75;
        strats[1] = 0.20;
        strats[2] = 0.05;
      }
    }

    const comboKey = `p${pIdx}_${comboIdx}`;
    if (this.lockedStrategies.has(comboKey)) {
      const locked = this.lockedStrategies.get(comboKey)!;
      for (let a = 0; a < numActions; a++) {
        strats[a] = locked[a] ?? strats[a];
      }
    }

    const stratSum = strats.reduce((a, b) => a + b, 0);
    if (stratSum > 0) {
      for (let a = 0; a < numActions; a++) {
        strats[a] /= stratSum;
      }
    }

    return strats;
  }

  solveCurrentNode() {
    const numHands = this.privateCards[0].length;
    if (numHands === 0) return;

    // Parse current node state and update active board
    const nodeState = parseBettingHistory(this.history, this.startingPot, this.initialBoard);
    this.board = [...nodeState.activeBoard];
    const currPlayer = nodeState.currPlayer;
    const actions = nodeState.actions;
    const numActions = actions.length;
    const nodePot = nodeState.currentPot;

    this.currentNode = {
      currentPlayer: currPlayer,
      numActions,
      actions,
      pot: nodePot,
      oopTotalBet: nodeState.oopTotalBet,
      ipTotalBet: nodeState.ipTotalBet,
      history: [...this.history],
    };

    // =========================================================================
    // 1. DYNAMIC RANGE NARROWING: Replay history to condition weights on actions!
    // =========================================================================
    this.weights = [new Array(numHands).fill(0), new Array(numHands).fill(0)];
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < numHands; i++) {
        this.weights[p][i] = this.preflopWeights[p][i];
      }
    }

    // Remove blockers for initial board
    const initBoardSet = new Set(this.initialBoard);
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < numHands; i++) {
        const pair = this.privateCards[p][i];
        if (initBoardSet.has(pair & 0xff) || initBoardSet.has(pair >>> 8)) {
          this.weights[p][i] = 0;
        }
      }
    }

    // Step-by-step history replay
    const subHistory: number[] = [];
    for (let step = 0; step < this.history.length; step++) {
      const stepState = parseBettingHistory(subHistory, this.startingPot, this.initialBoard);
      const stepPlayer = stepState.currPlayer;
      const stepBoard = stepState.activeBoard;
      const actIdx = this.history[step];

      if (stepPlayer === "chance") {
        if (actIdx >= 0 && actIdx < 52) {
          for (let p = 0; p < 2; p++) {
            for (let i = 0; i < numHands; i++) {
              const pair = this.privateCards[p][i];
              if ((pair & 0xff) === actIdx || (pair >>> 8) === actIdx) {
                this.weights[p][i] = 0;
              }
            }
          }
        }
        subHistory.push(actIdx);
        continue;
      }

      if (stepPlayer === "oop" || stepPlayer === "ip") {
        const pIdx = stepPlayer === "oop" ? 0 : 1;
        const stepTexture = analyzeBoardTexture(stepBoard);
        for (let i = 0; i < numHands; i++) {
          if (this.weights[pIdx][i] <= 0) continue;
          const pair = this.privateCards[pIdx][i];
          const c1 = pair & 0xff;
          const c2 = pair >>> 8;
          const evalRes = evaluateCombo(c1, c2, stepBoard);
          const eq = calcComboEquity(c1, c2, stepBoard, evalRes, stepTexture);
          const comboStrat = this.getComboStrategy(
            pIdx,
            i,
            stepBoard,
            stepState,
            eq,
            evalRes,
            stepTexture
          );
          const actionFreq = comboStrat[actIdx] ?? 0;
          const newWeight = this.weights[pIdx][i] * actionFreq;
          this.weights[pIdx][i] = newWeight >= 0.005 ? Math.round(newWeight * 1000) / 1000 : 0;
        }
        subHistory.push(actIdx);
      }
    }

    // Remove card blockers for all cards in current active board
    const currentBoardSet = new Set(this.board);
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < numHands; i++) {
        const pair = this.privateCards[p][i];
        if (currentBoardSet.has(pair & 0xff) || currentBoardSet.has(pair >>> 8)) {
          this.weights[p][i] = 0;
        }
      }
    }

    // =========================================================================
    // 2. PRECOMPUTE COMBO EVALUATIONS ONCE PER ACTIVE BOARD & COMPUTE EQUITIES
    // =========================================================================
    this.equity = [new Array(numHands).fill(0.5), new Array(numHands).fill(0.5)];
    this.ev = [new Array(numHands).fill(0), new Array(numHands).fill(0)];
    this.eqr = [new Array(numHands).fill(1.0), new Array(numHands).fill(1.0)];
    this.strategy = new Array(numActions * numHands).fill(0);
    this.actionEv = new Array(numActions * numHands).fill(0);

    const texture = analyzeBoardTexture(this.board);
    const boardEvals = new Array<HandEvaluation>(numHands);
    const pairs = this.privateCards[0];

    for (let i = 0; i < numHands; i++) {
      const pair = pairs[i];
      boardEvals[i] = evaluateCombo(pair & 0xff, pair >>> 8, this.board);
    }

    if (this.board.length >= 5) {
      // RIVER: Exact Showdown Equity Calculation against opponent's surviving range
      const scores = new Int32Array(numHands);
      for (let i = 0; i < numHands; i++) {
        scores[i] = boardEvals[i].rankScore;
      }

      for (let p = 0; p < 2; p++) {
        const oppP = 1 - p;
        const oppWeights = this.weights[oppP];

        for (let i = 0; i < numHands; i++) {
          if (this.weights[p][i] <= 0) {
            this.equity[p][i] = 0;
            this.ev[p][i] = 0;
            this.eqr[p][i] = 0;
            continue;
          }

          const myScore = scores[i];
          const pair = pairs[i];
          const c1 = pair & 0xff;
          const c2 = pair >>> 8;

          let winW = 0;
          let tieW = 0;
          let totalW = 0;

          for (let j = 0; j < numHands; j++) {
            const w = oppWeights[j];
            if (w <= 0.0001) continue;

            const oppPair = pairs[j];
            const oc1 = oppPair & 0xff;
            const oc2 = oppPair >>> 8;
            if (c1 === oc1 || c1 === oc2 || c2 === oc1 || c2 === oc2) continue;

            const oppScore = scores[j];
            totalW += w;
            if (myScore > oppScore) {
              winW += w;
            } else if (myScore === oppScore) {
              tieW += w;
            }
          }

          const eq = totalW > 0 ? (winW + 0.5 * tieW) / totalW : 0.5;
          const finalEq = Math.round(eq * 1000) / 1000;
          this.equity[p][i] = finalEq;
          this.eqr[p][i] = 1.0;
          this.ev[p][i] = Math.round(nodePot * finalEq * 100) / 100;
        }
      }
    } else {
      // FLOP & TURN: Compute combo equities once, apply to surviving combos
      const isTurn = this.board.length === 4;
      for (let i = 0; i < numHands; i++) {
        const hasP0 = this.weights[0][i] > 0;
        const hasP1 = this.weights[1][i] > 0;
        if (!hasP0 && !hasP1) {
          this.equity[0][i] = 0;
          this.ev[0][i] = 0;
          this.eqr[0][i] = 0;
          this.equity[1][i] = 0;
          this.ev[1][i] = 0;
          this.eqr[1][i] = 0;
          continue;
        }

        const pair = pairs[i];
        const rawEq = calcComboEquity(
          pair & 0xff,
          pair >>> 8,
          this.board,
          boardEvals[i],
          texture
        );
        const finalEq = Math.round(rawEq * 1000) / 1000;
        const rawEqr = isTurn
          ? finalEq > 0.6
            ? 1.05 + (finalEq - 0.6) * 0.25
            : 0.7 + finalEq * 0.5
          : finalEq > 0.65
          ? 1.08 + (finalEq - 0.65) * 0.35
          : 0.65 + finalEq * 0.5;
        const finalEqr = Math.round(rawEqr * 100) / 100;
        const finalEv = Math.round(nodePot * finalEq * finalEqr * 100) / 100;

        for (let p = 0; p < 2; p++) {
          if (this.weights[p][i] > 0) {
            this.equity[p][i] = finalEq;
            this.eqr[p][i] = finalEqr;
            this.ev[p][i] = finalEv;
          } else {
            this.equity[p][i] = 0;
            this.eqr[p][i] = 0;
            this.ev[p][i] = 0;
          }
        }
      }
    }

    // =========================================================================
    // 3. CURRENT NODE GTO STRATEGY, EXPLOITATIVE ADJUSTMENT & ACTION EV
    // =========================================================================
    if (currPlayer !== "terminal" && currPlayer !== "chance") {
      const pIdx = currPlayer === "oop" ? 0 : 1;
      const oppIdx = 1 - pIdx;

      // Measure if opponent has locked tendencies (e.g., overfolding or overcalling)
      let oppAggressionShift = 0;
      if (this.lockedStrategies.size > 0) {
        let lockedPassivity = 0;
        let lockedCount = 0;
        for (let i = 0; i < numHands; i++) {
          const oppKey = `p${oppIdx}_${i}`;
          if (this.lockedStrategies.has(oppKey) && this.weights[oppIdx][i] > 0) {
            const locked = this.lockedStrategies.get(oppKey)!;
            lockedPassivity += (locked[0] ?? 0) - 0.5;
            lockedCount++;
          }
        }
        if (lockedCount > 0) {
          oppAggressionShift = lockedPassivity / lockedCount;
        }
      }

      for (let i = 0; i < numHands; i++) {
        if (this.weights[pIdx][i] <= 0) {
          for (let a = 0; a < numActions; a++) {
            this.strategy[a * numHands + i] = 0;
            this.actionEv[a * numHands + i] = 0;
          }
          continue;
        }

        const eq = this.equity[pIdx][i];
        const evalRes = boardEvals[i];
        const strats = this.getComboStrategy(
          pIdx,
          i,
          this.board,
          nodeState,
          eq,
          evalRes,
          texture
        );

        // If opponent is locked and hero is NOT locked on this combo, shift toward exploitative best response
        const myKey = `p${pIdx}_${i}`;
        if (oppAggressionShift !== 0 && !this.lockedStrategies.has(myKey) && numActions >= 2) {
          const boostBet = Math.max(-0.35, Math.min(0.45, oppAggressionShift * 0.6));
          strats[0] = Math.max(0.02, strats[0] - boostBet);
          strats[1] = Math.max(0.02, strats[1] + boostBet * 0.65);
          if (numActions >= 3) {
            strats[2] = Math.max(0.01, strats[2] + boostBet * 0.35);
          }
          const sum = strats.reduce((a, b) => a + b, 0);
          if (sum > 0) {
            for (let a = 0; a < numActions; a++) strats[a] /= sum;
          }
        }

        const baseEv = this.ev[pIdx][i];
        let weightedNodeEv = 0;

        for (let a = 0; a < numActions; a++) {
          const s = Math.round(strats[a] * 1000) / 1000;
          this.strategy[a * numHands + i] = s;

          let actionEvVal = baseEv;
          if (actions[a].name === "Fold") {
            actionEvVal = 0;
          } else if (actions[a].name.startsWith("Bet") || actions[a].name === "Raise") {
            const exploitBonus = oppAggressionShift * actions[a].amount * 0.4;
            actionEvVal = baseEv + (eq - 0.48) * actions[a].amount * 1.15 + exploitBonus;
          }
          const roundedActionEv = Math.max(0, Math.round(actionEvVal * 100) / 100);
          this.actionEv[a * numHands + i] = roundedActionEv;
          weightedNodeEv += s * roundedActionEv;
        }

        this.ev[pIdx][i] = Math.round(weightedNodeEv * 100) / 100;
      }
    }
  }

  lockCategoryStrategy(
    categoryName: string,
    actionWeights: number[],
    targetPlayer?: "oop" | "ip"
  ) {
    const pIdx = targetPlayer
      ? (targetPlayer === "ip" ? 1 : 0)
      : (this.currentNode.currentPlayer === "oop" ? 0 : 1);
    const numHands = this.privateCards[pIdx].length;
    const normalized = actionWeights.map((w) => w / 100);

    for (let i = 0; i < numHands; i++) {
      const pair = this.privateCards[pIdx][i];
      const evalRes = evaluateCombo(pair & 0xff, pair >>> 8, this.board);

      let matches = false;
      if (categoryName === "all_range") {
        matches = true;
      } else if (categoryName === "nuts") {
        matches = [
          "Straight Flush",
          "Quads",
          "Full House",
          "Flush",
          "Straight",
          "Set",
        ].includes(evalRes.madeHand);
      } else if (categoryName === "two_pair") {
        matches = evalRes.madeHand === "Two Pair";
      } else if (categoryName === "overpair") {
        matches = evalRes.madeHand === "Overpair";
      } else if (categoryName === "top_pair") {
        matches = evalRes.madeHand === "Top Pair" || evalRes.rankScore >= 4500;
      } else if (categoryName === "medium_pairs") {
        matches =
          evalRes.madeHand === "Middle Pair" ||
          evalRes.madeHand === "Weak Pair" ||
          evalRes.madeHand === "Underpair";
      } else if (categoryName === "flush_draw") {
        matches =
          evalRes.draws.includes("Flush Draw") ||
          evalRes.draws.includes("Nut Flush Draw") ||
          evalRes.draws.includes("Combo Draw");
      } else if (categoryName === "straight_draw") {
        matches =
          evalRes.draws.includes("OESD") || evalRes.draws.includes("Gutshot");
      } else if (categoryName === "draws") {
        matches = evalRes.draws.length > 0;
      } else if (categoryName === "air") {
        matches =
          evalRes.madeHand === "Ace High" ||
          evalRes.madeHand === "No Made Hand";
      } else if (evalRes.madeHand === categoryName) {
        matches = true;
      }

      if (matches) {
        const comboKey = `p${pIdx}_${i}`;
        this.lockedStrategies.set(comboKey, [...normalized]);
      }
    }

    this.lockVersion.value++;
    this.solveCurrentNode();
  }

  resetLocks() {
    this.lockedStrategies.clear();
    this.lockVersion.value++;
    this.solveCurrentNode();
  }

  hasActiveLocks(): boolean {
    void this.lockVersion.value;
    return this.lockedStrategies.size > 0;
  }

  getActiveLocksCount(): number {
    void this.lockVersion.value;
    return this.lockedStrategies.size;
  }

  applyHistory(newHistory: number[]) {
    this.history = [...newHistory];
    this.solveCurrentNode();
  }

  dealNextCard(card: number) {
    if (this.board.length < 5 && !this.board.includes(card)) {
      this.history.push(card);
      this.solveCurrentNode();
    }
  }

  getActionsAfter(append: number[]): string[] {
    const combinedHistory = [...this.history, ...append];

    // Special case: if combinedHistory ends with -1 (meaning chance node preview)
    if (combinedHistory.length > 0 && combinedHistory[combinedHistory.length - 1] === -1) {
      const baseState = parseBettingHistory(
        combinedHistory.slice(0, -1),
        this.startingPot,
        this.initialBoard
      );
      if (baseState.currPlayer === "chance") {
        const nextPot = baseState.currentPot;
        const bet33 = Math.max(1.0, Math.round(nextPot * 0.33 * 10) / 10);
        const bet75 = Math.max(1.5, Math.round(nextPot * 0.75 * 10) / 10);
        return [`Check:0`, `Bet 33%:${bet33}`, `Bet 75%:${bet75}`];
      }
    }

    const nodeState = parseBettingHistory(
      combinedHistory,
      this.startingPot,
      this.initialBoard
    );
    if (
      nodeState.actions[0].name === "terminal" ||
      nodeState.actions[0].name === "chance"
    ) {
      return [nodeState.actions[0].name];
    }
    return nodeState.actions.map((a) => `${a.name}:${a.amount}`);
  }

  getTotalBetAmount(append: number[]): number[] {
    const combinedHistory = [...this.history, ...append];
    const nodeState = parseBettingHistory(
      combinedHistory,
      this.startingPot,
      this.initialBoard
    );
    return [nodeState.oopTotalBet, nodeState.ipTotalBet];
  }

  getResults(): Results {
    return {
      currentPlayer: this.currentNode.currentPlayer,
      numActions: this.currentNode.numActions,
      isEmpty: 0,
      eqrBase: [Math.round(this.startingPot), Math.round(this.startingPot)],
      weights: this.weights,
      normalizer: this.weights,
      equity: this.equity,
      ev: this.ev,
      eqr: this.eqr,
      strategy: this.strategy,
      actionEv: this.actionEv,
    };
  }

  getChanceReports(): ChanceReports {
    const numActions = this.currentNode.numActions;
    const status = new Array(52).fill(2);
    const combos = [new Array(52).fill(12), new Array(52).fill(12)];
    const equity = [new Array(52).fill(0.5), new Array(52).fill(0.5)];
    const ev = [new Array(52).fill(2.5), new Array(52).fill(2.5)];
    const eqr = [new Array(52).fill(1.0), new Array(52).fill(1.0)];
    const strategy = new Array(numActions * 52).fill(1.0 / numActions);

    const bRanks = this.board.map((c) => c >>> 2);
    const bSuits = this.board.map((c) => c & 3);
    const pot = this.currentNode.pot;

    for (let c = 0; c < 52; c++) {
      if (this.board.includes(c)) {
        status[c] = 0; // dead
        continue;
      }

      const r = c >>> 2;
      const s = c & 3;
      const isHighCard = r >= 10;
      const pairsBoard = bRanks.includes(r);
      const completesFlush = bSuits.filter((suit) => suit === s).length >= 2;

      // Realistic IP vs OOP equity shift on this runout card
      let ipEq = 0.52;
      if (isHighCard) ipEq += 0.08;
      if (r <= 6) ipEq -= 0.06;
      if (pairsBoard) ipEq += 0.04;
      if (completesFlush) ipEq -= 0.03;

      ipEq = Math.max(0.32, Math.min(0.72, ipEq));
      const oopEq = Math.round((1 - ipEq) * 100) / 100;
      const finalIpEq = Math.round(ipEq * 100) / 100;

      equity[0][c] = oopEq;
      equity[1][c] = finalIpEq;
      ev[0][c] = Math.round(pot * oopEq * 100) / 100;
      ev[1][c] = Math.round(pot * finalIpEq * 100) / 100;
    }

    return {
      currentPlayer: this.currentNode.currentPlayer === "oop" ? "oop" : "ip",
      numActions,
      status,
      combos,
      equity,
      ev,
      eqr,
      strategy,
    };
  }
}

export const localSolver = new LocalSolverEngine();
