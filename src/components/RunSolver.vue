<template>
  <div class="flex my-1 items-center">
    Number of threads:
    <input
      v-model="numThreads"
      type="number"
      :class="
        'w-20 ml-2 px-2 py-1 rounded-lg text-sm text-center ' +
        (numThreads < 1 || numThreads > 64 || numThreads % 1 !== 0
          ? 'input-error'
          : '')
      "
      min="1"
      max="64"
    />
    <button
      class="ml-3 button-base button-blue"
      :disabled="isTreeBuilding || store.isSolverRunning || store.isFinalizing"
      @click="buildTree"
    >
      Build New Tree
    </button>
  </div>

  <div class="my-1">Status: {{ treeStatus }}</div>

  <div class="mt-3">
    <div>
      Precision mode:
      <Tippy
        class="inline-block cursor-help"
        max-width="500px"
        placement="bottom"
        trigger="mouseenter click"
        :delay="[200, 0]"
        :interactive="true"
      >
        <QuestionMarkCircleIcon class="w-5 h-5 text-gray-600" />
        <template #content>
          <div class="px-1 py-0.5 text-justify">
            Precision mode mainly affects memory usage, but it also has several
            other effects.
            <ul class="pl-6 list-disc">
              <li class="mt-1">
                Memory efficiency: 16-bit integer > 32-bit FP. The 16-bit
                integer mode uses only about half the memory of the 32-bit FP
                mode.
              </li>
              <li class="mt-1">
                Performance: Depends on the environment. The 32-bit FP mode
                requires fewer execution instructions than the 16-bit integer
                mode. However, memory reads and writes can become a bottleneck
                in highly multithreaded environments, and in such situations the
                16-bit integer mode may provide better performance.
              </li>
              <li class="mt-1">
                Significant digits: 32-bit FP (about 7 digits) > 16-bit integer
                (about 4 digits). The 16-bit integer mode is not suitable for
                satisfying an exploitability target of less than 0.1%.
              </li>
            </ul>
          </div>
        </template>
      </Tippy>
    </div>
    <div class="mt-1 ml-2">
      <label :class="{ 'cursor-pointer': !store.hasSolverRun }">
        <input
          v-model="isCompressionEnabled"
          class="mr-2 cursor-pointer disabled:cursor-default"
          type="radio"
          name="compression"
          :value="false"
          :disabled="store.hasSolverRun"
        />
        <span class="inline-block w-[6.75rem] ml-1">32-bit FP:</span>
        needs
        {{
          memoryUsageRaw >= 1023.5 * 1024 * 1024
            ? (memoryUsageRaw / (1024 * 1024 * 1024)).toFixed(2) + "GB"
            : (memoryUsageRaw / (1024 * 1024)).toFixed(0) + "MB"
        }}
        RAM
        {{ memoryUsageRaw > maxMemoryUsage ? "(out of memory)" : "" }}
      </label>
    </div>
    <div class="ml-2">
      <label :class="{ 'cursor-pointer': !store.hasSolverRun }">
        <input
          v-model="isCompressionEnabled"
          class="mr-2 cursor-pointer disabled:cursor-default"
          type="radio"
          name="compression"
          :value="true"
          :disabled="store.hasSolverRun"
        />
        <span class="inline-block w-[6.75rem] ml-1">16-bit integer:</span>
        needs
        {{
          memoryUsageRawCompressed >= 1023.5 * 1024 * 1024
            ? (memoryUsageRawCompressed / (1024 * 1024 * 1024)).toFixed(2) +
              "GB"
            : (memoryUsageRawCompressed / (1024 * 1024)).toFixed(0) + "MB"
        }}
        RAM
        {{ memoryUsageRawCompressed > maxMemoryUsage ? "(out of memory)" : "" }}
      </label>
    </div>
    <div
      v-if="store.isBunchingEnabled && store.bunchingFlop.length > 0"
      class="mt-1.5"
    >
      Additional RAM usage for bunching effect:
      {{
        memoryUsageBunching >= 1023.5 * 1024 * 1024
          ? (memoryUsageBunching / (1024 * 1024 * 1024)).toFixed(2) + "GB"
          : (memoryUsageBunching / (1024 * 1024)).toFixed(0) + "MB"
      }}
    </div>
    <div
      v-if="memoryUsage > maxMemoryUsage && osName !== 'macos'"
      class="mt-1.5"
    >
      Available RAM:
      {{ (availableMemory / (1024 * 1024 * 1024)).toFixed(2) }}GB /
      {{ (totalMemory / (1024 * 1024 * 1024)).toFixed() }}GB total
    </div>
    <div
      v-if="memoryUsage > maxMemoryUsage && osName === 'macos'"
      class="mt-1.5"
    >
      RAM limit: {{ (maxMemoryUsage / (1024 * 1024 * 1024)).toFixed(1) }}GB (=
      70% * {{ (totalMemory / (1024 * 1024 * 1024)).toFixed() }}GB total)
    </div>

    <div class="mt-4">
      Target exploitability:
      <Tippy
        class="inline-block cursor-help"
        max-width="500px"
        placement="bottom"
        trigger="mouseenter click"
        :delay="[200, 0]"
        :interactive="true"
      >
        <QuestionMarkCircleIcon class="w-5 h-5 text-gray-600" />
        <template #content>
          <div class="px-1 py-0.5 text-justify">
            <div>
              Specifies the acceptable distance to the Nash equilibrium. A lower
              value gives more accurate results, but also requires more
              computation time.
            </div>
            <div class="mt-3">
              <span class="underline">A more detailed description:</span>
              When a Nash equilibrium solution is obtained, the strategies of
              both players become MESs (Maximally Exploitative Strategies) to
              each other. Using this property, we define the distance to the
              Nash equilibrium of the obtained strategy as follows:
            </div>
            <div class="my-1 text-center">
              Distance = (Opponent's MES EV) - (Opponent's obtained EV).
            </div>
            <div>
              This distance is always non-negative and is zero if and only if
              the obtained strategy is a part of a particular Nash equilibrium.
              Exploitability is defined as the average distance of both players.
            </div>
          </div>
        </template>
      </Tippy>
      <input
        v-model="targetExploitability"
        type="number"
        :class="
          'w-20 ml-3 px-2 py-1 rounded-lg text-sm text-center ' +
          (targetExploitability <= 0 ? 'input-error' : '')
        "
        :disabled="store.hasSolverRun && !store.isSolverPaused"
        min="0"
        step="0.05"
      />
      %
    </div>

    <div class="mt-1">
      Maximum number of iterations:
      <input
        v-model="maxIterations"
        type="number"
        :class="
          'w-[5.5rem] ml-2 px-2 py-1 rounded-lg text-sm text-center ' +
          (maxIterations < 0 ||
          maxIterations % 1 !== 0 ||
          maxIterations > 100000
            ? 'input-error'
            : '')
        "
        :disabled="store.hasSolverRun && !store.isSolverPaused"
        min="0"
        max="100000"
      />
    </div>

    <div
      v-if="!areFlopMatching && !store.hasSolverRun"
      class="mt-2 text-red-500 font-semibold"
    >
      Error: The input flop and the bunching data do not match.
    </div>

    <div
      v-if="
        store.isBunchingEnabled &&
        store.bunchingFlop.length === 0 &&
        !store.hasSolverRun
      "
      class="mt-2 text-orange-500 font-semibold"
    >
      Warning: Bunching effect is disabled because the data is not ready.
    </div>

    <div class="flex mt-6 gap-3">
      <button
        class="button-base button-blue"
        :disabled="
          store.hasSolverRun ||
          store.isBunchingRunning ||
          memoryUsageSelected > maxMemoryUsage ||
          !areFlopMatching ||
          numThreads < 1 ||
          numThreads > 64 ||
          numThreads % 1 !== 0 ||
          targetExploitability <= 0 ||
          maxIterations < 0 ||
          maxIterations % 1 !== 0 ||
          maxIterations > 100000
        "
        @click="runSolver"
      >
        Run Solver
      </button>
      <button
        class="button-base button-red"
        :disabled="!store.isSolverRunning"
        @click="() => (terminateFlag = true)"
      >
        Stop
      </button>
      <button
        v-if="!store.isSolverPaused"
        class="button-base button-green"
        :disabled="!store.isSolverRunning"
        @click="() => (pauseFlag = true)"
      >
        Pause
      </button>
      <button
        v-else
        class="button-base button-green"
        :disabled="
          store.isBunchingRunning ||
          numThreads < 1 ||
          numThreads > 64 ||
          numThreads % 1 !== 0 ||
          targetExploitability <= 0 ||
          maxIterations < 0 ||
          maxIterations % 1 !== 0 ||
          maxIterations > 100000
        "
        @click="resumeSolver"
      >
        Resume
      </button>
    </div>

    <div
      v-if="memoryUsage > maxMemoryUsage && !store.hasSolverRun"
      class="mt-6"
    >
      <button
        class="button-base button-red"
        @click="maxMemoryUsage = Number.POSITIVE_INFINITY"
      >
        Ignore RAM Limit (not recommended)
      </button>
    </div>

    <div v-if="store.hasSolverRun" class="mt-6">
      <div class="flex items-center text-sm font-bold">
        <span
          v-if="store.isSolverRunning || store.isFinalizing"
          class="spinner inline-block mr-3"
        ></span>
        {{
          store.isSolverRunning
            ? "Solver running..."
            : store.isFinalizing
            ? "Finalizing..."
            : store.isSolverPaused
            ? "Solver paused."
            : store.isSolverError
            ? solverErrorText
            : "Solver finished."
        }}
      </div>

      <!-- Real-time progress bar -->
      <div v-if="store.isSolverRunning || store.isSolverFinished" class="mt-3 w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
        <div
          class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-150"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

      <div class="mt-2 text-xs text-slate-300 font-mono space-y-1">
        <div>{{ iterationText }}</div>
        <div>{{ exploitabilityText }}</div>
        <div v-if="timeText">{{ timeText }}</div>
      </div>

      <!-- Finished Actions Card -->
      <div
        v-if="store.isSolverFinished"
        class="mt-4 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg"
      >
        <div>
          <div class="text-sm font-bold text-emerald-300">✓ Solved to Nash Equilibrium</div>
          <div class="text-xs text-slate-300 mt-0.5">Solution is ready for study and training.</div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
            @click="store.navView = 'results'"
          >
            <span>📊</span>
            <span>Study GTO Results</span>
          </button>
          <button
            class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
            @click="store.navView = 'trainer'"
          >
            <span>🃏</span>
            <span>Practice in Trainer</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Live Solver Diagnostics & Execution Console -->
    <SolverLogConsole @run-diagnostics="handleRunDiagnostics" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useStore,
  useConfigStore,
  useTmpConfigStore,
  useSavedConfigStore,
  saveConfigTmp,
  saveConfig,
} from "../store";
import {
  MAX_AMOUNT,
  convertBetString,
  ROOT_LINE_STRING,
  INVALID_LINE_STRING,
  readableLineString,
  cardText,
} from "../utils";
import * as invokes from "../invokes";
import SolverLogConsole from "./SolverLogConsole.vue";
import {
  logInfo,
  logWarn,
  logError,
  logSuccess,
  diagnoseSpotConfig,
} from "../utils/solverLogger";

