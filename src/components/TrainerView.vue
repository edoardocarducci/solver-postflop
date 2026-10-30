<template>
  <div class="flex flex-col h-full bg-slate-950 text-white select-none">
    <!-- Unsolved Solver Empty State Screen -->
    <div
      v-if="!store.isSolverFinished"
      class="flex-grow flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center"
    >
      <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-amber-500/5">
        ⚠️
      </div>
      <h2 class="text-xl font-bold text-slate-100 mb-2">
        Simulazione Flop non ancora Eseguita
      </h2>
      <p class="text-sm text-slate-400 mb-6 leading-relaxed">
        Per calcolare le frequenze ottimali GTO, l'EV esatto e distribuire <strong class="text-white">solo mani che appartengono ai tuoi range reali</strong>, è necessario prima eseguire o caricare la simulazione del Flop.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <button
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
          @click="store.navView = 'solver'"
        >
          <span>🚀</span>
          <span>Vai alla Scheda Solver</span>
        </button>

        <button
          v-if="lastSavedSpot"
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
          @click="loadSavedSpotForTrainer"
        >
          <span>📂</span>
          <span>Carica Soluzione Memorizzata</span>
        </button>

        <button
          class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
          @click="quickSolveStandardSpot"
        >
          <span>⚡</span>
          <span>Risolvi Subito Spot 6-Max 100bb</span>
        </button>
      </div>

      <div class="mt-8 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-left w-full space-y-1.5">
        <div class="font-bold text-slate-300">Come funziona il Trainer 6-Max Cash:</div>
        <div>1. I tuoi range OOP e IP definiti nel Solver (es. SRP UTG vs BB, BTN vs BB, 3-Bet, 4-Bet) vengono usati come base.</div>
        <div>2. Le tue carte (Hero) e quelle di Villain vengono estratte <strong class="text-slate-200">esclusivamente</strong> dal range con peso &gt; 0%.</div>
        <div>3. Quando prosegui su Turn e River, la soluzione viene ricalcolata sulla nuova carta per darti la strategia ottimale aggiornata.</div>
      </div>
    </div>

    <!-- Active Solved Trainer Mode -->
    <template v-else>
      <!-- Top Trainer Bar -->
      <div class="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            GTO Trainer
          </span>
          <h2 class="text-sm font-bold text-slate-100">
            6-Max Cash Practice ({{ spotName }})
          </h2>
        </div>

        <!-- Role Selector -->
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-semibold">Hero Role:</span>
          <div class="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              v-for="r in roleOptions"
              :key="r.id"
              :class="[
                'px-2.5 py-1 rounded-md font-semibold transition',
                userRole === r.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="changeRole(r.id)"
            >
              {{ r.label }}
            </button>
          </div>
        </div>

        <!-- Scenario Selector -->
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-semibold">Scenario:</span>
          <div class="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              v-for="sc in scenarioOptions"
              :key="sc.id"
              :class="[
                'px-2.5 py-1 rounded-md font-semibold transition',
                trainerScenario === sc.id ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              ]"
              @click="changeScenario(sc.id)"
            >
              {{ sc.label }}
            </button>
          </div>
        </div>

        <!-- Session Stats Summary -->
        <div class="flex items-center gap-4 text-xs font-mono">
          <div>
            <span class="text-slate-400">Hands:</span>
            <strong class="text-slate-200 ml-1">{{ sessionStats.totalHands }}</strong>
          </div>
          <div>
            <span class="text-slate-400">GTO Score:</span>
            <strong :class="sessionStats.gtoScore >= 80 ? 'text-emerald-400' : 'text-amber-400'" class="ml-1">
              {{ sessionStats.gtoScore.toFixed(1) }}%
            </strong>
          </div>
          <div>
            <span class="text-slate-400">Avg EV Loss:</span>
            <strong :class="sessionStats.avgEvLoss <= 0.1 ? 'text-emerald-400' : 'text-rose-400'" class="ml-1">
              -{{ sessionStats.avgEvLoss.toFixed(2) }} bb
            </strong>
          </div>
          <button
            class="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow flex items-center gap-1.5"
            @click="showRangeModal = true"
          >
            <span>👁️</span>
            <span>View Solution Ranges</span>
          </button>
          <button
            class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
            @click="startNewHand"
          >
            Deal Next Hand
          </button>
        </div>
      </div>

      <!-- Main Table Area -->
      <div class="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        <!-- Oval Poker Table Felt -->
        <div class="w-full max-w-4xl h-[460px] bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 rounded-[200px] border-[12px] border-amber-950/80 shadow-2xl relative flex flex-col justify-between items-center py-6 px-12">
          <!-- Center Table Info: Pot & Board -->
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
            <!-- Pot Badge -->
            <div class="px-4 py-1.5 rounded-full bg-black/60 border border-slate-700/80 text-xs font-mono font-bold text-amber-300 shadow">
              Pot: {{ currentPot.toFixed(1) }} bb — Street: {{ currentStreet.toUpperCase() }}
            </div>

            <!-- Action Context Message -->
            <div
              v-if="villainActionMessage"
              :class="[
                'px-4 py-1 rounded-full text-xs font-semibold shadow-md border pointer-events-auto',
                villainActionMessage.includes('bets') || villainActionMessage.includes('raises')
                  ? 'bg-amber-950/90 text-amber-300 border-amber-500 font-bold'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700'
              ]"
            >
              {{ villainActionMessage }}
            </div>

            <!-- Community Cards -->
            <div class="flex items-center gap-2 pointer-events-auto">
              <div
                v-for="(c, idx) in tableBoard"
                :key="idx"
                class="w-12 h-16 bg-white rounded-lg shadow-xl flex flex-col items-center justify-between p-1.5 border border-slate-300 transform transition-all hover:scale-105"
              >
                <div class="font-bold text-sm" :class="cardText(c).colorClass">
                  {{ cardText(c).rank }}
                </div>
                <div class="text-xl" :class="cardText(c).colorClass">
                  {{ cardText(c).suit }}
                </div>
              </div>

              <!-- Empty slots if flop/turn/river not fully dealt -->
              <div
                v-for="emptySlot in 5 - tableBoard.length"
                :key="'empty-' + emptySlot"
                class="w-12 h-16 rounded-lg border-2 border-dashed border-slate-800 bg-slate-950/30 flex items-center justify-center"
              >
                <span class="text-slate-700 font-bold text-lg">?</span>
              </div>
            </div>

            <!-- RNG Roll Badge -->
            <div class="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300">
              RNG Roll: <strong class="text-sky-400 font-bold">{{ rngRoll }}</strong> / 100
            </div>
          </div>

          <!-- Villain Seat (Top) -->
          <div class="flex flex-col items-center gap-1 z-10">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-300 shadow">
                {{ villainRole }}
              </div>
              <div class="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
                <div>
                  <span class="font-bold text-slate-200">Villain ({{ villainRole }})</span>
                  <span class="text-slate-400 block font-mono">{{ villainStack.toFixed(1) }} bb</span>
                </div>
                <button
                  class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition"
                  title="Inspect Solution Ranges"
                  @click="showRangeModal = true"
                >
                  👁️ Range
                </button>
              </div>
            </div>
            <!-- Villain Cards (Backs or Revealed on showdown) -->
            <div class="flex gap-1 mt-1">
              <template v-if="isHandOver && villainHoleCards.length === 2">
                <div
                  v-for="c in villainHoleCards"
                  :key="c"
                  class="w-9 h-12 bg-white rounded border border-slate-300 shadow flex flex-col items-center justify-between p-1"
                >
                  <span class="font-bold text-xs" :class="cardText(c).colorClass">{{ cardText(c).rank }}</span>
                  <span class="text-xs" :class="cardText(c).colorClass">{{ cardText(c).suit }}</span>
                </div>
              </template>
              <template v-else>
                <div class="w-8 h-11 bg-red-900 rounded border border-red-700 shadow flex items-center justify-center text-[10px] text-red-300">
                  🂠
                </div>
                <div class="w-8 h-11 bg-red-900 rounded border border-red-700 shadow flex items-center justify-center text-[10px] text-red-300">
                  🂠
                </div>
              </template>
            </div>
          </div>

          <!-- Hero Seat (Bottom) -->
          <div class="flex flex-col items-center gap-2 z-10">
            <!-- Hero Cards -->
            <div class="flex gap-2">
              <div
                v-for="c in heroHoleCards"
                :key="c"
                class="w-14 h-20 bg-white rounded-lg shadow-2xl flex flex-col items-center justify-between p-2 border-2 border-slate-300"
              >
                <div class="font-bold text-base" :class="cardText(c).colorClass">
                  {{ cardText(c).rank }}
                </div>
                <div class="text-2xl" :class="cardText(c).colorClass">
                  {{ cardText(c).suit }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-full bg-blue-700 border-2 border-blue-400 flex items-center justify-center font-bold text-white shadow">
                {{ currentHeroRole }}
              </div>
              <div class="bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
                <div>
                  <span class="font-bold text-blue-300">Hero ({{ currentHeroRole }})</span>
                  <span class="text-slate-400 block font-mono">{{ heroStack.toFixed(1) }} bb</span>
                </div>
                <button
                  class="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-[11px] font-semibold border border-blue-700 transition"
                  title="Inspect Solution Ranges"
                  @click="showRangeModal = true"
                >
                  👁️ Range
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Decision Controls & Feedback Footer -->
      <div class="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-3">
        <!-- EV Loss & Decision Feedback Overlay Banner -->
        <div
          v-if="lastDecision || isHandOver"
          :class="[
            'p-3 rounded-xl border flex items-center justify-between transition-all shadow',
            lastDecision ? decisionBannerClass(lastDecision.grade) : 'bg-slate-800 border-slate-700 text-slate-100'
          ]"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ lastDecision ? decisionEmoji(lastDecision.grade) : '🏁' }}</span>
            <div>
              <div v-if="lastDecision" class="font-bold text-sm tracking-wide">
                {{ lastDecision.grade }} — Chosen: {{ lastDecision.actionName }}
              </div>
              <div v-else class="font-bold text-sm tracking-wide">
                Hand Complete
              </div>
              <div class="text-xs opacity-90">
                <template v-if="lastDecision">
                  GTO Freq: <strong>{{ (lastDecision.gtoFreq * 100).toFixed(1) }}%</strong> |
                  Best Action: <strong>{{ lastDecision.bestActionName }}</strong> |
                  EV Loss: <strong>-{{ lastDecision.evLoss.toFixed(2) }} bb</strong>
                </template>
                <span v-if="handStatusMessage" :class="[lastDecision ? 'ml-2' : '', 'font-bold text-amber-300']">
                  {{ handStatusMessage }}
                </span>
              </div>
            </div>
          </div>

          <button
            class="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 font-bold text-xs transition"
            @click="advanceStreetOrHand"
          >
            {{ advanceButtonLabel }}
          </button>
        </div>

        <!-- Action Buttons -->
        <div v-if="!lastDecision && !isHandOver" class="flex items-center justify-center gap-3">
          <button
            v-for="act in availableActions"
            :key="act.id"
            :class="[
              'px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition active:scale-95 border flex flex-col items-center min-w-[120px]',
              act.style
            ]"
            @click="chooseAction(act)"
          >
            <span>{{ act.label }}</span>
            <span v-if="act.amount" class="text-[11px] font-mono opacity-80">{{ act.amount }}</span>
          </button>
        </div>
      </div>

      <!-- Solution Range Modal -->
      <TrainerRangeModal
        v-if="showRangeModal"
        :hero-hole-cards="heroHoleCards"
        :hero-role="currentHeroRole"
        :spot-title="spotName"
        @close="showRangeModal = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { cardText } from "../utils";
