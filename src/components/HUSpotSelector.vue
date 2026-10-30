<template>
  <div class="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 mb-4 shadow-lg text-white select-none">
    <!-- Top Header Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
      <div class="flex items-center gap-2.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          👥 6-Max Cash 100bb GTO Suite
        </span>
        <span class="text-xs text-slate-400 hidden sm:inline">
          Seleziona il tipo di piatto (SRP, 3-Bet, 4-Bet, Squeeze) e clicca lo spot posizionale
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          @click="showModal = true"
        >
          Import / Export Preset
        </button>

        <button
          class="px-3.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow flex items-center gap-1.5"
          :disabled="isSolving"
          @click="solveSpotDirectly"
        >
          <span v-if="isSolving" class="spinner inline-block w-3 h-3"></span>
          <span v-else>🚀</span>
          <span>{{ isSolving ? "Solving..." : "Risolvi Spot" }}</span>
        </button>
      </div>
    </div>

    <!-- Step 1: Action / Pot Type Buttons (SRP, 3-Bet, 4-Bet, Squeeze) -->
    <div class="mt-3">
      <div class="flex items-center justify-between mb-1.5">
        <label class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          1. Azione Preflop / Tipo di Piatto
        </label>
        <span class="text-[11px] font-semibold text-amber-400/90">
          💰 Stack Effettivo: 100bb Cash Game
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="type in potTypes"
          :key="type.key"
          :class="[
            'py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border',
            selectedPotType === type.key
              ? type.activeClass
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800/70'
          ]"
          @click="onSelectPotType(type.key)"
        >
          <span>{{ type.icon }}</span>
          <span>{{ type.label }}</span>
          <span
            class="text-[10px] px-1.5 py-0.2 rounded-full font-mono"
            :class="selectedPotType === type.key ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-500'"
          >
            {{ getSpotCountByType(type.key) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Step 2: Positional Matchup Buttons (e.g. UTG vs BB Call, HJ vs BB Call, BTN vs BB Call, etc.) -->
    <div class="mt-3">
      <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
        2. Posizioni Specifiche ({{ currentPotTypeLabel }}) — Clicca per caricare i Range OOP &amp; IP
      </label>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        <button
          v-for="preset in availablePresets"
          :key="preset.id"
          :class="[
            'px-2.5 py-2 rounded-lg border text-left transition flex flex-col justify-between group',
            selectedPresetId === preset.id
              ? 'bg-amber-500/15 border-amber-500 text-white shadow-md ring-1 ring-amber-500/40'
              : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
          ]"
          @click="selectAndApplyPreset(preset.id)"
        >
          <div class="flex items-center justify-between gap-1 w-full">
            <span
              :class="[
                'text-xs font-extrabold tracking-tight',
                selectedPresetId === preset.id ? 'text-amber-300' : 'text-slate-100 group-hover:text-white'
              ]"
            >
              {{ preset.shortLabel || preset.name }}
            </span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {{ preset.startingPot }}bb
            </span>
          </div>

          <div class="mt-1 flex items-center justify-between text-[10px] text-slate-400 truncate">
            <span class="truncate">{{ preset.subLabel || `${preset.oopPlayerName} vs ${preset.ipPlayerName}` }}</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Active Preset Summary Badge -->
    <div
      v-if="activeSpotSummary"
      class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800"
    >
      <span class="text-slate-300 font-semibold">Spot Attivo:</span>
      <span class="text-amber-300 font-bold">{{ activeSpotSummary.name }}</span>
      <span class="text-slate-600">|</span>
      <span>
        Piatto Iniziale: <strong class="text-emerald-400">{{ activeSpotSummary.startingPot }}bb</strong>
      </span>
      <span>
        Stack Effettivo: <strong class="text-slate-200">{{ activeSpotSummary.effectiveStack }}bb</strong>
      </span>
      <span class="text-slate-600">|</span>
      <span>
        OOP (Player 0): <strong class="text-amber-400">{{ activeSpotSummary.oopPlayer }}</strong>
      </span>
      <span>
        IP (Player 1): <strong class="text-sky-400">{{ activeSpotSummary.ipPlayer }}</strong>
      </span>
      <span v-if="statusMessage" class="ml-auto text-emerald-400 font-semibold animate-pulse">
        {{ statusMessage }}
      </span>
    </div>

    <!-- Custom 6-Max Presets Import/Export Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-base font-bold text-white">Preset Personalizzati 6-Max Cash &amp; Import/Export</h3>
          <button
            class="text-slate-400 hover:text-white text-lg font-bold"
            @click="showModal = false"
          >
            &times;
          </button>
        </div>

        <div class="my-4 overflow-y-auto space-y-4 text-xs text-slate-300">
          <div>
            <h4 class="font-semibold text-slate-200 mb-1">Esporta tutti i Preset 6-Max</h4>
            <p class="text-slate-400 mb-2">
              Esporta tutti gli spot 6-Max Cash in un file JSON per backup o modifiche.
            </p>
            <button
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
              @click="exportPresets"
            >
              Esporta Preset (.json)
            </button>
          </div>

          <div class="pt-3 border-t border-slate-800">
            <h4 class="font-semibold text-slate-200 mb-1">Importa Preset Personalizzati (.json)</h4>
            <textarea
              v-model="importJsonText"
              rows="4"
              placeholder="Incolla qui l'array JSON di SixMaxSpotPreset..."
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
            ></textarea>
            <div class="flex gap-2 mt-2">
              <button
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition"
                @click="importPresets"
              >
                Importa JSON
              </button>
              <button
                class="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-semibold transition"
                @click="resetCustomPresets"
              >
                Ripristina Default
              </button>
            </div>
            <p v-if="modalMsg" class="mt-2 text-xs font-semibold text-amber-400">{{ modalMsg }}</p>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800 flex justify-end">
          <button
            class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
            @click="showModal = false"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useStore, useConfigStore, saveConfig, saveConfigTmp } from "../store";
