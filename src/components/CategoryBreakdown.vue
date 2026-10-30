<template>
  <div class="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-white text-xs select-none">
    <!-- Header with GTO Wizard Styling -->
    <div class="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="font-bold text-slate-200 tracking-wide">Hand Classes & Bet Strategy</span>
      </div>
      <div class="flex items-center gap-1 text-[11px]">
        <button
          v-if="selectedCategories.length > 0 || activeSuitFilter !== 'all'"
          class="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold border border-rose-500/30 transition"
          @click="clearFilters"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Suit Filters Bar -->
    <div class="px-3 py-1 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1 overflow-x-auto">
      <span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1">Blocker:</span>
      <button
        v-for="sf in suitFilters"
        :key="sf.id"
        :class="[
          'px-2 py-0.5 rounded text-[11px] font-semibold transition',
          activeSuitFilter === sf.id
            ? 'bg-blue-600 text-white shadow'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        ]"
        @click="activeSuitFilter = sf.id"
      >
        <span v-if="sf.symbol" :class="sf.color" class="mr-0.5">{{ sf.symbol }}</span>
        {{ sf.label }}
      </button>

      <!-- Sort Toggle -->
      <div class="ml-auto flex items-center gap-1">
        <button
          :class="[
            'px-2 py-0.5 rounded text-[10px] font-semibold transition',
            sortByStrength ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          ]"
          title="Sort by Hand Strength: Nuts to Air"
          @click="sortByStrength = !sortByStrength"
        >
          {{ sortByStrength ? '🏆 Nuts → Air' : '🔢 Combos' }}
        </button>
      </div>
    </div>

    <!-- Mode Tabs: Made Hands vs Draws vs Bet Strategy -->
    <div class="flex border-b border-slate-800 bg-slate-950">
      <button
        :class="[
          'flex-1 py-1.5 text-center font-bold text-xs transition border-b-2',
          activeTab === 'made'
            ? 'border-blue-500 text-blue-400 bg-slate-900/50'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
        @click="activeTab = 'made'"
      >
        Made Hands ({{ madeCategories.length }})
      </button>
      <button
        :class="[
          'flex-1 py-1.5 text-center font-bold text-xs transition border-b-2',
          activeTab === 'draws'
            ? 'border-blue-500 text-blue-400 bg-slate-900/50'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
        @click="activeTab = 'draws'"
      >
        Draws ({{ drawCategories.length }})
      </button>
      <button
        :class="[
          'flex-1 py-1.5 text-center font-bold text-xs transition border-b-2',
          activeTab === 'strategy'
            ? 'border-amber-500 text-amber-400 bg-slate-900/50'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        ]"
        @click="activeTab = 'strategy'"
      >
        🎯 Bet Strategy
      </button>
    </div>

    <!-- Quick Filter Shortcuts -->
    <div class="px-2 py-1 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 text-[10px] overflow-x-auto">
      <span class="text-slate-500 font-semibold uppercase">Quick:</span>
      <button
        class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
        @click="selectQuickGroup('top_pair')"
      >
        Top Pair +
      </button>
      <button
        class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
        @click="selectQuickGroup('draws')"
      >
        All Draws
      </button>
      <button
        class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
        @click="selectQuickGroup('air')"
      >
        Air / Bluffs
      </button>
    </div>

    <!-- 1. Categories List (Made Hands & Draws) -->
    <div v-if="activeTab !== 'strategy'" class="flex-grow overflow-y-auto px-2 py-2 space-y-1.5">
      <div
        v-for="cat in displayCategories"
        :key="cat.name"
        :class="[
          'p-2 rounded-lg border transition cursor-pointer',
          selectedCategories.includes(cat.name)
            ? 'bg-blue-900/30 border-blue-500/80 shadow-md ring-1 ring-blue-500/50'
            : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80'
        ]"
        @click="toggleCategory(cat.name)"
      >
        <!-- Category Title & Stats -->
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            <span
              :class="[
                'w-2 h-2 rounded-full',
                selectedCategories.includes(cat.name) ? 'bg-blue-400 ring-2 ring-blue-400/50' : 'bg-slate-600'
              ]"
            ></span>
            <span class="font-bold text-slate-200">{{ cat.name }}</span>
          </div>
          <div class="flex items-center gap-2 text-[11px]">
            <span class="text-slate-400 font-mono">{{ cat.combos.toFixed(1) }} combos</span>
            <span class="font-bold text-slate-200 font-mono">{{ cat.percentage.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- Stacked Action Frequency Bar (GTO Wizard Style) -->
        <div class="w-full h-3 bg-slate-800 rounded-sm overflow-hidden flex my-1 border border-black/40">
          <div
            v-for="(act, idx) in cat.actionFrequencies"
            :key="idx"
            :style="{
              width: `${act.freq * 100}%`,
              backgroundColor: act.color
            }"
            class="h-full transition-all"
            :title="`${act.name}: ${(act.freq * 100).toFixed(1)}%`"
          ></div>
        </div>

        <!-- EV & Equity Metrics -->
        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Equity: <strong class="text-emerald-400">{{ (cat.avgEquity * 100).toFixed(1) }}%</strong></span>
          <span>Avg EV: <strong class="text-amber-400">{{ cat.avgEv.toFixed(2) }}</strong></span>
        </div>
      </div>

      <div v-if="displayCategories.length === 0" class="text-center py-6 text-slate-500">
        No combos in range for this category.
      </div>
    </div>

    <!-- 2. Bet Strategy Construction Explorer -->
    <div v-else class="flex-grow overflow-y-auto px-3 py-2 space-y-3">
      <div>
        <label class="block text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
          Select Action to Deconstruct:
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(act, idx) in availableActionsList"
            :key="idx"
            :class="[
              'px-2.5 py-1 rounded-md font-bold text-xs border transition',
              selectedActionIdx === idx
                ? 'bg-amber-600 text-white border-amber-500 shadow'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            ]"
            @click="selectedActionIdx = idx"
          >
            {{ act.name }}
          </button>
        </div>
      </div>

      <!-- Action Composition Analysis -->
      <div v-if="currentActionComposition" class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
          <span class="text-slate-300 font-bold">{{ currentActionComposition.actionName }} Overall</span>
          <span class="font-mono text-amber-400 font-bold">
            {{ currentActionComposition.overallFreq.toFixed(1) }}% of Range
          </span>
        </div>

        <p class="text-[11px] text-slate-400 leading-tight">
          What classes of hands make up this action range? (Used to construct polarized or linear bets):
        </p>

        <div class="space-y-1.5 pt-1">
          <div
            v-for="comp in currentActionComposition.breakdown"
            :key="comp.name"
            class="space-y-0.5 cursor-pointer hover:bg-slate-900 p-1 rounded transition"
            @click="toggleCategory(comp.name)"
          >
            <div class="flex justify-between text-[11px]">
              <span class="text-slate-300">{{ comp.name }}</span>
              <span class="font-mono text-slate-200">
                <strong>{{ comp.percentOfAction.toFixed(1) }}%</strong>
                <span class="text-slate-500 ml-1">({{ comp.combosInAction.toFixed(1) }} combos)</span>
              </span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-amber-500 rounded-full"
                :style="{ width: `${comp.percentOfAction}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filter Summary Footer -->
    <div
      v-if="selectedCategories.length > 0"
      class="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-300"
    >
      <span>Filtering: <strong>{{ selectedCategories.length }}</strong> categories</span>
      <span class="text-blue-400 font-semibold">{{ filteredCombosTotal.toFixed(1) }} combos</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Results, Spot } from "../result-types";