import { useStore, useConfigStore } from "../store";
import { localSolver } from "../utils/localSolver";
import { evaluateCombo } from "../utils/handCategorizer";
import { BUILTIN_SIX_MAX_SPOTS } from "../data/six_max_ranges";
import { getLastSolvedSpot } from "../utils/heatmapStorage";
import * as invokes from "../invokes";
import { parsePioRangePercent } from "../utils/rangeParser";
import TrainerRangeModal from "./TrainerRangeModal.vue";

const store = useStore();
const configStore = useConfigStore();

const showRangeModal = ref(false);
const lastSavedSpot = ref(getLastSolvedSpot());

interface ActionBtn {
  id: string;
  actIdx: number;
  label: string;
  amount?: string;
  style: string;
  freq: number;
  ev: number;
}

interface DecisionResult {
  actionName: string;
  bestActionName: string;
  gtoFreq: number;
  evLoss: number;
  grade: "Best Move" | "Correct" | "Inaccuracy" | "Mistake" | "Blunder";
}

const roleOptions = [
  { id: "OOP", label: "OOP (Player 0)" },
  { id: "IP", label: "IP (Player 1)" },
  { id: "ALT", label: "Alternate" },
] as const;

const scenarioOptions = [
  { id: "auto", label: "Auto (GTO)" },
  { id: "facing_bet", label: "Facing OOP Bet" },
  { id: "facing_check", label: "Facing OOP Check" },
] as const;

