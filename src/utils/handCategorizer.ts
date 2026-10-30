export type MadeHandCategory =
  | "Straight Flush"
  | "Quads"
  | "Full House"
  | "Flush"
  | "Straight"
  | "Set"
  | "Trips"
  | "Two Pair"
  | "Overpair"
  | "Top Pair"
  | "Middle Pair"
  | "Weak Pair"
  | "Underpair"
  | "Ace High"
  | "No Made Hand";

export type DrawCategory =
  | "Straight Flush Draw"
  | "Nut Flush Draw"
  | "Flush Draw"
  | "Combo Draw"
  | "OESD"
  | "Gutshot"
  | "Backdoor Flush Draw"
  | "Backdoor Straight Draw"
  | "Overcards";

export interface HandEvaluation {
  madeHand: MadeHandCategory;
  draws: DrawCategory[];
  rankScore: number; // for sorting strength
}

const rankOf = (card: number) => card >>> 2;
const suitOf = (card: number) => card & 3;

const hasFiveBitRun = (mask: number): boolean =>
  (mask & (mask >>> 1) & (mask >>> 2) & (mask >>> 3) & (mask >>> 4)) !== 0;

const highestFiveBitRun = (mask: number): number => {
  const runs = mask & (mask >>> 1) & (mask >>> 2) & (mask >>> 3) & (mask >>> 4);
  if (runs === 0) return -1;
  return 31 - Math.clz32(runs) + 3; // returns high rank index (3..12)
};

// Popcount for 5-bit window (0..31)
const POPCOUNT_5 = new Uint8Array([
  0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4,
  1, 2, 2, 3, 2, 3, 3, 4, 2, 3, 3, 4, 3, 4, 4, 5,
]);

/**
 * Fast 7-card evaluator and GTO Wizard-style categorizer.
 */
export function evaluateCombo(
  c1: number,
  c2: number,
  board: number[]
): HandEvaluation {
  let maxBoardRank = -1;
  let secondBoardRank = -1;
  let minBoardRank = 99;

  const rankCounts = new Int8Array(13);
  const suitCounts = new Int8Array(4);
  const suitMasks = new Int32Array(4);
  const suitMaxRank = new Int8Array([-1, -1, -1, -1]);
  let rankMask = 0;

  const addCard = (c: number) => {
    const r = c >>> 2;
    const s = c & 3;
    rankCounts[r]++;
    suitCounts[s]++;
    const bit = (1 << (r + 1)) | (r === 12 ? 1 : 0);
    rankMask |= bit;
    suitMasks[s] |= bit;
    if (r > suitMaxRank[s]) suitMaxRank[s] = r;
  };

  addCard(c1);
  addCard(c2);

  for (let i = 0; i < board.length; i++) {
    const c = board[i];
    const r = c >>> 2;
    addCard(c);
    if (r > maxBoardRank) {
      secondBoardRank = maxBoardRank;
      maxBoardRank = r;
    } else if (r < maxBoardRank && r > secondBoardRank) {
      secondBoardRank = r;
    }
    if (r < minBoardRank) {
      minBoardRank = r;
    }
  }

  const r1 = rankOf(c1);
  const r2 = rankOf(c2);
  const isPocketPair = r1 === r2;

  // Check Flushes
  let flushSuit = -1;
  for (let s = 0; s < 4; s++) {
    if (suitCounts[s] >= 5) {
      flushSuit = s;
      break;
    }
  }

  // Check Straight Flush
  if (flushSuit !== -1) {
    const sfHigh = highestFiveBitRun(suitMasks[flushSuit]);
    if (sfHigh !== -1) {
      return {
        madeHand: "Straight Flush",
        draws: [],
        rankScore: 9000 + sfHigh,
      };
    }
  }

  // Check Quads, Trips, Pairs
  let quadsRank = -1;
  let tripsRank = -1;
  let pairRank0 = -1;
  let pairRank1 = -1;
  let pairCount = 0;

  for (let r = 12; r >= 0; r--) {
    const cnt = rankCounts[r];
    if (cnt === 4) {
      quadsRank = r;
    } else if (cnt === 3) {
      if (tripsRank === -1) {
        tripsRank = r;
      } else {
        if (pairCount === 0) pairRank0 = r;
        else if (pairCount === 1) pairRank1 = r;
        pairCount++;
      }
    } else if (cnt === 2) {
      if (pairCount === 0) pairRank0 = r;
      else if (pairCount === 1) pairRank1 = r;
      pairCount++;
    }
  }

  if (quadsRank !== -1) {
    return {
      madeHand: "Quads",
      draws: [],
      rankScore: 8000 + quadsRank,
    };
  }

  // Check Full House
  if (tripsRank !== -1 && pairCount > 0) {
    return {
      madeHand: "Full House",
      draws: [],
      rankScore: 7000 + tripsRank * 13 + pairRank0,
    };
  }

  // Check Flush
  if (flushSuit !== -1) {
    return {
      madeHand: "Flush",
      draws: [],
      rankScore: 6000 + suitMaxRank[flushSuit],
    };
  }

  // Check Straight
  const straightHigh = highestFiveBitRun(rankMask);
  if (straightHigh !== -1) {
    return {
      madeHand: "Straight",
      draws: [],
      rankScore: 5000 + straightHigh,
    };
  }

  // Three of a kind (Set vs Trips)
  if (tripsRank !== -1) {
    const draws = evaluateDraws(c1, c2, board.length, maxBoardRank, rankCounts, suitCounts, rankMask);
    if (isPocketPair && r1 === tripsRank) {
      return {
        madeHand: "Set",
        draws,
        rankScore: 4500 + tripsRank,
      };
    } else {
      return {
        madeHand: "Trips",
        draws,
        rankScore: 4000 + tripsRank,
      };
    }
  }

  // Two Pair
  if (pairCount >= 2) {
    return {
      madeHand: "Two Pair",
      draws: evaluateDraws(c1, c2, board.length, maxBoardRank, rankCounts, suitCounts, rankMask),
      rankScore: 3000 + pairRank0 * 13 + pairRank1,
    };
  }

  // One Pair breakdown: Overpair, Top Pair, Middle Pair, Weak Pair, Underpair
  if (pairCount === 1) {
    const pr = pairRank0;
    const draws = evaluateDraws(c1, c2, board.length, maxBoardRank, rankCounts, suitCounts, rankMask);
    if (isPocketPair) {
      if (pr > maxBoardRank) {
        return { madeHand: "Overpair", draws, rankScore: 2800 + pr };
      } else if (pr < minBoardRank) {
        return { madeHand: "Underpair", draws, rankScore: 2100 + pr };
      } else {
        return { madeHand: "Weak Pair", draws, rankScore: 2300 + pr };
      }
    } else {
      if (pr === maxBoardRank) {
        return { madeHand: "Top Pair", draws, rankScore: 2600 + pr };
      } else if (pr === secondBoardRank) {
        return { madeHand: "Middle Pair", draws, rankScore: 2400 + pr };
      } else {
        return { madeHand: "Weak Pair", draws, rankScore: 2200 + pr };
      }
    }
  }

  // High Cards: Ace High vs No Made Hand
  const draws = evaluateDraws(c1, c2, board.length, maxBoardRank, rankCounts, suitCounts, rankMask);
  const highHole = r1 > r2 ? r1 : r2;
  if (r1 === 12 || r2 === 12) {
    return { madeHand: "Ace High", draws, rankScore: 1000 + highHole };
  }

  return {
    madeHand: "No Made Hand",
    draws,
    rankScore: highHole,
  };
}