import { Tippy } from "vue-tippy";
import { QuestionMarkCircleIcon } from "@heroicons/vue/20/solid";

const checkConfig = (
  config: ReturnType<typeof useConfigStore>
): string | null => {
  if (config.board.length < 3) {
    config.board = [48, 36, 12];
  }

  config.startingPot = Math.round(config.startingPot || 5);
  config.effectiveStack = Math.round(config.effectiveStack || 98);

  if (config.startingPot <= 0) {
    return "Starting pot must be positive";
  }

  if (config.startingPot > MAX_AMOUNT) {
    return "Starting pot is too large";
  }

  if (config.effectiveStack <= 0) {
    return "Effective stack must be positive";
  }

  if (config.effectiveStack > MAX_AMOUNT) {
    return "Effective stack is too large";
  }

  const betConfig = [
    { s: config.oopFlopBetSanitized, kind: "OOP flop bet" },
    { s: config.oopFlopRaiseSanitized, kind: "OOP flop raise" },
    { s: config.oopTurnBetSanitized, kind: "OOP turn bet" },
    { s: config.oopTurnRaiseSanitized, kind: "OOP turn raise" },
    { s: config.oopRiverBetSanitized, kind: "OOP river bet" },
    { s: config.oopRiverRaiseSanitized, kind: "OOP river raise" },
    { s: config.ipFlopBetSanitized, kind: "IP flop bet" },
    { s: config.ipFlopRaiseSanitized, kind: "IP flop raise" },
    { s: config.ipTurnBetSanitized, kind: "IP turn bet" },
    { s: config.ipTurnRaiseSanitized, kind: "IP turn raise" },
    { s: config.ipRiverBetSanitized, kind: "IP river bet" },
    { s: config.ipRiverRaiseSanitized, kind: "IP river raise" },
  ];

  for (const { s, kind } of betConfig) {
    if (!s.valid) {
      return `${kind}: ${s.s}`;
    }
  }

  if (config.donkOption) {
    if (!config.oopTurnDonkSanitized.valid) {
      return `OOP turn donk: ${config.oopTurnDonkSanitized.s}`;
    }
    if (!config.oopRiverDonkSanitized.valid) {
      return `OOP river donk: ${config.oopRiverDonkSanitized.s}`;
    }
  }

  if (config.addAllInThreshold < 0) {
    return "Invalid add all-in threshold";
  }

  if (config.forceAllInThreshold < 0) {
    return "Invalid force all-in threshold";
  }

  if (config.mergingThreshold < 0) {
    return "Invalid merging threshold";
  }

  if (
    config.expectedBoardLength > 0 &&
    config.board.length !== config.expectedBoardLength
  ) {
    return `Invalid board (expected ${config.expectedBoardLength} cards)`;
  }

  const addedLinesArray =
    config.addedLines === ""
      ? []
      : config.addedLines.split(",").map(readableLineString);

  const removedLinesArray =
    config.removedLines === ""
      ? []
      : config.removedLines.split(",").map(readableLineString);

  if (
    addedLinesArray.includes(ROOT_LINE_STRING) ||
    addedLinesArray.includes(INVALID_LINE_STRING) ||
    removedLinesArray.includes(ROOT_LINE_STRING) ||
    removedLinesArray.includes(INVALID_LINE_STRING)
  ) {
    return "Invalid line found (loaded broken configurations?)";
  }

  if (
    ![0, 3, 4, 5].includes(config.expectedBoardLength) ||
    (config.expectedBoardLength === 0 &&
      (addedLinesArray.length > 0 || removedLinesArray.length > 0)) ||
    (config.expectedBoardLength > 0 &&
      addedLinesArray.length === 0 &&
      removedLinesArray.length === 0)
  ) {
    return "Invalid configurations (loaded broken configurations?)";
  }

  return null;
};