const userRole = ref<"OOP" | "IP" | "ALT">("OOP");
const trainerScenario = ref<"auto" | "facing_bet" | "facing_check">("auto");
const currentHeroRole = ref<"BB" | "SB">("BB");
const villainRole = computed(() => (currentHeroRole.value === "BB" ? "SB" : "BB"));
const villainActionMessage = ref("");

const spotName = computed(() => {
  return "6-Max Cash 100bb";
});

const currentPot = ref(5.5);
const heroStack = ref(97.5);
const villainStack = ref(97.5);
const rngRoll = ref(42);
const currentStreet = ref<"flop" | "turn" | "river">("flop");

// Board & Hole cards
const tableBoard = ref<number[]>([]);
const heroHoleCards = ref<number[]>([]);
const villainHoleCards = ref<number[]>([]);

const lastDecision = ref<DecisionResult | null>(null);
const isHandOver = ref(false);
const handStatusMessage = ref("");
const pendingFacingVillainAction = ref(false);
const pendingStreetAdvance = ref(false);

// Concrete solver history tracking for entire multi-street hand
const trainerHistory = ref<number[]>([]);

const sessionStats = ref({
  totalHands: 0,
  gtoScore: 100,
  avgEvLoss: 0,
  blundersCount: 0,
});

const availableActions = ref<ActionBtn[]>([]);