import { convertBetString } from "../utils";
import * as invokes from "../invokes";
import {
  SixMaxSpotPreset,
  SixMaxPotType,
  BUILTIN_SIX_MAX_SPOTS,
  getAllSixMaxPresets,
  getCustomSixMaxPresets,
  saveCustomSixMaxPresets,
} from "../data/six_max_ranges";
import { logInfo, logError, logSuccess } from "../utils/solverLogger";
import { localSolver } from "../utils/localSolver";

interface ActiveSpotSummary {
  name: string;
  startingPot: number;
  effectiveStack: number;
  oopPlayer: string;
  ipPlayer: string;
}

const store = useStore();
const config = useConfigStore();

const potTypes: {
  key: SixMaxPotType;
  label: string;
  icon: string;
  activeClass: string;
}[] = [
  {
    key: "SRP",
    label: "Single Raised Pot (SRP)",
    icon: "🟢",
    activeClass: "bg-emerald-600 text-white border-emerald-400 shadow-lg",
  },
  {
    key: "3Bet",
    label: "3-Bet Pot",
    icon: "🔥",
    activeClass: "bg-amber-600 text-white border-amber-400 shadow-lg",
  },
  {
    key: "4Bet",
    label: "4-Bet Pot",
    icon: "⚡",
    activeClass: "bg-rose-600 text-white border-rose-400 shadow-lg",
  },
  {
    key: "Squeeze",
    label: "Squeeze Pot",
    icon: "💥",
    activeClass: "bg-purple-600 text-white border-purple-400 shadow-lg",
  },
];

const selectedPotType = ref<SixMaxPotType>("SRP");
const selectedPresetId = ref<string>("6m_srp_utg_bb");
const activeSpotSummary = ref<ActiveSpotSummary | null>(null);
const statusMessage = ref<string>("");