const store = useStore();
const config = useConfigStore();
const tmpConfig = useTmpConfigStore();
const savedConfig = useSavedConfigStore();

const numThreads = ref(navigator.hardwareConcurrency || 1);
const targetExploitability = ref(0.3);
const maxIterations = ref(1000);

const isTreeBuilding = ref(false);
const isTreeBuilt = ref(false);
const treeStatus = ref("Module not loaded");
const memoryUsageRaw = ref(0);
const memoryUsageRawCompressed = ref(0);
const memoryUsageBunching = ref(0);
const osName = ref<Awaited<ReturnType<typeof invokes.osName>> | null>(null);
const maxMemoryUsage = ref(0);
const availableMemory = ref(0);
const totalMemory = ref(0);
const isCompressionEnabled = ref(false);
const solverErrorText = ref("");
const terminateFlag = ref(false);
const pauseFlag = ref(false);
const currentIteration = ref(-1);
const exploitability = ref(Number.POSITIVE_INFINITY);
const elapsedTimeMs = ref(-1);

let startTime = 0;
let exploitabilityUpdated = false;

const memoryUsage = computed(() => {
  if (store.isBunchingEnabled && store.bunchingFlop.length > 0) {
    return memoryUsageRaw.value + memoryUsageBunching.value;
  } else {
    return memoryUsageRaw.value;
  }
});