const advanceButtonLabel = computed(() => {
  if (isHandOver.value) return "Deal Next Hand";
  if (pendingFacingVillainAction.value) return "Respond to Villain &rarr;";
  if (tableBoard.value.length === 3) return "Deal Turn Card &rarr;";
  if (tableBoard.value.length === 4) return "Deal River Card &rarr;";
  return "Continue Hand &rarr;";
});

const syncPotAndStacks = () => {
  currentPot.value = localSolver.currentNode.pot;
  const heroIdx = currentHeroRole.value === "BB" ? 0 : 1;
  const heroBet =
    (heroIdx === 0
      ? localSolver.currentNode.oopTotalBet
      : localSolver.currentNode.ipTotalBet) || 0;
  const villainBet =
    (heroIdx === 0
      ? localSolver.currentNode.ipTotalBet
      : localSolver.currentNode.oopTotalBet) || 0;
  heroStack.value = Math.max(0, (localSolver.effectiveStack || 97.5) - heroBet);
  villainStack.value = Math.max(
    0,
    (localSolver.effectiveStack || 97.5) - villainBet
  );
};

// Sample an action index for Villain at the current node using actual solver/locked strategy
const sampleVillainActionIndex = (villainIdx: number): number => {
  const numActions = localSolver.currentNode.actions.length;
  if (numActions <= 1) return 0;

  const vCards = localSolver.privateCards[villainIdx];
  if (villainHoleCards.value.length === 2 && vCards && vCards.length > 0) {
    const vPair =
      Math.min(villainHoleCards.value[0], villainHoleCards.value[1]) |
      (Math.max(villainHoleCards.value[0], villainHoleCards.value[1]) << 8);
    const vComboIdx = vCards.findIndex((c) => c === vPair);
    if (vComboIdx >= 0 && localSolver.strategy.length >= numActions * vCards.length) {
      let rand = Math.random();
      for (let a = 0; a < numActions; a++) {
        const freq = localSolver.strategy[a * vCards.length + vComboIdx] ?? 0;
        rand -= freq;
        if (rand <= 0) return a;
      }
      return numActions - 1;
    }
  }

  // Fallback realistic frequencies
  const isFacingBet =
    numActions === 3 && localSolver.currentNode.actions[0]?.name === "Fold";
  const r = Math.random();
  if (isFacingBet) {
    return r < 0.38 ? 0 : r < 0.94 ? 1 : 2;
  }
  return r < 0.72 ? 0 : r < 0.94 ? 1 : Math.min(2, numActions - 1);
};

const changeRole = (r: "OOP" | "IP" | "ALT") => {
  userRole.value = r;
  startNewHand();
};

const changeScenario = (sc: "auto" | "facing_bet" | "facing_check") => {
  trainerScenario.value = sc;
  startNewHand();
};

const quickSolveStandardSpot = async () => {
  const preset = BUILTIN_SIX_MAX_SPOTS[0];
  const board = [48, 36, 12]; // Ks Td 4s
  configStore.board = [...board];
  configStore.startingPot = preset.startingPot;
  configStore.effectiveStack = preset.effectiveStack;

  store.ranges[0] = [...parsePioRangePercent(preset.oopRange)];
  store.ranges[1] = [...parsePioRangePercent(preset.ipRange)];

  await invokes.rangeFromString(0, preset.oopRange).catch(() => {});
  await invokes.rangeFromString(1, preset.ipRange).catch(() => {});

  localSolver.init(
    board,
    preset.startingPot,
    preset.effectiveStack,
    store.ranges[0],
    store.ranges[1]
  );
  store.isSolverFinished = true;
  startNewHand();
};