/**
 * Evaluates drawing potential on Flop and Turn using O(1) bitmask checks.
 */
function evaluateDraws(
  c1: number,
  c2: number,
  boardLen: number,
  maxBoardRank: number,
  rankCounts: Int8Array,
  suitCounts: Int8Array,
  rankMask: number
): DrawCategory[] {
  if (boardLen >= 5) return [];

  const draws: DrawCategory[] = [];
  const s1 = suitOf(c1);
  const s2 = suitOf(c2);
  const r1 = rankOf(c1);
  const r2 = rankOf(c2);

  // 1. Overcards
  if (r1 > maxBoardRank && r2 > maxBoardRank && r1 !== r2) {
    draws.push("Overcards");
  }

  // 2. Flush Draws
  let hasFlushDraw = false;
  let hasNutFlushDraw = false;
  let hasBackdoorFD = false;

  for (let s = 0; s < 4; s++) {
    if (s1 !== s && s2 !== s) continue;
    if (suitCounts[s] === 4) {
      hasFlushDraw = true;
      if ((s1 === s && r1 === 12) || (s2 === s && r2 === 12)) {
        hasNutFlushDraw = true;
      }
    } else if (boardLen === 3 && suitCounts[s] === 3) {
      hasBackdoorFD = true;
    }
  }

  if (hasNutFlushDraw) {
    draws.push("Nut Flush Draw");
  } else if (hasFlushDraw) {
    draws.push("Flush Draw");
  } else if (hasBackdoorFD) {
    draws.push("Backdoor Flush Draw");
  }

  // 3. Straight Draws (OESD, Gutshot, Backdoor) via bitmask
  let straightOuts = 0;
  for (let testR = 0; testR < 13; testR++) {
    if (rankCounts[testR] > 0) continue;
    const testMask = rankMask | (1 << (testR + 1)) | (testR === 12 ? 1 : 0);
    if (hasFiveBitRun(testMask)) {
      straightOuts++;
    }
  }

  const hasOESD = straightOuts >= 2;
  const hasGutshot = straightOuts === 1;

  if (hasOESD) {
    draws.push("OESD");
  } else if (hasGutshot) {
    draws.push("Gutshot");
  } else if (boardLen === 3) {
    // Check if any 5-rank window contains at least 3 ranks including a hole card
    const holeMask = (1 << (r1 + 1)) | (r1 === 12 ? 1 : 0) | (1 << (r2 + 1)) | (r2 === 12 ? 1 : 0);
    for (let w = 0; w <= 9; w++) {
      const windowMask = (rankMask >>> w) & 0x1f;
      if (POPCOUNT_5[windowMask] >= 3 && ((holeMask >>> w) & 0x1f) !== 0) {
        draws.push("Backdoor Straight Draw");
        break;
      }
    }
  }

  // 4. Combo Draw
  if (hasFlushDraw && (hasOESD || hasGutshot)) {
    draws.push("Combo Draw");
  }

  return draws;
}
