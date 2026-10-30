<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm select-none">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col text-white">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xl">🔒</span>
          <div>
            <h2 class="text-base font-bold text-slate-100">Interactive Node Locking</h2>
            <p class="text-xs text-slate-400">
              Fix opponent or hero strategies to compute the maximal exploitative response.
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

      <!-- Content -->
      <div class="my-4 space-y-4 text-xs">
        <!-- 0. Target Player Selector -->
        <div class="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span class="text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
            Player to Lock:
          </span>
          <div class="flex gap-2">
            <button
              :class="[
                'px-3 py-1 rounded-lg font-bold text-xs transition border',
                targetPlayer === 'oop'
                  ? 'bg-blue-600 text-white border-blue-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              ]"
              @click="targetPlayer = 'oop'"
            >
              OOP (BB)
            </button>
            <button
              :class="[
                'px-3 py-1 rounded-lg font-bold text-xs transition border',
                targetPlayer === 'ip'
                  ? 'bg-amber-600 text-white border-amber-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              ]"
              @click="targetPlayer = 'ip'"
            >
              IP (SB)
            </button>
          </div>
        </div>

        <!-- 1. Category Selection -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
            1. Select Combos to Lock
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="cat in quickCategories"
              :key="cat.id"
              :class="[
                'px-2.5 py-2 rounded-lg font-semibold text-xs border text-left transition',
                selectedCategory === cat.id
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              ]"
              @click="selectedCategory = cat.id"
            >
              <div class="font-bold truncate">{{ cat.name }}</div>
              <div class="text-[10px] text-slate-500 truncate">{{ cat.desc }}</div>
            </button>
          </div>
        </div>

        <!-- 2. 1-Click Action Presets -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
            2. Quick Presets (1-Click)
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in actionPresets"
              :key="preset.label"
              class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition active:scale-95"
              @click="applyPreset(preset.weights)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- 3. Fine-Tune Sliders -->
        <div>
          <label class="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
            3. Fine-Tune Action Frequencies (Normalized to 100%)
          </label>
          <div class="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div
              v-for="(act, idx) in availableActions"
              :key="idx"
              class="flex items-center gap-3"
            >
              <span class="w-28 font-bold text-slate-300 truncate">{{ act.name }}</span>
              <input
                v-model.number="actionWeights[idx]"
                type="range"
                min="0"
                max="100"
                class="flex-grow accent-amber-500 cursor-pointer"
                @input="normalizeWeights(idx)"
              />
              <span class="w-12 text-right font-mono font-bold text-amber-400">
                {{ actionWeights[idx] }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Status / Feedback Banner -->
        <div v-if="statusMsg" class="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium">
          {{ statusMsg }}
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-3 border-t border-slate-800 flex items-center justify-between">
        <button
          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg font-semibold text-xs transition"
          @click="resetLock"
        >
          Reset All Locks
        </button>

        <div class="flex gap-2">
          <button
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs transition"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            class="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs transition shadow"
            @click="applyLock"
          >
            Lock & Exploit Re-Solve
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Spot } from "../result-types";
import { lockNodeStrategy, resetNodeLocks } from "../invokes";

const props = defineProps<{
  selectedSpot: Spot;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "lock-applied"): void;
}>();

const targetPlayer = ref<"oop" | "ip">(
  props.selectedSpot.type === "player" ? props.selectedSpot.player : "oop"
);

const selectedCategory = ref("all_range");
const statusMsg = ref("");

const quickCategories = [
  { id: "all_range", name: "Entire Range", desc: "100% of combos" },
  { id: "nuts", name: "Nuts & Monsters", desc: "Sets, Flushes, Straights" },
  { id: "overpair", name: "Overpairs", desc: "AA, KK, QQ higher than board" },
  { id: "top_pair", name: "Top Pair +", desc: "TPGK & top pairs" },
  { id: "medium_pairs", name: "Medium Pairs", desc: "Middle & weak pairs" },
  { id: "flush_draw", name: "Flush Draws", desc: "Nut & regular draws" },
  { id: "straight_draw", name: "Straight Draws", desc: "OESD & gutshots" },
  { id: "air", name: "Air / Missed", desc: "Ace high & missed combos" },
];

const availableActions = computed(() => {
  if (props.selectedSpot.type === "player") {
    return props.selectedSpot.actions;
  }
  return [
    { name: "Check / Call" },
    { name: "Bet / Raise" },
  ];
});

const actionWeights = ref<number[]>([]);

watch(
  availableActions,
  (actions) => {
    actionWeights.value = actions.map((_, i) => (i === 0 ? 100 : 0));
  },
  { immediate: true }
);

const actionPresets = computed(() => {
  const acts = availableActions.value;
  if (acts.length === 3 && acts[0].name === "Fold") {
    return [
      { label: "100% Fold", weights: [100, 0, 0] },
      { label: "100% Call", weights: [0, 100, 0] },
      { label: "100% Raise", weights: [0, 0, 100] },
      { label: "50% Call / 50% Fold", weights: [50, 50, 0] },
    ];
  }
  if (acts.length === 3) {
    return [
      { label: "100% Check", weights: [100, 0, 0] },
      { label: "100% Bet 33%", weights: [0, 100, 0] },
      { label: "100% Bet 75%", weights: [0, 0, 100] },
      { label: "50% Check / 50% Bet 33%", weights: [50, 50, 0] },
      { label: "33% Mix All", weights: [33, 33, 34] },
    ];
  }
  return [
    { label: "100% Action 1", weights: [100, 0] },
    { label: "100% Action 2", weights: [0, 100] },
    { label: "50% / 50% Split", weights: [50, 50] },
  ];
});

const applyPreset = (weights: number[]) => {
  actionWeights.value = [...weights];
};

const normalizeWeights = (changedIdx: number) => {
  const val = Math.max(0, Math.min(100, actionWeights.value[changedIdx] || 0));
  actionWeights.value[changedIdx] = val;
  const remaining = 100 - val;
  const otherIndices = actionWeights.value
    .map((_, i) => i)
    .filter((i) => i !== changedIdx);

  if (otherIndices.length === 1) {
    actionWeights.value[otherIndices[0]] = remaining;
  } else if (otherIndices.length > 1) {
    const otherSum = otherIndices.reduce(
      (sum, i) => sum + (actionWeights.value[i] || 0),
      0
    );
    if (otherSum === 0) {
      const split = Math.floor(remaining / otherIndices.length);
      otherIndices.forEach((i, idx) => {
        actionWeights.value[i] =
          idx === 0 ? remaining - split * (otherIndices.length - 1) : split;
      });
    } else {
      let allocated = 0;
      otherIndices.forEach((i, idx) => {
        if (idx === otherIndices.length - 1) {
          actionWeights.value[i] = Math.max(0, remaining - allocated);
        } else {
          const share = Math.round(
            (actionWeights.value[i] / otherSum) * remaining
          );
          actionWeights.value[i] = share;
          allocated += share;
        }
      });
    }
  }
};

const applyLock = () => {
  lockNodeStrategy(selectedCategory.value, actionWeights.value, targetPlayer.value);
  statusMsg.value = `✓ Locked ${selectedCategory.value} strategy for ${targetPlayer.value.toUpperCase()}. Exploitative adjustments computed!`;
  setTimeout(() => {
    emit("lock-applied");
    emit("close");
  }, 500);
};

const resetLock = () => {
  resetNodeLocks();
  actionWeights.value = availableActions.value.map((_, i) => (i === 0 ? 100 : 0));
  statusMsg.value = "Node locks reset to GTO equilibrium.";
  emit("lock-applied");
};
</script>
