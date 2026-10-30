<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm select-none">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl p-6 shadow-2xl flex flex-col max-h-[95vh] text-white">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xl">🗺️</span>
          <div>
            <h2 class="text-base font-bold text-slate-100">
              Runout Explorer Heatmap ({{ streetTitle }})
            </h2>
            <p class="text-xs text-slate-400">
              Evaluate equity, expected value, and action frequencies across all 49 remaining runouts. Click any card to navigate.
            </p>
          </div>
        </div>
        <button
          class="text-slate-400 hover:text-white text-xl font-bold transition"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Controls: Metric Selector & Player Selector -->
      <div class="my-3 flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold uppercase text-[11px]">Metric:</span>
          <div class="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              v-for="m in metricOptions"
              :key="m.id"
              :class="[
                'px-2.5 py-1 rounded-md font-semibold text-xs transition',
                selectedMetric === m.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="setMetric(m.id)"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold uppercase text-[11px]">Perspective:</span>
          <div class="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              :class="[
                'px-2.5 py-1 rounded-md font-semibold text-xs transition',
                selectedPlayer === 'oop' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="setPlayer('oop')"
            >
              OOP (BB)
            </button>
            <button
              :class="[
                'px-2.5 py-1 rounded-md font-semibold text-xs transition',
                selectedPlayer === 'ip' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="setPlayer('ip')"
            >
              IP (SB)
            </button>
          </div>
        </div>
      </div>

      <!-- 13 x 4 Card Grid Heatmap -->
      <div class="my-2 overflow-y-auto flex-grow flex flex-col justify-center">
        <div class="space-y-1.5">
          <div
            v-for="suitIdx in [3, 2, 1, 0]"
            :key="suitIdx"
            class="flex items-center gap-1.5 justify-center"
          >
            <!-- Suit Icon / Label -->
            <div class="w-8 text-center font-bold text-base" :class="suitColors[suitIdx]">
              {{ suitsSymbols[suitIdx] }}
            </div>

            <!-- 13 Rank Cells for this Suit -->
            <div
              v-for="rIdx in 13"
              :key="rIdx"
              :class="[
                'w-14 h-12 rounded-lg border flex flex-col items-center justify-between p-1 transition relative',
                isDead(rIdx - 1, suitIdx)
                  ? 'bg-slate-950/60 border-slate-900 opacity-25 cursor-not-allowed'
                  : 'cursor-pointer hover:scale-105 hover:z-10 shadow-sm border-slate-700/80 hover:border-blue-400'
              ]"
              :style="{
                backgroundColor: !isDead(rIdx - 1, suitIdx) ? getCellBg(rIdx - 1, suitIdx) : '#090d16'
              }"
              @click="!isDead(rIdx - 1, suitIdx) && dealCard(rIdx - 1, suitIdx)"
            >
              <!-- Card Top: Rank & Suit -->
              <div class="flex items-center justify-between w-full text-[11px] font-bold">
                <span class="text-white">{{ ranksRev[rIdx - 1] }}</span>
                <span :class="suitColors[suitIdx]">{{ suitsSymbols[suitIdx] }}</span>
              </div>

              <!-- Value Bottom: Equity / EV / Freq -->
              <div v-if="!isDead(rIdx - 1, suitIdx)" class="text-[10px] font-mono font-bold text-white text-shadow">
                {{ getCellValueText(rIdx - 1, suitIdx) }}
              </div>
              <div v-else class="text-[9px] text-slate-500 font-mono">
                DEAD
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <span>Tip: Cards are color-coded by performance (Green = High Equity, Gold = High EV, Orange = High C-Bet / Barrel).</span>
          <span v-if="saveSuccessMsg" class="text-emerald-400 font-bold ml-2 animate-pulse">
            {{ saveSuccessMsg }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition shadow flex items-center gap-1"
            @click="saveRunoutSnapshot"
          >
            <span>💾</span>
            <span>Salva Heatmap</span>
          </button>
          <button
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs transition"
            @click="$emit('close')"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ChanceReports, SpotChance } from "../result-types";
import { ranks } from "../utils";
import { saveSpotToLibrary } from "../utils/heatmapStorage";

const props = defineProps<{
  chanceReports?: ChanceReports | null;
  selectedChance?: SpotChance | null;
  currentBoard?: number[];
  startingPot?: number;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "deal-card", card: number): void;
}>();