const startNewHand = () => {
  if (!store.isSolverFinished) return;

  lastDecision.value = null;
  isHandOver.value = false;
  handStatusMessage.value = "";
  pendingFacingVillainAction.value = false;
  pendingStreetAdvance.value = false;
  currentStreet.value = "flop";
  rngRoll.value = Math.floor(Math.random() * 100) + 1;

  if (userRole.value === "ALT") {
    currentHeroRole.value = currentHeroRole.value === "BB" ? "SB" : "BB";
  } else {
    currentHeroRole.value = userRole.value === "OOP" ? "BB" : "SB";
  }

  // Base board from solver
  tableBoard.value = localSolver.initialBoard.slice(0, 3);
  if (tableBoard.value.length < 3) {
    tableBoard.value = [48, 36, 12];
  }

  // Reset solver history
  trainerHistory.value = [];
  localSolver.applyHistory(trainerHistory.value);

  const heroIdx = currentHeroRole.value === "BB" ? 0 : 1;
  const villainIdx = heroIdx === 0 ? 1 : 0;

  // 1. Sample Hero's combo STRICTLY from Hero's positive-weight range
  const heroCards = localSolver.privateCards[heroIdx];
  const heroWeights = localSolver.preflopWeights[heroIdx];

  const validHeroIndices: number[] = [];
  let totalHeroWeight = 0;

  for (let i = 0; i < heroCards.length; i++) {
    const w = heroWeights[i] || 0;
    if (w > 0.005) {
      validHeroIndices.push(i);
      totalHeroWeight += w;
    }
  }

  if (validHeroIndices.length === 0) {
    heroHoleCards.value = [51, 47]; // As Kh
  } else {
    let rand = Math.random() * totalHeroWeight;
    let chosenIdx = validHeroIndices[0];
    for (const idx of validHeroIndices) {
      rand -= heroWeights[idx];
      if (rand <= 0) {
        chosenIdx = idx;
        break;
      }
    }
    const pair = heroCards[chosenIdx];
    heroHoleCards.value = [pair & 0xff, pair >>> 8];
  }

  // 2. Sample Villain's combo strictly from Villain's range excluding Hero and Board cards
  const villainCards = localSolver.privateCards[villainIdx];
  const villainWeights = localSolver.preflopWeights[villainIdx];
  const heroCardSet = new Set(heroHoleCards.value);
  const boardCardSet = new Set(tableBoard.value);

  const validVillainIndices: number[] = [];
  let totalVillainWeight = 0;

  for (let i = 0; i < villainCards.length; i++) {
    const pair = villainCards[i];
    const c1 = pair & 0xff;
    const c2 = pair >>> 8;
    if (
      heroCardSet.has(c1) ||
      heroCardSet.has(c2) ||
      boardCardSet.has(c1) ||
      boardCardSet.has(c2)
    ) {
      continue;
    }
    const w = villainWeights[i] || 0;
    if (w > 0.005) {
      validVillainIndices.push(i);
      totalVillainWeight += w;
    }
  }

  if (validVillainIndices.length > 0) {
    let randV = Math.random() * totalVillainWeight;
    let chosenVIdx = validVillainIndices[0];
    for (const idx of validVillainIndices) {
      randV -= villainWeights[idx];
      if (randV <= 0) {
        chosenVIdx = idx;
        break;
      }
    }
    const vPair = villainCards[chosenVIdx];
    villainHoleCards.value = [vPair & 0xff, vPair >>> 8];
  } else {
    villainHoleCards.value = [];
  }

  // 3. Opening flop action based on positions
  if (heroIdx === 1) {
    // Hero is In Position (SB). Villain (OOP / BB) acts first!
    let vAct = 0;
    if (trainerScenario.value === "facing_bet") {
      vAct = 1;
    } else if (trainerScenario.value === "facing_check") {
      vAct = 0;
    } else {
      vAct = sampleVillainActionIndex(0);
    }

    if (vAct > 0) {
      const bAmt = localSolver.currentNode.actions[vAct]?.amount || 1.7;
      const bName = localSolver.currentNode.actions[vAct]?.name || "Bet 33%";
      trainerHistory.value.push(vAct);
      localSolver.applyHistory(trainerHistory.value);
      villainActionMessage.value = `⚠️ Villain (BB) ${bName} (${bAmt.toFixed(1)} bb). Hero is In Position to act.`;
    } else {
      trainerHistory.value.push(0); // OOP Checks
      localSolver.applyHistory(trainerHistory.value);
      villainActionMessage.value = `✓ Villain (BB) checks to Hero. Hero is In Position.`;
    }
    loadCurrentActions(1);
  } else {
    // Hero is Out of Position (BB). Hero acts first!
    trainerHistory.value = [];
    localSolver.applyHistory(trainerHistory.value);
    villainActionMessage.value = `Hero (BB) is Out of Position and first to act.`;
    loadCurrentActions(0);
  }

  syncPotAndStacks();
};

