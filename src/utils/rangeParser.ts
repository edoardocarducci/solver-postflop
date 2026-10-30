import { ranks } from "../utils";

const RANK_IDX: Record<string, number> = {};
ranks.forEach((r, idx) => {
  RANK_IDX[r.toUpperCase()] = idx; // 2 -> 0, ..., A -> 12
});

/**
 * Parses standard PioSOLVER / Postflop range strings into a 169-element array (13x13 matrix)
 * of weights from 0.0 to 1.0.
 *
 * Supported formats:
 * - Pairs: "22+", "88+", "TT", "22-77", "88-22", "JJ:0.75"
 * - Suited: "A2s+", "KTs+", "AKs", "A9s-A2s", "A2s-A9s", "QJs:0.6"
 * - Offsuit: "A2o+", "KTo+", "AKo", "A9o-A2o", "A2o-A9o", "KQo:0.4"
 * - Comma-separated combinations of above.
 */
export function parsePioRangeString(rangeStr: string): number[] {
  const matrix = new Array<number>(169).fill(0);
  if (!rangeStr || typeof rangeStr !== "string") return matrix;

  const tokens = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);

  for (const token of tokens) {
    let part = token;
    let weight = 1.0;

    // Check for weight suffix ":0.8"
    if (part.includes(":")) {
      const [handPart, weightPart] = part.split(":");
      part = handPart.trim();
      const parsedWeight = parseFloat(weightPart);
      if (!isNaN(parsedWeight) && parsedWeight >= 0 && parsedWeight <= 1.0) {
        weight = parsedWeight;
      }
    }

    // 1. Dash Range: "22-77", "A9s-A2s", "A9o-A2o"
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      parseDashRange(startStr, endStr, weight, matrix, RANK_IDX);
      continue;
    }

    // 2. Plus Range: "22+", "A2s+", "KTo+"
    if (part.endsWith("+")) {
      const base = part.slice(0, -1);
      parsePlusRange(base, weight, matrix, RANK_IDX);
      continue;
    }

    // 3. Single Hand: "AA", "AKs", "KQo", "AK"
    parseSingleHand(part, weight, matrix, RANK_IDX);
  }

  return matrix;
}

/**
 * Parses a Pio range string directly into a 169-element array of percentages (0..100).
 */
export function parsePioRangePercent(rangeStr: string): number[] {
  return parsePioRangeString(rangeStr).map((w) => Math.round(w * 1000) / 10);
}

/**
 * Formats a 169-element weight array (either 0..1 or 0..100 scale) into a PioSOLVER range string.
 */
export function formatPioRangeString(weights: number[]): string {
  if (!weights || weights.length === 0) return "";
  const maxVal = Math.max(...weights, 0);
  const scale = maxVal > 1.001 ? 0.01 : 1.0;
  const hands: string[] = [];

  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 13; c++) {
      const w = (weights[r * 13 + c] ?? 0) * scale;
      if (w > 0.001) {
        const r1 = 12 - Math.min(r, c);
        const r2 = 12 - Math.max(r, c);
        const hand = ranks[r1] + ranks[r2] + (r < c ? "s" : r > c ? "o" : "");
        if (w >= 0.999) {
          hands.push(hand);
        } else {
          hands.push(`${hand}:${w.toFixed(2)}`);
        }
      }
    }
  }
  return hands.join(",");
}

function getCellIndex(r1: number, r2: number, type: "pair" | "suited" | "offsuit"): number {
  let row = 0;
  let col = 0;
  if (type === "pair") {
    row = 12 - r1;
    col = 12 - r1;
  } else if (type === "suited") {
    const high = Math.max(r1, r2);
    const low = Math.min(r1, r2);
    row = 12 - high;
    col = 12 - low;
  } else {
    const high = Math.max(r1, r2);
    const low = Math.min(r1, r2);
    row = 12 - low;
    col = 12 - high;
  }
  return row * 13 + col;
}