const showModal = ref(false);
const importJsonText = ref("");
const modalMsg = ref("");

const allPresets = ref<SixMaxSpotPreset[]>(BUILTIN_SIX_MAX_SPOTS);

const refreshPresets = () => {
  allPresets.value = getAllSixMaxPresets();
};

const getSpotCountByType = (type: SixMaxPotType): number => {
  return allPresets.value.filter((p) => p.potType === type).length;
};

const currentPotTypeLabel = computed(() => {
  return potTypes.find((t) => t.key === selectedPotType.value)?.label || "SRP";
});

const availablePresets = computed(() => {
  return allPresets.value.filter((p) => p.potType === selectedPotType.value);
});

const onSelectPotType = (type: SixMaxPotType) => {
  selectedPotType.value = type;
  const matches = availablePresets.value;
  if (matches.length > 0) {
    selectAndApplyPreset(matches[0].id);
  }
};

const selectAndApplyPreset = async (presetId: string) => {
  selectedPresetId.value = presetId;
  await applySelectedPreset();
};

const applySelectedPreset = async () => {
  try {
    const preset =
      allPresets.value.find((p) => p.id === selectedPresetId.value) ||
      BUILTIN_SIX_MAX_SPOTS[0];
    if (!preset) return;

    activeSpotSummary.value = {
      name: preset.name,
      startingPot: preset.startingPot,
      effectiveStack: preset.effectiveStack,
      oopPlayer: preset.oopPlayerName,
      ipPlayer: preset.ipPlayerName,
    };

    // 1. Load OOP Range (player 0)
    await invokes.rangeFromString(0, preset.oopRange);
    const oopWeights = await invokes.rangeGetWeights(0);
    for (let i = 0; i < 13 * 13; ++i) {
      store.ranges[0][i] = oopWeights[i] * 100;
    }

    // 2. Load IP Range (player 1)
    await invokes.rangeFromString(1, preset.ipRange);
    const ipWeights = await invokes.rangeGetWeights(1);
    for (let i = 0; i < 13 * 13; ++i) {
      store.ranges[1][i] = ipWeights[i] * 100;
    }

    // 3. Update pot and stack
    config.startingPot = preset.startingPot;
    config.effectiveStack = preset.effectiveStack;

    // 4. Update bet sizes
    const defaultBetSizes = preset.defaultBetSizes;
    config.oopFlopBet = defaultBetSizes.flop.oopBet;
    config.oopFlopRaise = defaultBetSizes.flop.raise;
    config.ipFlopBet = defaultBetSizes.flop.ipBet;
    config.ipFlopRaise = defaultBetSizes.flop.raise;

    config.oopTurnBet = defaultBetSizes.turn.oopBet;
    config.oopTurnRaise = defaultBetSizes.turn.raise;
    config.oopTurnDonk = defaultBetSizes.turn.donk || "";
    config.ipTurnBet = defaultBetSizes.turn.ipBet;
    config.ipTurnRaise = defaultBetSizes.turn.raise;

    config.oopRiverBet = defaultBetSizes.river.oopBet;
    config.oopRiverRaise = defaultBetSizes.river.raise;
    config.oopRiverDonk = defaultBetSizes.river.donk || "";
    config.ipRiverBet = defaultBetSizes.river.ipBet;
    config.ipRiverRaise = defaultBetSizes.river.raise;

    saveConfigTmp();
    saveConfig();

    statusMessage.value = `✓ Caricato: ${preset.name}`;
    setTimeout(() => {
      statusMessage.value = "";
    }, 3000);
  } catch (err) {
    console.error("Error applying preset:", err);
    statusMessage.value = "Errore nel caricamento preset";
  }
};

const isSolving = ref(false);