const loadCurrentActions = (heroIdx: number) => {
  const nodeActions = localSolver.currentNode.actions;
  const numActions = nodeActions.length;
  const heroCards = localSolver.privateCards[heroIdx];

  const hPair =
    Math.min(heroHoleCards.value[0], heroHoleCards.value[1]) |
    (Math.max(heroHoleCards.value[0], heroHoleCards.value[1]) << 8);

  const comboIdx = heroCards.findIndex((c) => c === hPair);

  availableActions.value = nodeActions.map((act, aIdx) => {
    let freq = 1.0 / numActions;
    let ev = localSolver.currentNode.pot * 0.5;

    if (comboIdx >= 0) {
      freq = localSolver.strategy[aIdx * heroCards.length + comboIdx] ?? freq;
      ev = localSolver.actionEv[aIdx * heroCards.length + comboIdx] ?? ev;
    }

    let style = "bg-slate-700 hover:bg-slate-600 border-slate-500 text-white";
    if (act.name === "Fold") {
      style = "bg-blue-600 hover:bg-blue-500 border-blue-400 text-white";
    } else if (act.name.startsWith("Check") || act.name === "Call") {
      style =
        "bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white";
    } else if (act.name.includes("33%")) {
      style = "bg-amber-600 hover:bg-amber-500 border-amber-400 text-white";
    } else if (
      act.name.includes("75%") ||
      act.name.startsWith("Bet") ||
      act.name === "Raise"
    ) {
      style = "bg-rose-600 hover:bg-rose-500 border-rose-400 text-white";
    }

    return {
      id: `act_${aIdx}`,
      actIdx: aIdx,
      label: act.name,
      amount: act.amount > 0 ? `${act.amount.toFixed(1)} bb` : undefined,
      style,
      freq,
      ev,
    };
  });
};

const resolveShowdown = () => {
  isHandOver.value = true;
  pendingStreetAdvance.value = false;
  pendingFacingVillainAction.value = false;

  const heroEval = evaluateCombo(
    heroHoleCards.value[0],
    heroHoleCards.value[1],
    tableBoard.value
  );
  const villainEval = evaluateCombo(
    villainHoleCards.value[0],
    villainHoleCards.value[1],
    tableBoard.value
  );

  const potStr = localSolver.currentNode.pot.toFixed(1);

  if (heroEval.rankScore > villainEval.rankScore) {
    handStatusMessage.value = `🌟 Hero wins ${potStr} bb at Showdown! (${heroEval.madeHand} vs ${villainEval.madeHand})`;
  } else if (heroEval.rankScore < villainEval.rankScore) {
    handStatusMessage.value = `❌ Villain wins ${potStr} bb with ${villainEval.madeHand} (Hero had ${heroEval.madeHand}).`;
  } else {
    handStatusMessage.value = `🤝 Split Pot! Both players hold ${heroEval.madeHand}.`;
  }
};

const chooseAction = (act: ActionBtn) => {
  const bestAction = availableActions.value.reduce((prev, curr) =>
    curr.ev > prev.ev ? curr : prev
  );
  const deltaEv = Math.max(0, bestAction.ev - act.ev);

  let grade: DecisionResult["grade"] = "Best Move";
  if (act.id === bestAction.id || deltaEv < 0.05) {
    grade = "Best Move";
  } else if (act.freq >= 0.05 && deltaEv < 0.2) {
    grade = "Correct";
  } else if (deltaEv < 0.5) {
    grade = "Inaccuracy";
  } else if (deltaEv < 1.2) {
    grade = "Mistake";
  } else {
    grade = "Blunder";
  }

  lastDecision.value = {
    actionName: act.label,
    bestActionName: bestAction.label,
    gtoFreq: act.freq,
    evLoss: deltaEv,
    grade,
  };

  // Update session stats
  sessionStats.value.totalHands++;
  const isCorrect = grade === "Best Move" || grade === "Correct";
  const prevCorrect =
    (sessionStats.value.gtoScore / 100) * (sessionStats.value.totalHands - 1);
  sessionStats.value.gtoScore =
    ((prevCorrect + (isCorrect ? 1 : 0)) / sessionStats.value.totalHands) * 100;
  sessionStats.value.avgEvLoss =
    (sessionStats.value.avgEvLoss * (sessionStats.value.totalHands - 1) +
      deltaEv) /
    sessionStats.value.totalHands;

  // Record Hero action in history
  trainerHistory.value.push(act.actIdx);
  localSolver.applyHistory(trainerHistory.value);
  syncPotAndStacks();

  const state = localSolver.currentNode;

  if (act.label === "Fold" || state.currentPlayer === "terminal") {
    if (act.label === "Fold") {
      isHandOver.value = true;
      handStatusMessage.value = "Hero folds. Villain wins pot.";
    } else {
      resolveShowdown();
    }
    return;
  }

  if (state.currentPlayer === "chance") {
    // Both acted, street is complete!
    pendingStreetAdvance.value = true;
    const nextStreet = tableBoard.value.length === 3 ? "Turn" : "River";
    handStatusMessage.value = `Street complete! Ready to deal ${nextStreet} card.`;
    return;
  }

  // Villain needs to respond!
  simulateVillainResponse();
};