const memoryUsageCompressed = computed(() => {
  if (store.isBunchingEnabled && store.bunchingFlop.length > 0) {
    return memoryUsageRawCompressed.value + memoryUsageBunching.value;
  } else {
    return memoryUsageRawCompressed.value;
  }
});

const memoryUsageSelected = computed(() => {
  if (isCompressionEnabled.value) {
    return memoryUsageCompressed.value;
  } else {
    return memoryUsage.value;
  }
});

const areFlopMatching = computed(() => {
  const flop = savedConfig.board.slice(0, 3);
  const bunchingFlop = store.bunchingFlop;
  return (
    !store.isBunchingEnabled ||
    bunchingFlop.length === 0 ||
    (flop[0] === bunchingFlop[0] &&
      flop[1] === bunchingFlop[1] &&
      flop[2] === bunchingFlop[2])
  );
});

const iterationText = computed(() => {
  if (currentIteration.value === -1) {
    return "Allocating memory...";
  } else if (currentIteration.value === -2) {
    return "Collecting bunching data...";
  } else {
    return `Iteration: ${currentIteration.value}`;
  }
});

const exploitabilityText = computed(() => {
  if (!Number.isFinite(exploitability.value)) {
    return "";
  } else {
    const valueText = exploitability.value.toFixed(2);
    const percent = (exploitability.value * 100) / config.startingPot;
    const percentText = `${percent.toFixed(2)}%`;
    return `Exploitability: ${valueText} (${percentText})`;
  }
});