import { evaluateCombo, MadeHandCategory, DrawCategory } from "../utils/handCategorizer";
import { cardPairCellIndex } from "../utils";

interface ActionFreq {
  name: string;
  freq: number;
  color: string;
}

interface CategoryRow {
  name: string;
  combos: number;
  percentage: number;
  avgEquity: number;
  avgEv: number;
  actionFrequencies: ActionFreq[];
  cellIndices: Set<number>;
  strengthScore: number;
}

const props = defineProps<{
  cards: number[][];
  currentBoard: number[];
  results: Results;
  selectedSpot: Spot;
  displayPlayer: "oop" | "ip";
}>();

const emit = defineEmits<{
  (event: "update:filtered-cells", cells: Set<number> | null): void;
}>();

const activeTab = ref<"made" | "draws" | "strategy">("made");
const selectedCategories = ref<string[]>([]);
const activeSuitFilter = ref<string>("all");
const sortByStrength = ref(true);
const selectedActionIdx = ref(0);

const suitFilters = [
  { id: "all", label: "All" },
  { id: "spades", label: "♠ Block", symbol: "♠", color: "text-blue-400" },
  { id: "hearts", label: "♥ Block", symbol: "♥", color: "text-rose-400" },
  { id: "diamonds", label: "♦ Block", symbol: "♦", color: "text-sky-400" },
  { id: "clubs", label: "♣ Block", symbol: "♣", color: "text-emerald-400" },
];

const actionColors = [
  "#ef4444", // Red (All-in/Large Bet)
  "#f97316", // Orange (Medium Bet)
  "#f59e0b", // Amber (Small Bet)
  "#10b981", // Green (Check/Call)
  "#3b82f6", // Blue (Fold)
  "#8b5cf6", // Purple
];