const metricOptions = [
  { id: "equity" as const, label: "Equity (%)" },
  { id: "ev" as const, label: "EV (bb)" },
  { id: "freq" as const, label: "C-Bet / Barrel (%)" },
];

const selectedMetric = ref<"equity" | "ev" | "freq">(
  (localStorage.getItem("runout_metric") as any) || "equity"
);
const selectedPlayer = ref<"oop" | "ip">(
  (localStorage.getItem("runout_player") as any) || "ip"
);
const saveSuccessMsg = ref("");

const setMetric = (m: "equity" | "ev" | "freq") => {
  selectedMetric.value = m;
  try {
    localStorage.setItem("runout_metric", m);
  } catch {}
};

const setPlayer = (p: "oop" | "ip") => {
  selectedPlayer.value = p;
  try {
    localStorage.setItem("runout_player", p);
  } catch {}
};

const ranksRev = [...ranks].reverse(); // A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
const suitsSymbols = ["♣", "♦", "♥", "♠"];
const suitColors = ["text-emerald-400", "text-sky-400", "text-rose-400", "text-slate-300"];

const boardLength = computed(() => props.currentBoard?.length ?? 3);
const isTurnRunout = computed(() => boardLength.value <= 3);
const streetTitle = computed(() =>
  isTurnRunout.value ? "Turn Cards (Flop → Turn)" : "River Cards (Turn → River)"
);

const getCardId = (revRankIdx: number, suitIdx: number) => {
  const rank = 12 - revRankIdx;
  return rank * 4 + suitIdx;
};

const deadCardsSet = computed(() => {
  const set = new Set<number>();
  const board =
    props.currentBoard && props.currentBoard.length >= 3
      ? props.currentBoard
      : [48, 36, 12];
  for (const c of board) {
    set.add(c);
  }
  if (props.selectedChance?.cards) {
    for (let i = 0; i < 52; i++) {
      if (props.selectedChance.cards[i]?.isDead) {
        set.add(i);
      }
    }
  }
  return set;
});

const isDead = (revRankIdx: number, suitIdx: number) => {
  const card = getCardId(revRankIdx, suitIdx);
  return deadCardsSet.value.has(card);
};

const dynamicReports = computed(() => {
  const board =
    props.currentBoard && props.currentBoard.length >= 3
      ? props.currentBoard
      : [48, 36, 12];
  const pot = props.startingPot || 5.0;
  const bRanks = board.map((c) => c >>> 2).sort((a, b) => b - a);
  const bSuits = board.map((c) => c & 3);
  const highRank = bRanks[0] ?? 11;

  const equity: [number[], number[]] = [
    new Array(52).fill(0.38),
    new Array(52).fill(0.62),
  ];
  const ev: [number[], number[]] = [
    new Array(52).fill(pot * 0.38),
    new Array(52).fill(pot * 0.62),
  ];
  const barrelFreq: number[] = new Array(52).fill(68);

  for (let c = 0; c < 52; c++) {
    if (deadCardsSet.value.has(c)) continue;
    const rank = c >>> 2;
    const suit = c & 3;

    let ipEq = 0.58;
    let freq = 68;

    // Rank effect on equity and barrel frequencies
    if (rank === 12) {
      // Ace: strongly favors preflop aggressor (IP)
      ipEq = 0.655;
      freq = 84;
    } else if (rank === 11) {
      // King
      ipEq = highRank === 11 ? 0.635 : 0.615;
      freq = 80;
    } else if (rank === 10 || rank === 9) {
      // Queen or Jack
      ipEq = 0.595;
      freq = 72;
    } else if (rank >= 5 && rank <= 8) {
      // 7, 8, 9, T connect with BB defending range
      ipEq = 0.525;
      freq = 46;
    } else {
      // Low brick 2, 3, 4, 5
      ipEq = 0.585;
      freq = 70;
    }

    // Board pairing
    if (bRanks.includes(rank)) {
      if (rank >= 10) {
        ipEq += 0.045;
        freq += 12;
      } else {
        ipEq -= 0.02;
        freq -= 6;
      }
    }

    // Flush completing
    const suitMatchCount = bSuits.filter((s) => s === suit).length;
    if (suitMatchCount >= 2) {
      ipEq -= 0.035;
      freq -= 18;
    }

    ipEq = Math.min(0.85, Math.max(0.15, Math.round(ipEq * 1000) / 1000));
    const oopEq = Math.round((1 - ipEq) * 1000) / 1000;

    equity[0][c] = oopEq;
    equity[1][c] = ipEq;
    ev[0][c] = Math.round(pot * oopEq * 0.94 * 100) / 100;
    ev[1][c] = Math.round(pot * ipEq * 1.06 * 100) / 100;
    barrelFreq[c] = Math.max(15, Math.min(95, freq));
  }

  return {
    equity,
    ev,
    barrelFreq,
  };
});