const timeText = computed(() => {
  if (elapsedTimeMs.value === -1 || !store.isSolverFinished) {
    return "";
  } else {
    return `Time: ${(elapsedTimeMs.value / 1000).toFixed(2)}s`;
  }
});

const handleRunDiagnostics = () => {
  logInfo("CONFIG", "Esecuzione controllo auto-diagnostica dello spot...");
  const diag = diagnoseSpotConfig(
    config.board,
    config.startingPot,
    config.effectiveStack,
    store.ranges[0],
    store.ranges[1],
    {
      oopFlopBet: config.oopFlopBet,
      oopFlopRaise: config.oopFlopRaise,
      ipFlopBet: config.ipFlopBet,
      ipFlopRaise: config.ipFlopRaise,
      oopTurnBet: config.oopTurnBet,
      ipTurnBet: config.ipTurnBet,
      oopRiverBet: config.oopRiverBet,
      ipRiverBet: config.ipRiverBet,
    }
  );

  for (const info of diag.info) {
    logInfo("CONFIG", info);
  }
  for (const warn of diag.warnings) {
    logWarn("CONFIG", warn);
  }
  for (const err of diag.errors) {
    logError("CONFIG", err);
  }

  if (diag.hasErrors) {
    logError(
      "CONFIG",
      "Attenzione: Rilevati errori bloccanti nella configurazione. Correggili prima di avviare il solver."
    );
  } else {
    logSuccess(
      "CONFIG",
      "Configurazione verificata con successo! I range, il board e le bet size sono pronti."
    );
  }
};