const madeHandRankOrder: Record<MadeHandCategory, number> = {
  "Straight Flush": 100,
  Quads: 90,
  "Full House": 80,
  Flush: 70,
  Straight: 60,
  Set: 50,
  Trips: 45,
  "Two Pair": 40,
  Overpair: 35,
  "Top Pair": 30,
  "Middle Pair": 25,
  "Weak Pair": 20,
  Underpair: 15,
  "Ace High": 10,
  "No Made Hand": 5,
};

const drawRankOrder: Record<DrawCategory, number> = {
  "Straight Flush Draw": 90,
  "Combo Draw": 85,
  "Nut Flush Draw": 80,
  "Flush Draw": 70,
  OESD: 60,
  Gutshot: 50,
  Overcards: 40,
  "Backdoor Flush Draw": 30,
  "Backdoor Straight Draw": 20,
};

const getActionInfo = (actionIdx: number) => {
  if (props.selectedSpot?.type === "player" && (props.selectedSpot as any)?.actions) {
    const act = (props.selectedSpot as any).actions[actionIdx];
    if (act) {
      return {
        name: act.name,
        color: act.color || actionColors[actionIdx % actionColors.length],
      };
    }
  }
  return {
    name: `Action ${actionIdx + 1}`,
    color: actionColors[actionIdx % actionColors.length],
  };
};

const availableActionsList = computed(() => {
  const numActions = props.results?.numActions || 0;
  return Array.from({ length: numActions }, (_, i) => getActionInfo(i));
});

// Aggregation Pipeline
const aggregatedData = computed(() => {
  const pIdx = props.displayPlayer === "oop" ? 0 : 1;
  const cardsList = props.cards?.[pIdx] || [];
  const results = props.results;
  const board = props.currentBoard && props.currentBoard.length >= 3 ? props.currentBoard : [48, 36, 12];
  const numActions = results?.numActions || 0;

  const madeMap = new Map<MadeHandCategory, {
    combos: number;
    totalEq: number;
    totalEv: number;
    actionSums: number[];
    cells: Set<number>;
  }>();

  const drawMap = new Map<DrawCategory, {
    combos: number;
    totalEq: number;
    totalEv: number;
    actionSums: number[];
    cells: Set<number>;
  }>();

  let totalRangeCombos = 0;

  for (let i = 0; i < cardsList.length; i++) {
    const weight = results?.weights?.[pIdx]?.[i] ?? 0;
    if (weight <= 0.0001) continue;

    const pair = cardsList[i];
    const c1 = pair & 0xff;
    const c2 = pair >>> 8;

    // Apply Suit Blocker Filter
    if (activeSuitFilter.value !== "all") {
      const s1 = c1 & 3;
      const s2 = c2 & 3;
      const reqSuit =
        activeSuitFilter.value === "clubs"
          ? 0
          : activeSuitFilter.value === "diamonds"
          ? 1
          : activeSuitFilter.value === "hearts"
          ? 2
          : 3;
      if (s1 !== reqSuit && s2 !== reqSuit) continue;
    }

    totalRangeCombos += weight;

    const { row, col } = cardPairCellIndex(c1, c2);
    const cellIdx = row * 13 + col;
    const eq = results.equity[pIdx]?.[i] ?? 0;
    const ev = results.ev[pIdx]?.[i] ?? 0;

    const evalResult = evaluateCombo(c1, c2, board);

    // 1. Made Hand
    let mEntry = madeMap.get(evalResult.madeHand);
    if (!mEntry) {
      mEntry = {
        combos: 0,
        totalEq: 0,
        totalEv: 0,
        actionSums: new Array(numActions).fill(0),
        cells: new Set(),
      };
      madeMap.set(evalResult.madeHand, mEntry);
    }
    mEntry.combos += weight;
    mEntry.totalEq += eq * weight;
    mEntry.totalEv += ev * weight;
    mEntry.cells.add(cellIdx);

    for (let a = 0; a < numActions; a++) {
      const strat = results.strategy?.[a * cardsList.length + i] ?? 0;
      mEntry.actionSums[a] += strat * weight;
    }

    // 2. Draws
    for (const d of evalResult.draws) {
      let dEntry = drawMap.get(d);
      if (!dEntry) {
        dEntry = {
          combos: 0,
          totalEq: 0,
          totalEv: 0,
          actionSums: new Array(numActions).fill(0),
          cells: new Set(),
        };
        drawMap.set(d, dEntry);
      }
      dEntry.combos += weight;
      dEntry.totalEq += eq * weight;
      dEntry.totalEv += ev * weight;
      dEntry.cells.add(cellIdx);

      for (let a = 0; a < numActions; a++) {
        const strat = results.strategy?.[a * cardsList.length + i] ?? 0;
        dEntry.actionSums[a] += strat * weight;
      }
    }
  }

  const formatList = (
    map: Map<string, { combos: number; totalEq: number; totalEv: number; actionSums: number[]; cells: Set<number> }>,
    isMade: boolean
  ): CategoryRow[] => {
    const list = Array.from(map.entries())
      .map(([name, data]) => {
        const actionFrequencies: ActionFreq[] = data.actionSums.map((sum, aIdx) => {
          const actInfo = getActionInfo(aIdx);
          return {
            name: actInfo.name,
            freq: data.combos > 0 ? sum / data.combos : 0,
            color: actInfo.color,
          };
        });

        const strengthScore = isMade
          ? madeHandRankOrder[name as MadeHandCategory] ?? 0
          : drawRankOrder[name as DrawCategory] ?? 0;

        return {
          name,
          combos: data.combos,
          percentage: totalRangeCombos > 0 ? (data.combos / totalRangeCombos) * 100 : 0,
          avgEquity: data.combos > 0 ? data.totalEq / data.combos : 0,
          avgEv: data.combos > 0 ? data.totalEv / data.combos : 0,
          actionFrequencies,
          cellIndices: data.cells,
          strengthScore,
        };
      });

    if (sortByStrength.value) {
      return list.sort((a, b) => b.strengthScore - a.strengthScore);
    } else {
      return list.sort((a, b) => b.combos - a.combos);
    }
  };

  return {
    made: formatList(madeMap as unknown as Map<string, any>, true),
    draws: formatList(drawMap as unknown as Map<string, any>, false),
    totalRangeCombos,
  };
});