const simulateVillainResponse = () => {
  const state = localSolver.currentNode;
  const actions = state.actions;

  if (state.currentPlayer === "terminal") {
    resolveShowdown();
    return;
  }

  if (state.currentPlayer === "chance") {
    pendingStreetAdvance.value = true;
    const nextStreet = tableBoard.value.length === 3 ? "Turn" : "River";
    handStatusMessage.value = `Street complete! Ready to deal ${nextStreet} card.`;
    return;
  }

  const villainIdx = state.currentPlayer === "oop" ? 0 : 1;
  const isFacingBet = actions.length === 3 && actions[0].name === "Fold";
  const vAct = sampleVillainActionIndex(villainIdx);
  const chosenAct = actions[vAct];

  if (isFacingBet) {
    // Villain faces Hero's Bet/Raise
    trainerHistory.value.push(vAct);
    localSolver.applyHistory(trainerHistory.value);
    syncPotAndStacks();

    if (vAct === 0) {
      isHandOver.value = true;
      handStatusMessage.value = "Villain folds to your bet! Hero wins pot.";
    } else if (vAct === 1) {
      if (localSolver.currentNode.currentPlayer === "terminal") {
        resolveShowdown();
      } else {
        pendingStreetAdvance.value = true;
        const nextStreet = tableBoard.value.length === 3 ? "Turn" : "River";
        handStatusMessage.value = `Villain calls! Street complete, ready to deal ${nextStreet} card.`;
      }
    } else {
      // Villain raised!
      pendingFacingVillainAction.value = true;
      const rAmt = chosenAct?.amount || localSolver.currentNode.actions[1]?.amount || 5.0;
      villainActionMessage.value = `⚠️ Villain raises (${rAmt.toFixed(1)} bb)! Hero to act facing raise.`;
      handStatusMessage.value = "Villain raises! Click button to defend.";
    }
  } else {
    // Villain faces Hero's Check
    trainerHistory.value.push(vAct);
    localSolver.applyHistory(trainerHistory.value);
    syncPotAndStacks();

    if (vAct === 0) {
      if (localSolver.currentNode.currentPlayer === "terminal") {
        resolveShowdown();
      } else {
        pendingStreetAdvance.value = true;
        const nextStreet = tableBoard.value.length === 3 ? "Turn" : "River";
        handStatusMessage.value = `Villain checks behind. Street complete, ready to deal ${nextStreet} card.`;
      }
    } else {
      pendingFacingVillainAction.value = true;
      const bAmt = chosenAct?.amount || localSolver.currentNode.actions[1]?.amount || 1.7;
      villainActionMessage.value = `⚠️ Villain bets ${bAmt.toFixed(1)} bb. Hero to act facing bet.`;
      handStatusMessage.value = "Villain bets! Click button to defend.";
    }
  }
};