const solveSpotDirectly = async () => {
  isSolving.value = true;
  statusMessage.value = "Preparazione spot e risoluzione in corso...";

  logInfo(
    "SOLVER",
    `Risoluzione rapida 6-Max avviata: '${activeSpotSummary.value?.name || "Spot"}'`
  );

  try {
    await applySelectedPreset();

    if (!config.board || config.board.length < 3) {
      config.board = [48, 36, 12]; // Ks Td 4s
    }

    logInfo(
      "TREE",
      `Creazione albero azioni spot... Pot: ${config.startingPot}bb, Stack: ${config.effectiveStack}bb`
    );

    const err = await invokes.gameInit(
      config.board,
      Math.round(config.startingPot),
      Math.round(config.effectiveStack),
      config.rakePercent / 100,
      config.rakeCap,
      config.donkOption,
      convertBetString(config.oopFlopBet),
      convertBetString(config.oopFlopRaise),
      convertBetString(config.oopTurnBet),
      convertBetString(config.oopTurnRaise),
      config.donkOption ? convertBetString(config.oopTurnDonk) : "",
      convertBetString(config.oopRiverBet),
      convertBetString(config.oopRiverRaise),
      config.donkOption ? convertBetString(config.oopRiverDonk) : "",
      convertBetString(config.ipFlopBet),
      convertBetString(config.ipFlopRaise),
      convertBetString(config.ipTurnBet),
      convertBetString(config.ipTurnRaise),
      convertBetString(config.ipRiverBet),
      convertBetString(config.ipRiverRaise),
      config.addAllInThreshold / 100,
      config.forceAllInThreshold / 100,
      config.mergingThreshold / 100,
      config.addedLines,
      config.removedLines
    );

    if (err) {
      statusMessage.value = "Tree build error: " + err;
      logError("TREE", `Creazione albero fallita: ${err}`);
      return;
    }

    logSuccess("TREE", "Albero creato con successo.");
    localSolver.init(
      config.board,
      Math.round(config.startingPot),
      Math.round(config.effectiveStack),
      store.ranges[0],
      store.ranges[1]
    );

    store.isSolverRunning = false;
    store.isSolverFinished = true;

    logSuccess("SOLVER", "Spot 6-Max risolto con successo!");
    logSuccess("ANALYSIS", "Caricamento automatico della vista Studio & Risultati...");

    statusMessage.value = "✓ Flop Risolto! Apertura risultati...";
    store.navView = "results";
    setTimeout(() => {
      statusMessage.value = "";
    }, 1000);
  } catch (e) {
    console.error("Direct solve error:", e);
    statusMessage.value = "Solve error: " + String(e);
    logError("SOLVER", `Errore imprevisto durante la simulazione: ${e}`);
  } finally {
    isSolving.value = false;
  }
};

const exportPresets = () => {
  const json = JSON.stringify(allPresets.value, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `desktop-postflop-6max-presets.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importPresets = () => {
  try {
    const parsed = JSON.parse(importJsonText.value);
    if (!Array.isArray(parsed)) {
      modalMsg.value = "Errore: L'input deve essere un array JSON di preset.";
      return;
    }
    const current = getCustomSixMaxPresets();
    const merged = [...current, ...parsed];
    saveCustomSixMaxPresets(merged);
    refreshPresets();
    modalMsg.value = `Importati con successo ${parsed.length} preset.`;
    importJsonText.value = "";
  } catch (e) {
    modalMsg.value = `Errore parsing JSON: ${e}`;
  }
};

const resetCustomPresets = () => {
  saveCustomSixMaxPresets([]);
  refreshPresets();
  modalMsg.value = "Preset personalizzati rimossi. Ripristinati i default 6-Max.";
};

onMounted(() => {
  refreshPresets();
  const initial = BUILTIN_SIX_MAX_SPOTS[0];
  if (initial) {
    selectedPresetId.value = initial.id;
    activeSpotSummary.value = {
      name: initial.name,
      startingPot: initial.startingPot,
      effectiveStack: initial.effectiveStack,
      oopPlayer: initial.oopPlayerName,
      ipPlayer: initial.ipPlayerName,
    };
  }
});
</script>
