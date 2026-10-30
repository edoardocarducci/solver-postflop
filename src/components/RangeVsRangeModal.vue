<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm select-none">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[90vh] text-white">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xl">📊</span>
          <h2 class="text-base font-bold text-slate-100">
            Range vs Range Comparison (Equity & EV Distribution)
          </h2>
        </div>
        <button
          class="text-slate-400 hover:text-white text-xl font-bold transition"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Main Content -->
      <div class="my-4 overflow-y-auto space-y-6 pr-1 text-xs">
        <!-- High-level Metric Cards (OOP vs IP) -->
        <div class="grid grid-cols-2 gap-4">
          <!-- OOP Card -->
          <div class="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-amber-400">OOP (BB)</span>
              <span class="text-xs text-slate-400">{{ metrics.oop.totalCombos.toFixed(1) }} Combos</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-slate-900 p-2 rounded-lg">
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">Equity</span>
                <span class="text-base font-bold text-emerald-400">
                  {{ (metrics.oop.equity * 100).toFixed(1) }}%
                </span>
              </div>
              <div class="bg-slate-900 p-2 rounded-lg">
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">EV</span>
                <span class="text-base font-bold text-amber-300">
                  {{ metrics.oop.ev.toFixed(2) }}
                </span>
              </div>
              <div class="bg-slate-900 p-2 rounded-lg">
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">EQR</span>
                <span class="text-base font-bold text-sky-400">
                  {{ (metrics.oop.eqr * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- IP Card -->
          <div class="bg-slate-950 p-4 rounded-xl border border-sky-500/30">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-bold text-sky-400">IP (SB)</span>
              <span class="text-xs text-slate-400">{{ metrics.ip.totalCombos.toFixed(1) }} Combos</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-slate-900 p-2 rounded-lg">
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">Equity</span>
                <span class="text-base font-bold text-emerald-400">
                  {{ (metrics.ip.equity * 100).toFixed(1) }}%
                </span>
              </div>
              <div class="bg-slate-900 p-2 rounded-lg">
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">EV</span>
                <span class="text-base font-bold text-amber-300">
                  {{ metrics.ip.ev.toFixed(2) }}
                </span>
              </div>
              <div class="bg-slate-900 p-2 rounded-lg">
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">EQR</span>
                <span class="text-base font-bold text-sky-400">
                  {{ (metrics.ip.eqr * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Advantage Summary Banner -->
        <div class="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 rounded-lg border border-slate-800 text-xs">
          <div>
            <span class="text-slate-400">Range Advantage:</span>
            <strong :class="metrics.ip.equity > metrics.oop.equity ? 'text-sky-400 ml-1' : 'text-amber-400 ml-1'">
              {{ metrics.ip.equity > metrics.oop.equity ? "IP (SB)" : "OOP (BB)" }} (+{{ Math.abs((metrics.ip.equity - metrics.oop.equity) * 100).toFixed(1) }}%)
            </strong>
          </div>
          <div>
            <span class="text-slate-400">Nut Advantage (≥80% EQ):</span>
            <strong :class="metrics.ip.nutsCount > metrics.oop.nutsCount ? 'text-sky-400 ml-1' : 'text-amber-400 ml-1'">
              {{ metrics.ip.nutsCount > metrics.oop.nutsCount ? "IP" : "OOP" }} ({{ metrics.oop.nutsCount.toFixed(1) }} vs {{ metrics.ip.nutsCount.toFixed(1) }} combos)
            </strong>
          </div>
        </div>

        <!-- Equity Buckets Histogram (Deciles: 0-10% to 90-100%) -->
        <div>
          <h3 class="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
            Equity Distribution Buckets (Deciles)
          </h3>
          <div class="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div
              v-for="b in decileBuckets"
              :key="b.label"
              class="flex items-center gap-3 text-[11px]"
            >
              <span class="w-16 font-mono text-slate-400 text-right">{{ b.label }}</span>

              <!-- Split Dual Progress Bar -->
              <div class="flex-grow flex items-center gap-1 h-5">
                <!-- OOP (Left Bar) -->
                <div class="w-1/2 flex justify-end bg-slate-900 rounded-l h-full overflow-hidden">
                  <div
                    class="bg-amber-500 h-full transition-all"
                    :style="{ width: `${b.oopPct * 100}%` }"
                    :title="`OOP: ${(b.oopPct * 100).toFixed(1)}% (${b.oopCombos.toFixed(1)} combos)`"
                  ></div>
                </div>

                <!-- IP (Right Bar) -->
                <div class="w-1/2 flex justify-start bg-slate-900 rounded-r h-full overflow-hidden">
                  <div
                    class="bg-sky-500 h-full transition-all"
                    :style="{ width: `${b.ipPct * 100}%` }"
                    :title="`IP: ${(b.ipPct * 100).toFixed(1)}% (${b.ipCombos.toFixed(1)} combos)`"
                  ></div>
                </div>
              </div>

              <!-- Pct Labels -->
              <span class="w-24 text-[10px] font-mono text-slate-400 text-right">
                <span class="text-amber-400">{{ (b.oopPct * 100).toFixed(1) }}%</span> /
                <span class="text-sky-400">{{ (b.ipPct * 100).toFixed(1) }}%</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
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
import { computed } from "vue";
import { Results } from "../result-types";

const props = defineProps<{
  results: Results;
  cards: number[][];
}>();

defineEmits<{
  (event: "close"): void;
}>();

const computePlayerMetrics = (pIdx: number) => {
  const cardsList = props.cards[pIdx] || [];
  const results = props.results;

  let totalWeight = 0;
  let sumEq = 0;
  let sumEv = 0;
  let sumEqr = 0;
  let nutsCount = 0;

  for (let i = 0; i < cardsList.length; i++) {
    const w = results.weights[pIdx]?.[i] ?? 0;
    if (w <= 0.0001) continue;

    totalWeight += w;
    const eq = results.equity[pIdx]?.[i] ?? 0;
    const ev = results.ev[pIdx]?.[i] ?? 0;
    const eqr = results.eqr[pIdx]?.[i] ?? 0;

    sumEq += eq * w;
    sumEv += ev * w;
    sumEqr += eqr * w;

    if (eq >= 0.8) {
      nutsCount += w;
    }
  }

  return {
    totalCombos: totalWeight,
    equity: totalWeight > 0 ? sumEq / totalWeight : 0,
    ev: totalWeight > 0 ? sumEv / totalWeight : 0,
    eqr: totalWeight > 0 ? sumEqr / totalWeight : 0,
    nutsCount,
  };
};

const metrics = computed(() => {
  return {
    oop: computePlayerMetrics(0),
    ip: computePlayerMetrics(1),
  };
});

const decileBuckets = computed(() => {
  const buckets = [
    "0-10%",
    "10-20%",
    "20-30%",
    "30-40%",
    "40-50%",
    "50-60%",
    "60-70%",
    "70-80%",
    "80-90%",
    "90-100%",
  ].map((label) => ({
    label,
    oopCombos: 0,
    ipCombos: 0,
    oopPct: 0,
    ipPct: 0,
  }));

  const results = props.results;

  for (let pIdx = 0; pIdx < 2; pIdx++) {
    const cardsList = props.cards[pIdx] || [];
    const totalCombos = pIdx === 0 ? metrics.value.oop.totalCombos : metrics.value.ip.totalCombos;

    for (let i = 0; i < cardsList.length; i++) {
      const w = results.weights[pIdx]?.[i] ?? 0;
      if (w <= 0.0001) continue;

      const eq = results.equity[pIdx]?.[i] ?? 0;
      const bIdx = Math.min(9, Math.max(0, Math.floor(eq * 10)));

      if (pIdx === 0) {
        buckets[bIdx].oopCombos += w;
      } else {
        buckets[bIdx].ipCombos += w;
      }
    }

    if (totalCombos > 0) {
      for (const b of buckets) {
        if (pIdx === 0) {
          b.oopPct = b.oopCombos / totalCombos;
        } else {
          b.ipPct = b.ipCombos / totalCombos;
        }
      }
    }
  }

  return buckets;
});
</script>
