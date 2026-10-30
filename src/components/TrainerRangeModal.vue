<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm select-none">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl p-6 shadow-2xl flex flex-col max-h-[95vh] text-white">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xl">👁️</span>
          <div>
            <h2 class="text-base font-bold text-slate-100">
              Solution Ranges — {{ spotTitle }}
            </h2>
            <p class="text-xs text-slate-400">
              Inspect the exact preflop ranges used to compute the GTO solution for this spot.
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

      <!-- Controls: Player Tab & Spot Preset Selector -->
      <div class="my-3 flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <!-- Player Tab Selector -->
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold uppercase text-[11px]">View Player:</span>
          <div class="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              :class="[
                'px-3 py-1 rounded-md font-semibold text-xs transition',
                activePlayer === 0 ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="activePlayer = 0"
            >
              OOP (BB) {{ heroRole === 'BB' ? '(Hero)' : '(Villain)' }}
            </button>
            <button
              :class="[
                'px-3 py-1 rounded-md font-semibold text-xs transition',
                activePlayer === 1 ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="activePlayer = 1"
            >
              IP (SB) {{ heroRole === 'SB' ? '(Hero)' : '(Villain)' }}
            </button>
            <button
              :class="[
                'px-3 py-1 rounded-md font-semibold text-xs transition',
                activePlayer === -1 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="activePlayer = -1"
            >
              Side-by-Side (Both)
            </button>
          </div>
        </div>

        <!-- Range Stats Badge -->
        <div class="flex items-center gap-3 text-xs font-mono">
          <div class="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            <span class="text-slate-400">Combos:</span>
            <strong class="text-emerald-400 ml-1">{{ currentStats.totalCombos.toFixed(1) }}</strong>
          </div>
          <div class="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            <span class="text-slate-400">Coverage:</span>
            <strong class="text-blue-400 ml-1">{{ currentStats.percentage.toFixed(1) }}%</strong>
          </div>
        </div>
      </div>

      <!-- Matrix Container -->
      <div class="my-2 overflow-y-auto flex-grow flex items-center justify-center p-2">
        <!-- Single Player Detailed Matrix -->
        <div v-if="activePlayer !== -1" class="flex flex-col items-center">
          <table class="shadow-2xl border-collapse border border-black bg-slate-950">
            <tbody>
              <tr v-for="row in 13" :key="row" class="h-9">
                <td
                  v-for="col in 13"
                  :key="col"
                  :class="[
                    'relative w-9 h-9 border border-black/80 text-center transition cursor-pointer select-none',
                    isHeroCell(row, col) ? 'ring-2 ring-amber-400 z-10 scale-105 shadow-lg' : ''
                  ]"
                  @mouseenter="hoveredCell = { row, col }"
                  @mouseleave="hoveredCell = null"
                >
                  <!-- Background fill reflecting frequency -->
                  <div
                    class="absolute inset-0 transition-all"
                    :style="{
                      backgroundColor: cellBgColor(activePlayer, row, col),
                      height: `${cellWeight(activePlayer, row, col)}%`,
                      bottom: 0,
                      top: 'auto'
                    }"
                  ></div>

                  <!-- Hand Label -->
                  <div
                    :class="[
                      'absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold z-10',
                      cellWeight(activePlayer, row, col) > 0 ? 'text-white text-shadow' : 'text-slate-600'
                    ]"
                  >
                    <span>{{ cellHandText(row, col) }}</span>
                    <span
                      v-if="cellWeight(activePlayer, row, col) > 0 && cellWeight(activePlayer, row, col) < 100"
                      class="text-[8px] text-amber-200 font-mono -mt-1"
                    >
                      {{ cellWeight(activePlayer, row, col).toFixed(0) }}%
                    </span>
                  </div>

                  <!-- Hero Hand Indicator Badge -->
                  <div
                    v-if="isHeroCell(row, col)"
                    class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-black z-20 animate-ping"
                  ></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Side-by-Side Dual Matrix -->
        <div v-else class="flex flex-wrap items-center justify-center gap-8 w-full">
          <!-- OOP Grid -->
          <div class="flex flex-col items-center">
            <h4 class="text-xs font-bold text-amber-400 mb-2">OOP (BB) Range</h4>
            <table class="shadow-xl border-collapse border border-black bg-slate-950">
              <tbody>
                <tr v-for="row in 13" :key="'oop-' + row" class="h-6">
                  <td
                    v-for="col in 13"
                    :key="'oop-col-' + col"
                    class="relative w-6 h-6 border border-black/60 text-center select-none"
                  >
                    <div
                      class="absolute inset-0 bg-amber-500"
                      :style="{
                        height: `${cellWeight(0, row, col)}%`,
                        bottom: 0,
                        top: 'auto'
                      }"
                    ></div>
                    <div
                      :class="[
                        'absolute inset-0 flex items-center justify-center text-[8px] font-bold z-10',
                        cellWeight(0, row, col) > 0 ? 'text-white' : 'text-slate-700'
                      ]"
                    >
                      {{ cellHandText(row, col) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- IP Grid -->
          <div class="flex flex-col items-center">
            <h4 class="text-xs font-bold text-sky-400 mb-2">IP (SB) Range</h4>
            <table class="shadow-xl border-collapse border border-black bg-slate-950">
              <tbody>
                <tr v-for="row in 13" :key="'ip-' + row" class="h-6">
                  <td
                    v-for="col in 13"
                    :key="'ip-col-' + col"
                    class="relative w-6 h-6 border border-black/60 text-center select-none"
                  >
                    <div
                      class="absolute inset-0 bg-sky-500"
                      :style="{
                        height: `${cellWeight(1, row, col)}%`,
                        bottom: 0,
                        top: 'auto'
                      }"
                    ></div>
                    <div
                      :class="[
                        'absolute inset-0 flex items-center justify-center text-[8px] font-bold z-10',
                        cellWeight(1, row, col) > 0 ? 'text-white' : 'text-slate-700'
                      ]"
                    >
                      {{ cellHandText(row, col) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Cell Hover Details & Pio String Export -->
      <div class="my-2 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
          <span v-if="hoveredCell" class="text-slate-300 font-mono">
            Hand: <strong class="text-white text-sm">{{ cellHandText(hoveredCell.row, hoveredCell.col) }}</strong> |
            Weight: <strong class="text-amber-400">{{ cellWeight(activePlayer === -1 ? 0 : activePlayer, hoveredCell.row, hoveredCell.col).toFixed(1) }}%</strong>
          </span>
          <span v-else class="text-slate-500 italic">
            Hover over any hand in the grid to inspect exact weights.
          </span>
          <span v-if="heroHoleCards.length === 2" class="text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            ★ Hero Hand: {{ heroHandName }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition"
            @click="copyRangePio"
          >
            {{ copyStatus || 'Copy Pio Range' }}
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-800 flex justify-end">
        <button
          class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs transition"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useStore } from "../store";
import { ranks, cardPairCellIndex } from "../utils";
import { formatPioRangeString } from "../utils/rangeParser";

const props = defineProps<{
  heroHoleCards: number[];
  heroRole: "BB" | "SB";
  spotTitle?: string;
}>();

defineEmits<{
  (event: "close"): void;
}>();

const store = useStore();
const activePlayer = ref<number>(props.heroRole === "BB" ? 0 : 1);
const hoveredCell = ref<{ row: number; col: number } | null>(null);
const copyStatus = ref("");

const spotTitle = computed(() => props.spotTitle || "6-Max Cash 100bb");

const cellHandText = (row: number, col: number) => {
  const r1 = 13 - Math.min(row, col);
  const r2 = 13 - Math.max(row, col);
  return ranks[r1] + ranks[r2] + ["s", "", "o"][Math.sign(row - col) + 1];
};

const cellWeight = (playerIdx: number, row: number, col: number): number => {
  const idx = 13 * (row - 1) + (col - 1);
  const range = store.ranges[playerIdx];
  if (range && range[idx] !== undefined) {
    const maxW = Math.max(...range);
    const scale = maxW > 1.0 ? 1.0 : 100.0;
    return range[idx] * scale;
  }
  return playerIdx === 0 ? 16.5 : 16.2;
};

const cellBgColor = (playerIdx: number, row: number, col: number): string => {
  const w = cellWeight(playerIdx, row, col);
  if (w <= 0) return "#1e293b";
  return playerIdx === 0 ? "#f59e0b" : "#0284c7"; // Amber for OOP, Sky for IP
};

// Check if cell corresponds to Hero's current hole cards
const isHeroCell = (row: number, col: number): boolean => {
  if (props.heroHoleCards.length !== 2) return false;
  const { row: hRow, col: hCol } = cardPairCellIndex(
    props.heroHoleCards[0],
    props.heroHoleCards[1]
  );
  return row - 1 === hRow && col - 1 === hCol;
};

const heroHandName = computed(() => {
  if (props.heroHoleCards.length !== 2) return "";
  const { row, col } = cardPairCellIndex(
    props.heroHoleCards[0],
    props.heroHoleCards[1]
  );
  return cellHandText(row + 1, col + 1);
});

const currentStats = computed(() => {
  const pIdx = activePlayer.value === -1 ? 0 : activePlayer.value;
  let totalCombos = 0;
  for (let r = 1; r <= 13; r++) {
    for (let c = 1; c <= 13; c++) {
      const w = cellWeight(pIdx, r, c) / 100;
      const numCombos = r === c ? 6 : r < c ? 4 : 12;
      totalCombos += w * numCombos;
    }
  }
  const percentage = (totalCombos / 1326) * 100;
  return { totalCombos, percentage };
});

const copyRangePio = () => {
  const pIdx = activePlayer.value === -1 ? 0 : activePlayer.value;
  const pioStr = formatPioRangeString(store.ranges[pIdx] || []);
  navigator.clipboard.writeText(pioStr);
  copyStatus.value = "✓ Copied!";
  setTimeout(() => {
    copyStatus.value = "";
  }, 2000);
};
</script>