function parseSingleHand(
  hand: string,
  weight: number,
  matrix: number[],
  rankIdx: Record<string, number>
) {
  if (hand.length < 2) return;
  const c1 = hand[0].toUpperCase();
  const c2 = hand[1].toUpperCase();
  const r1 = rankIdx[c1];
  const r2 = rankIdx[c2];
  if (r1 === undefined || r2 === undefined) return;

  if (r1 === r2) {
    const idx = getCellIndex(r1, r2, "pair");
    matrix[idx] = weight;
  } else if (hand.length >= 3 && hand[2].toLowerCase() === "s") {
    const idx = getCellIndex(r1, r2, "suited");
    matrix[idx] = weight;
  } else if (hand.length >= 3 && hand[2].toLowerCase() === "o") {
    const idx = getCellIndex(r1, r2, "offsuit");
    matrix[idx] = weight;
  } else {
    // Both suited and offsuit if unspecified
    const sIdx = getCellIndex(r1, r2, "suited");
    const oIdx = getCellIndex(r1, r2, "offsuit");
    matrix[sIdx] = weight;
    matrix[oIdx] = weight;
  }
}

function parsePlusRange(
  base: string,
  weight: number,
  matrix: number[],
  rankIdx: Record<string, number>
) {
  if (base.length < 2) return;
  const c1 = base[0].toUpperCase();
  const c2 = base[1].toUpperCase();
  const r1 = rankIdx[c1];
  const r2 = rankIdx[c2];
  if (r1 === undefined || r2 === undefined) return;

  if (r1 === r2) {
    // Pair: "22+" -> from r1 up to 12 (AA)
    for (let r = r1; r <= 12; r++) {
      const idx = getCellIndex(r, r, "pair");
      matrix[idx] = weight;
    }
  } else {
    const high = Math.max(r1, r2);
    const low = Math.min(r1, r2);
    const isSuited = base.length >= 3 && base[2].toLowerCase() === "s";
    const isOffsuit = base.length >= 3 && base[2].toLowerCase() === "o";

    // "A2s+" -> low goes from low up to high - 1
    for (let r = low; r < high; r++) {
      if (isSuited) {
        matrix[getCellIndex(high, r, "suited")] = weight;
      } else if (isOffsuit) {
        matrix[getCellIndex(high, r, "offsuit")] = weight;
      } else {
        matrix[getCellIndex(high, r, "suited")] = weight;
        matrix[getCellIndex(high, r, "offsuit")] = weight;
      }
    }
  }
}

function parseDashRange(
  startStr: string,
  endStr: string,
  weight: number,
  matrix: number[],
  rankIdx: Record<string, number>
) {
  if (startStr.length < 2 || endStr.length < 2) return;
  const s1 = rankIdx[startStr[0].toUpperCase()];
  const s2 = rankIdx[startStr[1].toUpperCase()];
  const e1 = rankIdx[endStr[0].toUpperCase()];
  const e2 = rankIdx[endStr[1].toUpperCase()];
  if (s1 === undefined || s2 === undefined || e1 === undefined || e2 === undefined) return;

  if (s1 === s2 && e1 === e2) {
    // Pairs: "22-77" or "JJ-22"
    const minR = Math.min(s1, e1);
    const maxR = Math.max(s1, e1);
    for (let r = minR; r <= maxR; r++) {
      matrix[getCellIndex(r, r, "pair")] = weight;
    }
  } else {
    // Non-pairs: e.g. "A9s-A2s" or "A2s-A9s"
    const high = Math.max(s1, e1);
    const minLow = Math.min(Math.min(s2, e2), high - 1);
    const maxLow = Math.min(Math.max(s2, e2), high - 1);
    const isSuited = startStr.includes("s") || endStr.includes("s");
    const isOffsuit = startStr.includes("o") || endStr.includes("o");

    for (let r = minLow; r <= maxLow; r++) {
      if (isSuited) {
        matrix[getCellIndex(high, r, "suited")] = weight;
      } else if (isOffsuit) {
        matrix[getCellIndex(high, r, "offsuit")] = weight;
      } else {
        matrix[getCellIndex(high, r, "suited")] = weight;
        matrix[getCellIndex(high, r, "offsuit")] = weight;
      }
    }
  }
}