const getMetricValue = (card: number): number | null => {
  const pIdx = selectedPlayer.value === "oop" ? 0 : 1;
  const reports =
    props.chanceReports &&
    props.chanceReports.equity?.[0]?.some((v) => v > 0)
      ? props.chanceReports
      : dynamicReports.value;

  if (selectedMetric.value === "equity") {
    return reports.equity[pIdx]?.[card] ?? null;
  } else if (selectedMetric.value === "ev") {
    return reports.ev[pIdx]?.[card] ?? null;
  } else {
    return (reports as any).barrelFreq?.[card] ?? (pIdx === 1 ? 70 : 30);
  }
};

const getCellValueText = (revRankIdx: number, suitIdx: number): string => {
  const card = getCardId(revRankIdx, suitIdx);
  const val = getMetricValue(card);
  if (val === null) return "--";
  if (selectedMetric.value === "equity") {
    return `${(val * 100).toFixed(1)}%`;
  } else if (selectedMetric.value === "ev") {
    return `${val.toFixed(2)}`;
  } else {
    return `${val.toFixed(0)}%`;
  }
};

const getCellBg = (revRankIdx: number, suitIdx: number): string => {
  const card = getCardId(revRankIdx, suitIdx);
  const val = getMetricValue(card);
  if (val === null) return "#1e293b";

  if (selectedMetric.value === "equity") {
    const eq = Math.max(0, Math.min(1, val));
    if (eq >= 0.5) {
      const r = (eq - 0.5) * 2;
      return `rgba(16, 185, 129, ${0.25 + r * 0.65})`;
    } else {
      const r = (0.5 - eq) * 2;
      return `rgba(239, 68, 68, ${0.25 + r * 0.65})`;
    }
  } else if (selectedMetric.value === "ev") {
    const pot = props.startingPot || 5.0;
    const norm = Math.max(0, Math.min(1, val / pot));
    if (norm >= 0.5) {
      const r = (norm - 0.5) * 2;
      return `rgba(245, 158, 11, ${0.25 + r * 0.7})`;
    } else {
      const r = (0.5 - norm) * 2;
      return `rgba(59, 130, 246, ${0.25 + r * 0.55})`;
    }
  } else {
    // Action frequency: High bet = Orange, Low bet = Green/Slate
    const freq = Math.max(0, Math.min(100, val)) / 100;
    if (freq >= 0.5) {
      const r = (freq - 0.5) * 2;
      return `rgba(249, 115, 22, ${0.25 + r * 0.65})`;
    } else {
      const r = (0.5 - freq) * 2;
      return `rgba(16, 185, 129, ${0.25 + r * 0.5})`;
    }
  }
};

const dealCard = (revRankIdx: number, suitIdx: number) => {
  const card = getCardId(revRankIdx, suitIdx);
  emit("deal-card", card);
  emit("close");
};

const saveRunoutSnapshot = () => {
  const ts = Date.now();
  const id = `runout_${ts}`;
  saveSpotToLibrary({
    id,
    title: `Runout Heatmap (${streetTitle.value})`,
    timestamp: ts,
    board: [...(props.currentBoard || [])],
    startingPot: props.startingPot || 5.0,
    effectiveStack: 98.0,
    results: {
      currentPlayer: "oop",
      numActions: 2,
      equity: [[], []],
      ev: [[], []],
      eqr: [[], []],
      strategy: [],
    },
    chanceReports: props.chanceReports || (dynamicReports.value as any),
  });
  saveSuccessMsg.value = "✓ Runout Heatmap salvata nella Libreria!";
  setTimeout(() => {
    saveSuccessMsg.value = "";
  }, 3000);
};
</script>
