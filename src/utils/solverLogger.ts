import { reactive, ref } from "vue";
import { cardText } from "../utils";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";
export type LogStep = "CONFIG" | "TREE" | "MEMORY" | "SOLVER" | "ANALYSIS" | "SYSTEM";

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  step: LogStep;
  message: string;
  details?: any;
}

export interface DiagnosticResult {
  hasErrors: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

let nextId = 1;

export const solverLogs = reactive<LogEntry[]>([]);
export const isLogConsoleOpen = ref(true);

function getTimestamp(): string {
  const now = new Date();
  return now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
}

export function logMessage(
  level: LogLevel,
  step: LogStep,
  message: string,
  details?: any
): LogEntry {
  const entry: LogEntry = {
    id: nextId++,
    timestamp: getTimestamp(),
    level,
    step,
    message,
    details: details ? JSON.parse(JSON.stringify(details)) : undefined,
  };

  solverLogs.push(entry);

  // Keep max 200 log entries
  if (solverLogs.length > 200) {
    solverLogs.shift();
  }

  // Also output to browser developer console with clean styling
  const prefix = `[PostflopSolver][${step}][${level}]`;
  if (level === "ERROR") {
    console.error(prefix, message, details || "");
  } else if (level === "WARN") {
    console.warn(prefix, message, details || "");
  } else if (level === "SUCCESS") {
    console.log(`%c${prefix} ${message}`, "color: #10b981; font-weight: bold;", details || "");
  } else {
    console.log(prefix, message, details || "");
  }

  return entry;
}

export const logInfo = (step: LogStep, msg: string, details?: any) => logMessage("INFO", step, msg, details);
export const logWarn = (step: LogStep, msg: string, details?: any) => logMessage("WARN", step, msg, details);
export const logError = (step: LogStep, msg: string, details?: any) => logMessage("ERROR", step, msg, details);
export const logSuccess = (step: LogStep, msg: string, details?: any) => logMessage("SUCCESS", step, msg, details);

export function clearSolverLogs(): void {
  solverLogs.length = 0;
  nextId = 1;
}

/**
 * Runs a comprehensive pre-solve diagnostic on the spot configuration,
 * detecting 0-combos, board card collisions, invalid sizings, and missing data.
 */
export function diagnoseSpotConfig(
  board: number[],
  startingPot: number,
  effectiveStack: number,
  oopRangeWeights: number[],
  ipRangeWeights: number[],
  betConfig: {
    oopFlopBet: string;
    oopFlopRaise: string;
    ipFlopBet: string;
    ipFlopRaise: string;
    oopTurnBet: string;
    ipTurnBet: string;
    oopRiverBet: string;
    ipRiverBet: string;
  }
): DiagnosticResult {
  const result: DiagnosticResult = {
    hasErrors: false,
    errors: [],
    warnings: [],
    info: [],
  };

  // 1. Board check
  if (!board || board.length < 3) {
    result.errors.push("Il Board deve contenere almeno 3 carte (Flop).");
  } else {
    const boardSet = new Set<number>();
    for (const c of board) {
      if (boardSet.has(c)) {
        result.errors.push(`Carta duplicata rilevata sul Board: ${cardText(c).rank}${cardText(c).suit} (ID: ${c})`);
      }
      boardSet.add(c);
    }
    const boardNames = board.map((c) => `${cardText(c).rank}${cardText(c).suit}`).join(" ");
    result.info.push(`Board configurato: [ ${boardNames} ] (${board.length} carte)`);
  }

  // 2. Pot & Stack
  if (startingPot <= 0) {
    result.errors.push(`Dimensione piatto non valida: Starting Pot deve essere > 0 (valore: ${startingPot}bb)`);
  } else {
    result.info.push(`Starting Pot: ${startingPot} bb`);
  }

  if (effectiveStack <= 0) {
    result.errors.push(`Stack effettivo non valido: Effective Stack deve essere > 0 (valore: ${effectiveStack}bb)`);
  } else {
    result.info.push(`Effective Stack: ${effectiveStack} bb (SPR iniziale: ${(effectiveStack / (startingPot || 1)).toFixed(1)})`);
  }

  if (startingPot > effectiveStack * 10) {
    result.warnings.push(`Starting Pot (${startingPot}bb) è insolitamente grande rispetto allo stack (${effectiveStack}bb).`);
  }

  // 3. Range Checks
  const countCombos = (weights: number[]) => {
    let count = 0;
    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 13; c++) {
        const w = (weights[r * 13 + c] ?? 0) / 100;
        if (w > 0) {
          const num = r === c ? 6 : r < c ? 4 : 12;
          count += num * w;
        }
      }
    }
    return Math.round(count * 10) / 10;
  };

  const oopCombos = countCombos(oopRangeWeights);
  const ipCombos = countCombos(ipRangeWeights);

  if (oopCombos === 0) {
    result.errors.push("Il Range OOP (Player 0 / BB) è vuoto (0 combos)! Inserisci o seleziona un range valido.");
  } else if (oopCombos < 10) {
    result.warnings.push(`Il Range OOP ha pochissime combo (${oopCombos} combos). Il solver potrebbe convergere a strategie degenerate.`);
  } else {
    result.info.push(`Range OOP (Player 0): ${oopCombos} combo ponderate attive.`);
  }

  if (ipCombos === 0) {
    result.errors.push("Il Range IP (Player 1 / SB/BTN) è vuoto (0 combos)! Inserisci o seleziona un range valido.");
  } else if (ipCombos < 10) {
    result.warnings.push(`Il Range IP ha pochissime combo (${ipCombos} combos).`);
  } else {
    result.info.push(`Range IP (Player 1): ${ipCombos} combo ponderate attive.`);
  }

  // 4. Bet sizes validation
  const validateBetStr = (s: string, field: string) => {
    if (!s || s.trim() === "") return;
    const tokens = s.split(",").map((t) => t.trim().toLowerCase());
    for (const t of tokens) {
      if (t === "e" || t === "allin" || t === "a") continue;
      const num = parseFloat(t);
      if (isNaN(num) || num <= 0) {
        result.errors.push(`Bet size non valida in ${field}: '${t}'. Usa numeri percentuali (es. '33, 75') o 'allin'/'e'.`);
      }
    }
  };

  validateBetStr(betConfig.oopFlopBet, "OOP Flop Bet");
  validateBetStr(betConfig.ipFlopBet, "IP Flop Bet");
  validateBetStr(betConfig.oopTurnBet, "OOP Turn Bet");
  validateBetStr(betConfig.ipTurnBet, "IP Turn Bet");
  validateBetStr(betConfig.oopRiverBet, "OOP River Bet");
  validateBetStr(betConfig.ipRiverBet, "IP River Bet");

  result.hasErrors = result.errors.length > 0;
  return result;
}

/**
 * Returns a complete formatted text diagnostic log that the user can copy
 * and paste directly to the AI developer or save for review.
 */
export function getFormattedLogReport(): string {
  const lines: string[] = [
    "==================================================",
    "       DESKTOP POSTFLOP - SOLVER DIAGNOSTIC LOG   ",
    `       Generated: ${new Date().toLocaleString()}`,
    "==================================================",
    "",
  ];

  for (const entry of solverLogs) {
    const badge = `[${entry.timestamp}] [${entry.step}] [${entry.level}]`;
    lines.push(`${badge.padEnd(38)} : ${entry.message}`);
    if (entry.details) {
      lines.push("  DETAILS: " + JSON.stringify(entry.details, null, 2).replace(/\n/g, "\n  "));
    }
  }

  lines.push("");
  lines.push("==================================================");
  lines.push("                 END OF REPORT                    ");
  lines.push("==================================================");

  return lines.join("\n");
}