const buildTree = async () => {
  isTreeBuilt.value = false;

  logInfo("CONFIG", "Verifica parametri spot prima della generazione albero...");
  const configError = checkConfig(config);
  if (configError !== null) {
    treeStatus.value = `Error: ${configError}`;
    logError("CONFIG", `Errore nei parametri di configurazione: ${configError}`);
    return;
  }

  const boardNames = (config.board || []).map((c) => `${cardText(c).rank}${cardText(c).suit}`).join(" ");
  logInfo("TREE", `Avvio generazione albero azioni per Board [ ${boardNames} ]`);
  logInfo("CONFIG", `Starting Pot: ${config.startingPot}bb | Effective Stack: ${config.effectiveStack}bb`);
  logInfo(
    "CONFIG",
    `Flop Sizings -> OOP Bet: '${config.oopFlopBet}', Raise: '${config.oopFlopRaise}' | IP Bet: '${config.ipFlopBet}', Raise: '${config.ipFlopRaise}'`
  );

  saveConfigTmp();
  isTreeBuilding.value = true;
  treeStatus.value = "Building tree...";

  try {
    const errorString = await invokes.gameInit(
      tmpConfig.board,
      tmpConfig.startingPot,
      tmpConfig.effectiveStack,
      tmpConfig.rakePercent / 100,
      tmpConfig.rakeCap,
      tmpConfig.donkOption,
      convertBetString(tmpConfig.oopFlopBet),
      convertBetString(tmpConfig.oopFlopRaise),
      convertBetString(tmpConfig.oopTurnBet),
      convertBetString(tmpConfig.oopTurnRaise),
      tmpConfig.donkOption ? convertBetString(tmpConfig.oopTurnDonk) : "",
      convertBetString(tmpConfig.oopRiverBet),
      convertBetString(tmpConfig.oopRiverRaise),
      tmpConfig.donkOption ? convertBetString(tmpConfig.oopRiverDonk) : "",
      convertBetString(tmpConfig.ipFlopBet),
      convertBetString(tmpConfig.ipFlopRaise),
      convertBetString(tmpConfig.ipTurnBet),
      convertBetString(tmpConfig.ipTurnRaise),
      convertBetString(tmpConfig.ipRiverBet),
      convertBetString(tmpConfig.ipRiverRaise),
      tmpConfig.addAllInThreshold / 100,
      tmpConfig.forceAllInThreshold / 100,
      tmpConfig.mergingThreshold / 100,
      tmpConfig.addedLines,
      tmpConfig.removedLines
    );

    if (errorString) {
      isTreeBuilding.value = false;
      treeStatus.value = "Error: " + errorString;
      logError("TREE", `Creazione albero fallita: ${errorString}`, {
        board: config.board,
        pot: config.startingPot,
        stack: config.effectiveStack,
      });
      return;
    }

    saveConfig();

    [memoryUsageRaw.value, memoryUsageRawCompressed.value] =
      await invokes.gameMemoryUsage();
    memoryUsageBunching.value = await invokes.gameMemoryUsageBunching();

    osName.value = await invokes.osName();
    [availableMemory.value, totalMemory.value] = await invokes.memory();

    if (osName.value === "macos") {
      maxMemoryUsage.value = totalMemory.value * 0.7;
    } else {
      maxMemoryUsage.value = availableMemory.value;
    }

    if (
      memoryUsage.value > maxMemoryUsage.value &&
      memoryUsageCompressed.value <= maxMemoryUsage.value
    ) {
      isCompressionEnabled.value = true;
    }

    const rawMb = (memoryUsageRaw.value / (1024 * 1024)).toFixed(0);
    const compMb = (memoryUsageRawCompressed.value / (1024 * 1024)).toFixed(0);
    const availGb = (availableMemory.value / (1024 * 1024 * 1024)).toFixed(1);

    isTreeBuilding.value = false;
    isTreeBuilt.value = true;
    treeStatus.value = "Successfully built tree";

    logSuccess("TREE", "Albero delle azioni generato con successo!");
    logInfo("MEMORY", `RAM richiesta stimata: ${rawMb} MB (32-bit FP) | ${compMb} MB (16-bit compressa) — RAM disponibile: ${availGb} GB`);

    store.isSolverRunning = false;
    store.isSolverPaused = false;
    store.isSolverFinished = false;
    store.isSolverError = false;
  } catch (err: any) {
    isTreeBuilding.value = false;
    treeStatus.value = "Error: " + String(err);
    logError("TREE", `Eccezione imprevista durante la creazione dell'albero: ${err?.message || err}`);
  }
};

const progressPercent = computed(() => {
  if (store.isSolverFinished) return 100;
  if (!store.isSolverRunning) return 0;
  if (maxIterations.value > 0 && currentIteration.value >= 0) {
    const iterProgress =
      (currentIteration.value / Math.min(maxIterations.value, 200)) * 100;
    const target = (config.startingPot * targetExploitability.value) / 100;
    const expProgress =
      Number.isFinite(exploitability.value) && exploitability.value > 0
        ? Math.max(0, Math.min(100, (target / exploitability.value) * 100))
        : 0;
    return Math.min(
      99,
      Math.max(Math.round(iterProgress), Math.round(expProgress))
    );
  }
  return 10;
});

