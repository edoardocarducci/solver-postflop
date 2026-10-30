<template>
  <div
    v-if="!store.isSolverFinished"
    class="flex-grow flex flex-col items-center justify-center p-8 max-w-xl mx-auto text-center"
  >
    <div class="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-blue-500/5">
      📊
    </div>
    <h2 class="text-xl font-bold text-slate-100 mb-2">
      Nessuna Soluzione Flop Caricata
    </h2>
    <p class="text-sm text-slate-400 mb-6 leading-relaxed">
      Per visualizzare le frequenze ottimali GTO, la matrice 13x13 con le heatmap di Equity ed EV, e il pannello delle classi di mano, è necessario prima calcolare la simulazione.
    </p>

    <div class="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
      <button
        class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2"
        :disabled="isSolvingDirectly"
        @click="solveFlopDirectly"
      >
        <span v-if="isSolvingDirectly" class="spinner inline-block w-4 h-4"></span>
        <span v-else>⚡</span>
        <span>{{ isSolvingDirectly ? "Simulazione in corso..." : "Risolvi Subito questo Flop" }}</span>
      </button>

      <button
        class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm text-slate-200 border border-slate-700 shadow transition flex items-center justify-center gap-2"
        @click="store.navView = 'solver'"
      >
        <span>🛠️</span>
        <span>Configura nel Solver</span>
      </button>
    </div>
  </div>

  <div v-else class="flex flex-col h-full">
    <ActionInfobar
      :spots="resultNavRef?.spots ?? []"
      :selected-spot-index="resultNavRef?.selectedSpotIndex ?? -1"
      :current-board="currentBoard"
      @select-spot="onSelectSpotFromBreadcrumb"
      @open-range-vs-range="showRangeVsRange = true"
      @open-runout-heatmap="showRunoutHeatmap = true"
      @open-node-lock="showNodeLock = true"
      @save-spot="onSaveCurrentSpot"
      @open-saved-library="showSavedLibrary = true"
      @locks-reset="onNodeLockApplied"
    />

    <ResultNav
      ref="resultNavRef"
      :is-handler-updated="isHandlerUpdated"
      :is-locked="isLocked"
      :cards="cards"
      :dealt-card="dealtCard"
      @update:is-handler-updated="(value) => (isHandlerUpdated = value)"
      @update:is-locked="(value) => (isLocked = value)"
      @trigger-update="onUpdateSpot"
    />

    <ResultMiddle
      :display-mode="displayMode"
      :chance-mode="chanceMode"
      :auto-player-basics="autoPlayerBasics"
      :auto-player-chance="autoPlayerChance"
      :copy-success="copySuccess"
      @update:display-mode="updateDisplayMode"
      @update:display-options="updateDisplayOptions"
      @copy-to-clipboard="copyRangeTextToClipboard"
      @reset-copy-success="resetCopySuccess"
    />

    <!-- Matrix View Mode Bar (Strategy / Equity Heatmap / EV Heatmap) -->
    <div
      v-if="displayMode === 'basics' && selectedSpot"
      class="px-4 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs"
    >
      <div class="flex items-center gap-2">
        <span class="text-slate-400 font-semibold uppercase text-[11px]">Matrix Display:</span>
        <div class="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            :class="[
              'px-3 py-1 rounded-md font-bold transition text-xs flex items-center gap-1',
              displayOptions.contentBasics === 'default'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            ]"
            @click="setMatrixViewMode('default')"
          >
            <span>🎯</span>
            <span>Strategy Actions</span>
          </button>
          <button
            :class="[
              'px-3 py-1 rounded-md font-bold transition text-xs flex items-center gap-1',
              displayOptions.contentBasics === 'eq'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            ]"
            @click="setMatrixViewMode('eq')"
          >
            <span>🟢</span>
            <span>Equity Heatmap</span>
          </button>
          <button
            :class="[
              'px-3 py-1 rounded-md font-bold transition text-xs flex items-center gap-1',
              displayOptions.contentBasics === 'ev'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            ]"
            @click="setMatrixViewMode('ev')"
          >
            <span>💰</span>
            <span>EV Heatmap</span>
          </button>
        </div>
      </div>

      <div v-if="categoryFilteredCells && categoryFilteredCells.size > 0" class="flex items-center gap-2 text-xs">
        <span class="text-amber-400 font-semibold font-mono">
          ★ Highlighted: {{ categoryFilteredCells.size }} hands
        </span>
        <button
          class="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/40 font-bold transition"
          @click="categoryFilteredCells = null"
        >
          Reset Highlight
        </button>
      </div>
    </div>

    <div
      v-if="store.navView === 'results' && selectedSpot && results"
      class="flex flex-grow min-h-0"
    >
      <template v-if="displayMode === 'basics'">
        <ResultBasics
          style="flex: 4"
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :current-board="currentBoard"
          :total-bet-amount="totalBetAmount"
          :results="results"
          :display-options="displayOptions"
          :display-player="displayPlayerBasics"
          :is-compare-mode="false"
          :filtered-cells="categoryFilteredCells"
          @update-hover-content="onUpdateHoverContent"
        />

        <ResultTable
          style="flex: 2.5"
          table-mode="basics"
          :cards="cards"
          :selected-spot="selectedSpot"
          :results="results"
          :display-player="displayPlayerBasics"
          :hover-content="basicsHoverContent"
          :filtered-cells="categoryFilteredCells"
        />

        <CategoryBreakdown
          style="flex: 2.5"
          :cards="cards"
          :current-board="currentBoard"
          :results="results"
          :selected-spot="selectedSpot"
          :display-player="displayPlayerBasics"
          @update:filtered-cells="(cells) => (categoryFilteredCells = cells)"
        />
      </template>

      <template v-else-if="displayMode === 'graphs'">
        <ResultGraphs
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :results="results"
          :chance-reports="chanceReports"
          :display-options="displayOptions"
          :display-player="displayPlayerBasics"
        />
      </template>

      <template v-else-if="displayMode === 'compare'">
        <ResultBasics
          style="flex: 5"
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :current-board="currentBoard"
          :total-bet-amount="totalBetAmount"
          :results="results"
          :display-options="displayOptions"
          display-player="oop"
          :is-compare-mode="true"
        />

        <ResultCompare
          style="flex: 2"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :results="results"
        />

        <ResultBasics
          style="flex: 5"
          :cards="cards"
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :current-board="currentBoard"
          :total-bet-amount="totalBetAmount"
          :results="results"
          :display-options="displayOptions"
          display-player="ip"
          :is-compare-mode="true"
        />
      </template>

      <template v-else-if="displayMode === 'chance' && selectedChance">
        <ResultChance
          :selected-spot="selectedSpot"
          :selected-chance="selectedChance"
          :chance-reports="chanceReports"
          :display-options="displayOptions"
          :display-player="displayPlayerChance"
          @deal-card="onDealCard"
        />
      </template>
    </div>

    <!-- Active solver running loader -->
    <div
      v-else-if="store.navView === 'results' && store.isSolverRunning"
      class="flex-grow flex flex-col items-center justify-center p-8 text-center"
    >
      <div class="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-2xl mb-3 animate-spin">
        ⚙️
      </div>
      <h3 class="text-base font-bold text-slate-200 mb-1">
        Calcolo Soluzione GTO in corso...
      </h3>
      <p class="text-xs text-slate-400 mb-4 max-w-md">
        Calcolo delle frequenze di equilibrio di Nash e delle strategie per il Flop in corso...
      </p>
    </div>

    <!-- GTO Wizard Suite Modals -->
    <RangeVsRangeModal
      v-if="showRangeVsRange && results"
      :results="results"
      :cards="cards"
      @close="showRangeVsRange = false"
    />

    <RunoutHeatmap
      v-if="showRunoutHeatmap"
      :chance-reports="chanceReports"
      :selected-chance="selectedChance"
      :current-board="currentBoard"
      :starting-pot="config.startingPot || 5.0"
      @close="showRunoutHeatmap = false"
      @deal-card="onDealCardFromHeatmap"
    />

    <NodeLockModal
      v-if="showNodeLock && selectedSpot"
      :selected-spot="selectedSpot"
      @close="showNodeLock = false"
      @lock-applied="onNodeLockApplied"
    />

    <SavedSpotsModal
      v-if="showSavedLibrary"
      @close="showSavedLibrary = false"
      @load-spot="onLoadSavedSpot"
    />

    <!-- Toast Notification -->
    <div
      v-if="saveToastMsg"
      class="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2"
    >
      <span>✓</span>
      <span>{{ saveToastMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import { useStore, useConfigStore, saveConfig, saveConfigTmp } from "../store";
import { BUILTIN_SIX_MAX_SPOTS } from "../data/six_max_ranges";
import { parsePioRangePercent, formatPioRangeString } from "../utils/rangeParser";
import * as invokes from "../invokes";
import {
  SavedSpotData,
  getSavedMatrixMode,
  saveMatrixMode,
  saveSpotToLibrary,
  saveLastSolvedSpot,
  getLastSolvedSpot,
} from "../utils/heatmapStorage";
import { cardText } from "../utils";
import { localSolver } from "../utils/localSolver";

import {
  Results,
  ChanceReports,
  Spot,
  SpotChance,
  SpotPlayer,
  DisplayMode,
  DisplayOptions,
  HoverContent,
} from "../result-types";

import ResultNav from "./ResultNav.vue";
import ResultMiddle from "./ResultMiddle.vue";
import ResultBasics from "./ResultBasics.vue";
import ResultTable from "./ResultTable.vue";
import ResultCompare from "./ResultCompare.vue";
import ResultGraphs from "./ResultGraphs.vue";
import ResultChance from "./ResultChance.vue";
import ActionInfobar from "./ActionInfobar.vue";
import CategoryBreakdown from "./CategoryBreakdown.vue";
import RangeVsRangeModal from "./RangeVsRangeModal.vue";
import RunoutHeatmap from "./RunoutHeatmap.vue";
import NodeLockModal from "./NodeLockModal.vue";
import SavedSpotsModal from "./SavedSpotsModal.vue";

const store = useStore();
const config = useConfigStore();

/* GTO Wizard Suite Navigation & Modals */
const resultNavRef = ref<InstanceType<typeof ResultNav> | null>(null);
const showRangeVsRange = ref(false);
const showRunoutHeatmap = ref(false);
const showNodeLock = ref(false);
const showSavedLibrary = ref(false);
const saveToastMsg = ref("");

const triggerToast = (msg: string) => {
  saveToastMsg.value = msg;
  setTimeout(() => {
    saveToastMsg.value = "";
  }, 3500);
};

const onSelectSpotFromBreadcrumb = (index: number) => {
  resultNavRef.value?.selectSpot(index, false);
};

const onDealCardFromHeatmap = (card: number) => {
  dealtCard.value = card;
};

const categoryFilteredCells = ref<Set<number> | null>(null);

const setMatrixViewMode = (mode: "default" | "eq" | "ev") => {
  displayOptions.value.contentBasics = mode;
  displayOptions.value.strategy = "show";
  saveMatrixMode(mode);
};

const onSaveCurrentSpot = () => {
  if (!results.value) return;

  const boardCards =
    currentBoard.value && currentBoard.value.length >= 3
      ? currentBoard.value
      : config.board && config.board.length >= 3
      ? config.board
      : [48, 36, 12];

  const boardName = boardCards
    .map((c) => {
      const t = cardText(c);
      return `${t.rank}${t.suit}`;
    })
    .join(" ");

  const spotData: SavedSpotData = {
    id: `spot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `6-Max Flop: [${boardName}] (Pot: ${config.startingPot || 5.5}bb)`,
    timestamp: Date.now(),
    board: [...boardCards],
    startingPot: config.startingPot || 5.5,
    effectiveStack: config.effectiveStack || 97.5,
    results: JSON.parse(JSON.stringify(results.value)),
    chanceReports: chanceReports.value
      ? JSON.parse(JSON.stringify(chanceReports.value))
      : undefined,
  };

  saveSpotToLibrary(spotData);
  saveLastSolvedSpot(spotData);
  triggerToast("✓ Spot e Heatmap salvati nella libreria permanente!");
};

const onLoadSavedSpot = async (saved: SavedSpotData) => {
  try {
    config.board = [...saved.board];
    config.startingPot = saved.startingPot;
    config.effectiveStack = saved.effectiveStack;
    saveConfigTmp();
    saveConfig();

    localSolver.init(
      saved.board,
      saved.startingPot,
      saved.effectiveStack,
      store.ranges[0],
      store.ranges[1]
    );

    if (saved.results) {
      localSolver.equity = [saved.results.equity[0] || [], saved.results.equity[1] || []];
      localSolver.ev = [saved.results.ev[0] || [], saved.results.ev[1] || []];
      localSolver.eqr = [saved.results.eqr[0] || [], saved.results.eqr[1] || []];
      localSolver.strategy = saved.results.strategy;
      if (saved.results.actionEv) {
        localSolver.actionEv = saved.results.actionEv;
      }
    }

    currentBoard.value = [...saved.board];
    results.value = JSON.parse(JSON.stringify(saved.results));
    if (saved.chanceReports) {
      chanceReports.value = JSON.parse(JSON.stringify(saved.chanceReports));
    }

    store.isSolverFinished = true;
    await init();
    triggerToast(`✓ Caricato: ${saved.title}`);
  } catch (err) {
    console.error("Error loading saved spot:", err);
  }
};

const onNodeLockApplied = async () => {
  results.value = await invokes.gameGetResults();
  if (resultNavRef.value) {
    await resultNavRef.value.reloadCurrentSpot();
  }
};

const isSolvingDirectly = ref(false);

const solveFlopDirectly = async () => {
  isSolvingDirectly.value = true;
  try {
    if (!config.board || config.board.length < 3) {
      config.board = [48, 36, 12];
    }
    const preset = BUILTIN_SIX_MAX_SPOTS[0];
    if (!store.ranges[0].some((w) => w > 0)) {
      await invokes.rangeFromString(0, preset.oopRange);
      await invokes.rangeFromString(1, preset.ipRange);
      store.ranges[0] = [...parsePioRangePercent(preset.oopRange)];
      store.ranges[1] = [...parsePioRangePercent(preset.ipRange)];
    }
    saveConfigTmp();
    saveConfig();

    localSolver.init(
      config.board,
      config.startingPot || 5.0,
      config.effectiveStack || 98.0,
      store.ranges[0],
      store.ranges[1]
    );

    invokes.gameInit(
      config.board,
      Math.round(config.startingPot || 5),
      Math.round(config.effectiveStack || 98),
      0,
      0,
      false,
      "33, 75",
      "e",
      "66",
      "e",
      "",
      "66",
      "e",
      "",
      "33, 75",
      "e",
      "66",
      "e",
      "66",
      "e",
      1.5,
      0.2,
      0.1,
      "",
      ""
    ).catch(() => {});

    store.isSolverFinished = true;
    await init();
  } catch (err) {
    console.error("Direct solve error in ResultViewer:", err);
  } finally {
    isSolvingDirectly.value = false;
  }
};

/* Navigation */

const isHandlerUpdated = ref(false);
const isLocked = ref(false);

const cards = ref<number[][]>([[], []]);
const dealtCard = ref(-1);

const selectedSpot = ref<Spot | null>(null);
const selectedChance = ref<SpotChance | null>(null);
const currentBoard = ref<number[]>([]);
const results = ref<Results | null>(null);
const chanceReports = ref<ChanceReports | null>(null);
const totalBetAmount = ref([0, 0]);

const isSolverFinished = ref(false);
store.$subscribe(async (_, store) => {
  if (isSolverFinished.value !== store.isSolverFinished) {
    if ((isSolverFinished.value = store.isSolverFinished)) {
      await init();
    } else {
      clear();
    }
  }
});

const init = async () => {
  try {
    if (!config.board || config.board.length < 3) {
      config.board = [48, 36, 12];
    }
    saveConfigTmp();
    saveConfig();

    cards.value = await invokes.gamePrivateCards();
    isHandlerUpdated.value = true;
    results.value = await invokes.gameGetResults();
  } catch (err) {
    console.error("Error during ResultViewer init:", err);
  }
};

const clear = () => {
  cards.value = [[], []];
  selectedSpot.value = null;
  selectedChance.value = null;
  results.value = null;
  chanceReports.value = null;
};

const onUpdateSpot = (
  newSelectedSpot: Spot | null,
  newSelectedChance: SpotChance | null,
  newCurrentBoard: number[],
  newResults: Results,
  newChanceReports: ChanceReports | null,
  newTotalBetAmount: number[]
) => {
  dealtCard.value = -1;
  selectedSpot.value = newSelectedSpot;
  selectedChance.value = newSelectedChance;
  currentBoard.value = newCurrentBoard;
  results.value = newResults;
  chanceReports.value = newChanceReports;
  totalBetAmount.value = newTotalBetAmount;
  isLocked.value = false;

  chanceMode.value = newSelectedChance?.player ?? "";

  // Auto-cache active spot and heatmaps
  if (newResults) {
    const boardCards =
      newCurrentBoard && newCurrentBoard.length >= 3
        ? newCurrentBoard
        : config.board && config.board.length >= 3
        ? config.board
        : [48, 36, 12];
    const boardName = boardCards
      .map((c) => {
        const t = cardText(c);
        return `${t.rank}${t.suit}`;
      })
      .join(" ");

    saveLastSolvedSpot({
      id: "last_active_spot",
      title: `HU Flop: [${boardName}]`,
      timestamp: Date.now(),
      board: [...boardCards],
      startingPot: config.startingPot || 5,
      effectiveStack: config.effectiveStack || 98,
      results: JSON.parse(JSON.stringify(newResults)),
      chanceReports: newChanceReports
        ? JSON.parse(JSON.stringify(newChanceReports))
        : undefined,
    });
  }
};

/* Middle Bar */

const displayMode = ref<DisplayMode>("basics");
const chanceMode = ref("");

const displayOptions = ref<DisplayOptions>({
  playerBasics: "auto",
  playerChance: "auto",
  barHeight: "normalized",
  suit: "grouped",
  strategy: "show",
  contentBasics: getSavedMatrixMode(),
  contentGraphs: "eq",
  chartChance: "strategy-combos",
});

const copySuccess = ref(0);

const updateDisplayMode = (mode: DisplayMode) => {
  displayMode.value = mode;
};

const updateDisplayOptions = (options: DisplayOptions) => {
  displayOptions.value = options;
};

const copyRangeTextToClipboard = async () => {
  const playerIdx = displayPlayerBasics.value === "ip" ? 1 : 0;
  const text = formatPioRangeString(store.ranges[playerIdx] || []);
  navigator.clipboard
    .writeText(text)
    .then(() => (copySuccess.value = 1))
    .catch(() => (copySuccess.value = -1));
};

const resetCopySuccess = () => {
  copySuccess.value = 0;
};

/* Computed */

const autoPlayerBasics = computed(() => {
  const spot = selectedSpot.value;
  const chance = selectedChance.value;
  if (!spot) return "oop";

  if (chance) {
    return chance.prevPlayer;
  } else if (spot.type === "terminal") {
    return spot.prevPlayer;
  } else {
    return (spot as SpotPlayer).player;
  }
});

const autoPlayerChance = computed(() => {
  const spot = selectedSpot.value;
  if (!spot) return "oop";
  if (spot.type === "terminal") {
    return spot.prevPlayer;
  } else {
    return (spot as SpotPlayer).player;
  }
});

const displayPlayerBasics = computed(() => {
  const optionPlayer = displayOptions.value.playerBasics;
  if (optionPlayer === "auto") {
    return autoPlayerBasics.value;
  } else {
    return optionPlayer;
  }
});

const displayPlayerChance = computed(() => {
  const optionPlayer = displayOptions.value.playerChance;
  if (optionPlayer === "auto") {
    return autoPlayerChance.value;
  } else {
    return optionPlayer;
  }
});

/* Results */

const basicsHoverContent = ref<HoverContent | null>(null);

const onUpdateHoverContent = (content: HoverContent | null) => {
  basicsHoverContent.value = content;
};

const onDealCard = (card: number) => {
  dealtCard.value = card;
};

watch(
  () => store.navView,
  async (newNav) => {
    if (newNav === "results") {
      if (store.isSolverFinished) {
        if (!results.value || !selectedSpot.value) {
          await init();
        }
      } else {
        const last = getLastSolvedSpot();
        if (last && last.results && last.board) {
          await onLoadSavedSpot(last);
        }
      }
    }
  }
);

onMounted(async () => {
  if (!store.isSolverFinished) {
    const last = getLastSolvedSpot();
    if (last && last.results && last.board) {
      await onLoadSavedSpot(last);
      return;
    }
  } else {
    await init();
  }
});
</script>
