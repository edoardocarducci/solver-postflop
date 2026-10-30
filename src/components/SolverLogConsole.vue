<template>
  <div class="mt-6 border border-slate-700/80 rounded-xl bg-slate-950 overflow-hidden shadow-2xl text-white">
    <!-- Console Header / Toolbar -->
    <div class="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 select-none">
      <div class="flex items-center gap-2.5">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
          <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
          <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
        </div>
        <span class="text-xs font-bold font-mono tracking-wide text-slate-200">
          📜 Solver Diagnostics & Execution Logs
        </span>
        <span class="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
          {{ logs.length }} logs
        </span>
        <span v-if="errorCount > 0" class="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
          {{ errorCount }} error{{ errorCount === 1 ? '' : 's' }}
        </span>
        <span v-if="warnCount > 0" class="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
          {{ warnCount }} warning{{ warnCount === 1 ? '' : 's' }}
        </span>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 text-xs">
        <button
          class="px-2.5 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1 shadow"
          title="Esegui controllo di integrità prima di risolvere"
          @click="$emit('run-diagnostics')"
        >
          <span>🔍</span>
          <span>Auto-Diagnostica Spot</span>
        </button>

        <button
          class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition flex items-center gap-1"
          title="Copia l'intero report per inviarlo nella chat dell'assistente"
          @click="copyLogs"
        >
          <span>📋</span>
          <span>{{ copySuccess ? "Copiato!" : "Copia Log per Assistente" }}</span>
        </button>

        <button
          class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          title="Pulisci log"
          @click="clearSolverLogs"
        >
          🧹
        </button>

        <button
          class="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition font-bold"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? "▲ Riduci" : "▼ Espandi" }}
        </button>
      </div>
    </div>

    <!-- Terminal Output Body -->
    <div
      v-if="isExpanded"
      ref="logContainer"
      class="p-3 bg-black/95 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto space-y-1 select-text"
    >
      <div v-if="logs.length === 0" class="text-slate-500 py-4 text-center italic">
        Nessun log registrato. Clicca "Build New Tree" o "Run Solver" per visualizzare l'esecuzione in tempo reale.
      </div>

      <div
        v-for="entry in logs"
        :key="entry.id"
        :class="[
          'py-0.5 px-1.5 rounded transition flex flex-col sm:flex-row sm:items-baseline gap-1.5',
          logRowBgClass(entry.level)
        ]"
      >
        <!-- Timestamp & Badges -->
        <div class="flex items-center gap-1.5 shrink-0 select-none">
          <span class="text-slate-500 text-[10px]">{{ entry.timestamp }}</span>
          <span
            :class="[
              'px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase',
              stepBadgeClass(entry.step)
            ]"
          >
            {{ entry.step }}
          </span>
          <span
            :class="[
              'px-1.5 py-0.2 rounded text-[10px] font-bold uppercase',
              levelBadgeClass(entry.level)
            ]"
          >
            {{ entry.level }}
          </span>
        </div>

        <!-- Message -->
        <div class="flex-grow text-slate-200 break-words font-medium">
          {{ entry.message }}
          <div
            v-if="entry.details"
            class="mt-1 p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 whitespace-pre-wrap font-mono"
          >
            {{ typeof entry.details === 'object' ? JSON.stringify(entry.details, null, 2) : entry.details }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import {
  solverLogs,
  clearSolverLogs,
  getFormattedLogReport,
  LogLevel,
  LogStep,
} from "../utils/solverLogger";

defineEmits<{
  (event: "run-diagnostics"): void;
}>();

const logs = solverLogs;
const isExpanded = ref(true);
const copySuccess = ref(false);
const logContainer = ref<HTMLDivElement | null>(null);

const errorCount = computed(() => logs.filter((l) => l.level === "ERROR").length);
const warnCount = computed(() => logs.filter((l) => l.level === "WARN").length);

const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

watch(
  () => logs.length,
  () => {
    if (isExpanded.value) {
      scrollToBottom();
    }
  }
);

const copyLogs = async () => {
  const report = getFormattedLogReport();
  await navigator.clipboard.writeText(report);
  copySuccess.value = true;
  setTimeout(() => {
    copySuccess.value = false;
  }, 2500);
};

const levelBadgeClass = (lvl: LogLevel) => {
  switch (lvl) {
    case "SUCCESS":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    case "INFO":
      return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    case "WARN":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/40";
    case "ERROR":
      return "bg-rose-500/30 text-rose-200 border border-rose-500/60 font-bold";
  }
};

const stepBadgeClass = (step: LogStep) => {
  switch (step) {
    case "CONFIG":
      return "bg-cyan-950 text-cyan-300 border-cyan-800";
    case "TREE":
      return "bg-purple-950 text-purple-300 border-purple-800";
    case "MEMORY":
      return "bg-indigo-950 text-indigo-300 border-indigo-800";
    case "SOLVER":
      return "bg-emerald-950 text-emerald-300 border-emerald-800";
    case "ANALYSIS":
      return "bg-amber-950 text-amber-300 border-amber-800";
    default:
      return "bg-slate-900 text-slate-400 border-slate-700";
  }
};

const logRowBgClass = (lvl: LogLevel) => {
  switch (lvl) {
    case "ERROR":
      return "bg-rose-950/40 border-l-2 border-rose-500";
    case "WARN":
      return "bg-amber-950/20 border-l-2 border-amber-500";
    case "SUCCESS":
      return "bg-emerald-950/20 border-l-2 border-emerald-500";
    default:
      return "hover:bg-slate-900/60";
  }
};
</script>