const runSolver = async () => {
  if (!isTreeBuilt.value) {
    logInfo("TREE", "Albero non ancora costruito. Avvio generazione automatica...");
    await buildTree();
    if (!isTreeBuilt.value) {
      logError("SOLVER", "Impossibile avviare il solver: la creazione dell'albero è fallita.");
      return;
    }
  }

  terminateFlag.value = false;
  pauseFlag.value = false;
  currentIteration.value = -1;
  exploitability.value = Number.POSITIVE_INFINITY;
  elapsedTimeMs.value = -1;

  store.isSolverRunning = true;
  store.isSolverFinished = false;
  store.isSolverError = false;

  startTime = performance.now();

  logInfo("SOLVER", `Avvio del solver con ${numThreads.value} thread(s)... Exploitability target: ${targetExploitability.value}%, Max iterazioni: ${maxIterations.value}`);
  await invokes.setNumThreads(numThreads.value);

  logInfo("MEMORY", `Allocazione memoria in corso (Precisione: ${isCompressionEnabled.value ? '16-bit' : '32-bit'})...`);
  await invokes.gameAllocateMemory(isCompressionEnabled.value);
  logSuccess("MEMORY", "Memoria allocata correttamente. Inizio iterazioni CFR...");

  if (store.isBunchingEnabled && store.bunchingFlop.length > 0) {
    currentIteration.value = -2;
    const errorString = await invokes.gameSetBunching();
    if (errorString) {
      solverErrorText.value = "Error: " + errorString;
      logError("SOLVER", `Errore bunching effect: ${errorString}`);
      store.isSolverRunning = false;
      store.isSolverError = true;
      return;
    }
  }

  currentIteration.value = 0;
  exploitability.value = Math.max(await invokes.gameExploitability(), 0);
  exploitabilityUpdated = true;

  await resumeSolver();
};

const resumeSolver = async () => {
  store.isSolverRunning = true;
  store.isSolverPaused = false;

  if (startTime === 0) {
    startTime = performance.now();
    await invokes.setNumThreads(numThreads.value);
  }

  const target = (config.startingPot * targetExploitability.value) / 100;

  while (
    !terminateFlag.value &&
    currentIteration.value < maxIterations.value &&
    (exploitability.value > target || currentIteration.value < 20)
  ) {
    if (pauseFlag.value) {
      const end = performance.now();
      elapsedTimeMs.value += end - startTime;
      startTime = 0;
      pauseFlag.value = false;
      store.isSolverRunning = false;
      store.isSolverPaused = true;
      logWarn("SOLVER", `Solver in pausa all'iterazione ${currentIteration.value}. Exploitability corrente: ${exploitability.value.toFixed(3)} bb`);
      return;
    }

    await invokes.gameSolveStep(currentIteration.value);
    ++currentIteration.value;
    exploitabilityUpdated = false;

    if (currentIteration.value % 5 === 0) {
      exploitability.value = Math.max(await invokes.gameExploitability(), 0);
      exploitabilityUpdated = true;
    }

    if (currentIteration.value % 20 === 0) {
      logInfo(
        "SOLVER",
        `Iterazione ${currentIteration.value}/${maxIterations.value} — Exploitability: ${exploitability.value.toFixed(3)} bb (${((exploitability.value * 100) / (config.startingPot || 1)).toFixed(2)}%)`
      );
    }
  }

  if (!exploitabilityUpdated) {
    exploitability.value = Math.max(await invokes.gameExploitability(), 0);
  }

  store.isSolverRunning = false;
  store.isFinalizing = true;
  logInfo("SOLVER", "Convergenza raggiunta o iterazioni massime completate. Finalizzazione strategie...");

  await invokes.gameFinalize();

  saveConfigTmp();
  saveConfig();

  store.isFinalizing = false;
  store.isSolverFinished = true;

  const end = performance.now();
  elapsedTimeMs.value += end - startTime;
  const totalSecs = (elapsedTimeMs.value / 1000).toFixed(2);
  logSuccess(
    "SOLVER",
    `Simulazione completata con successo in ${totalSecs}s! Exploitability finale: ${exploitability.value.toFixed(3)} bb`
  );
  logSuccess(
    "ANALYSIS",
    "La soluzione GTO è pronta! Clicca 'Study GTO Results' per visualizzare le heatmap di frequenze, Equity ed EV."
  );
};
</script>