const advanceStreetOrHand = () => {
  if (isHandOver.value) {
    startNewHand();
    return;
  }

  const heroIdx = currentHeroRole.value === "BB" ? 0 : 1;

  if (pendingFacingVillainAction.value) {
    pendingFacingVillainAction.value = false;
    lastDecision.value = null;
    loadCurrentActions(heroIdx);
    return;
  }

  if (tableBoard.value.length >= 5) {
    resolveShowdown();
    return;
  }

  // Advance Street: Deal Turn or River card
  lastDecision.value = null;
  pendingStreetAdvance.value = false;

  const usedCards = new Set([
    ...tableBoard.value,
    ...heroHoleCards.value,
    ...villainHoleCards.value,
  ]);
  let nextCard = Math.floor(Math.random() * 52);
  while (usedCards.has(nextCard)) {
    nextCard = Math.floor(Math.random() * 52);
  }

  trainerHistory.value.push(nextCard);
  localSolver.applyHistory(trainerHistory.value);
  tableBoard.value = [...localSolver.board];
  currentStreet.value = tableBoard.value.length === 4 ? "turn" : "river";
  syncPotAndStacks();

  // On new street, OOP (BB) acts first!
  if (currentHeroRole.value === "BB") {
    // Hero is OOP: Hero acts first
    villainActionMessage.value = `Hero (BB) is Out of Position and first to act on ${currentStreet.value}.`;
    loadCurrentActions(0);
  } else {
    // Hero is IP: Villain (OOP) acts first!
    const vAct = sampleVillainActionIndex(0);
    const chosenAct = localSolver.currentNode.actions[vAct];
    trainerHistory.value.push(vAct);
    localSolver.applyHistory(trainerHistory.value);
    syncPotAndStacks();

    if (vAct === 0) {
      villainActionMessage.value = `✓ Villain (BB) checks on ${currentStreet.value}. Hero is In Position to act.`;
    } else {
      const bAmt = chosenAct?.amount || localSolver.currentNode.actions[1]?.amount || 2.5;
      villainActionMessage.value = `⚠️ Villain (BB) bets ${bAmt.toFixed(1)} bb on ${currentStreet.value}. Hero to act.`;
    }
    loadCurrentActions(1);
  }
};

const decisionBannerClass = (grade: DecisionResult["grade"]) => {
  switch (grade) {
    case "Best Move":
      return "bg-emerald-900/50 border-emerald-500 text-emerald-200";
    case "Correct":
      return "bg-green-900/40 border-green-500 text-green-200";
    case "Inaccuracy":
      return "bg-yellow-900/40 border-yellow-500 text-yellow-200";
    case "Mistake":
      return "bg-amber-900/40 border-amber-500 text-amber-200";
    case "Blunder":
      return "bg-rose-900/50 border-rose-500 text-rose-200";
  }
};

const decisionEmoji = (grade: DecisionResult["grade"]) => {
  switch (grade) {
    case "Best Move":
      return "🌟";
    case "Correct":
      return "✓";
    case "Inaccuracy":
      return "⚠️";
    case "Mistake":
      return "❌";
    case "Blunder":
      return "💀";
  }
};

const loadSavedSpotForTrainer = async () => {
  const spot = getLastSolvedSpot();
  if (!spot) return;
  configStore.board = [...spot.board];
  configStore.startingPot = spot.startingPot;
  configStore.effectiveStack = spot.effectiveStack;

  const preset = BUILTIN_SIX_MAX_SPOTS[0];
  if (!store.ranges[0] || !store.ranges[0].some((w) => w > 0)) {
    store.ranges[0] = [...parsePioRangePercent(preset.oopRange)];
  }
  if (!store.ranges[1] || !store.ranges[1].some((w) => w > 0)) {
    store.ranges[1] = [...parsePioRangePercent(preset.ipRange)];
  }

  localSolver.init(
    spot.board,
    spot.startingPot,
    spot.effectiveStack,
    store.ranges[0],
    store.ranges[1]
  );

  if (spot.results) {
    localSolver.equity = [
      spot.results.equity[0] || [],
      spot.results.equity[1] || [],
    ];
    localSolver.ev = [spot.results.ev[0] || [], spot.results.ev[1] || []];
    localSolver.eqr = [spot.results.eqr[0] || [], spot.results.eqr[1] || []];
    localSolver.strategy = spot.results.strategy;
    if (spot.results.actionEv) {
      localSolver.actionEv = spot.results.actionEv;
    }
  }

  store.isSolverFinished = true;
  startNewHand();
};

const ensureTrainerReady = async () => {
  if (!store.isSolverFinished) {
    const last = getLastSolvedSpot();
    if (last && last.results && last.board) {
      await loadSavedSpotForTrainer();
      return;
    }
    await quickSolveStandardSpot();
    return;
  }
  if (heroHoleCards.value.length === 0 || tableBoard.value.length === 0) {
    startNewHand();
  }
};

watch(
  () => store.navView,
  async (newNav) => {
    if (newNav === "trainer") {
      await ensureTrainerReady();
    }
  }
);

watch(
  () => store.isSolverFinished,
  (finished) => {
    if (finished && store.navView === "trainer") {
      startNewHand();
    }
  }
);

onMounted(() => {
  if (store.navView === "trainer") {
    ensureTrainerReady();
  }
});
</script>