const madeCategories = computed(() => aggregatedData.value.made);
const drawCategories = computed(() => aggregatedData.value.draws);

const displayCategories = computed(() => {
  return activeTab.value === "made" ? madeCategories.value : drawCategories.value;
});

// Action Strategy Composition Explorer
const currentActionComposition = computed(() => {
  const actIdx = selectedActionIdx.value;
  const actInfo = getActionInfo(actIdx);
  const allRows = [...madeCategories.value];
  const totalCombos = aggregatedData.value.totalRangeCombos;
  if (totalCombos === 0) return null;

  let totalCombosForAction = 0;
  const breakdown: { name: string; percentOfAction: number; combosInAction: number }[] = [];

  for (const cat of allRows) {
    const actFreq = cat.actionFrequencies[actIdx]?.freq ?? 0;
    const inActionCombos = cat.combos * actFreq;
    if (inActionCombos > 0.05) {
      totalCombosForAction += inActionCombos;
      breakdown.push({
        name: cat.name,
        combosInAction: inActionCombos,
        percentOfAction: 0,
      });
    }
  }

  breakdown.forEach((b) => {
    b.percentOfAction = totalCombosForAction > 0 ? (b.combosInAction / totalCombosForAction) * 100 : 0;
  });

  breakdown.sort((a, b) => b.percentOfAction - a.percentOfAction);

  return {
    actionName: actInfo.name,
    overallFreq: (totalCombosForAction / totalCombos) * 100,
    breakdown,
  };
});

const filteredCombosTotal = computed(() => {
  const allRows = [...madeCategories.value, ...drawCategories.value];
  return selectedCategories.value.reduce((acc, catName) => {
    const row = allRows.find((r) => r.name === catName);
    return acc + (row?.combos ?? 0);
  }, 0);
});

const toggleCategory = (catName: string) => {
  const idx = selectedCategories.value.indexOf(catName);
  if (idx >= 0) {
    selectedCategories.value.splice(idx, 1);
  } else {
    selectedCategories.value.push(catName);
  }
  emitActiveFilter();
};

const selectQuickGroup = (group: "top_pair" | "draws" | "air") => {
  selectedCategories.value = [];
  if (group === "top_pair") {
    selectedCategories.value = ["Straight Flush", "Quads", "Full House", "Flush", "Straight", "Set", "Two Pair", "Overpair", "Top Pair"];
    activeTab.value = "made";
  } else if (group === "draws") {
    selectedCategories.value = ["Straight Flush Draw", "Combo Draw", "Nut Flush Draw", "Flush Draw", "OESD", "Gutshot"];
    activeTab.value = "draws";
  } else if (group === "air") {
    selectedCategories.value = ["Ace High", "No Made Hand"];
    activeTab.value = "made";
  }
  emitActiveFilter();
};

const clearFilters = () => {
  selectedCategories.value = [];
  activeSuitFilter.value = "all";
  emit("update:filtered-cells", null);
};

const emitActiveFilter = () => {
  if (selectedCategories.value.length === 0) {
    emit("update:filtered-cells", null);
    return;
  }
  const allRows = [...madeCategories.value, ...drawCategories.value];
  const combinedCells = new Set<number>();
  for (const catName of selectedCategories.value) {
    const row = allRows.find((r) => r.name === catName);
    if (row) {
      row.cellIndices.forEach((c) => combinedCells.add(c));
    }
  }
  emit("update:filtered-cells", combinedCells);
};
</script>
