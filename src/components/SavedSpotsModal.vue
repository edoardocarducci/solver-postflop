<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm select-none">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] text-white">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="text-xl">📁</span>
          <div>
            <h2 class="text-base font-bold text-slate-100">Saved Spots & Heatmaps Library</h2>
            <p class="text-xs text-slate-400">
              Permanently stored solutions and heatmaps. Open instantly without re-solving.
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

      <!-- Action Toolbar -->
      <div class="my-3 flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-slate-400 font-semibold font-mono">
            {{ savedSpots.length }} spot{{ savedSpots.length === 1 ? '' : 's' }} memorized
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold transition shadow text-xs flex items-center gap-1"
            @click="exportAll"
          >
            <span>💾</span>
            <span>Export Library (.json)</span>
          </button>
          <label class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold transition border border-slate-700 text-xs cursor-pointer flex items-center gap-1">
            <span>📥</span>
            <span>Import (.json)</span>
            <input type="file" accept=".json" class="hidden" @change="onImportFile" />
          </label>
        </div>
      </div>

      <!-- Saved Spots List -->
      <div class="flex-grow overflow-y-auto space-y-2 pr-1 my-2">
        <div
          v-if="savedSpots.length === 0"
          class="flex flex-col items-center justify-center p-12 text-slate-500 text-center"
        >
          <span class="text-4xl mb-2">📂</span>
          <span class="font-bold text-sm text-slate-400">Nessuna heatmap memorizzata</span>
          <span class="text-xs mt-1">
            Clicca "Salva Spot & Heatmap" durante l'analisi per conservare le soluzioni e le mappe di calore.
          </span>
        </div>

        <div
          v-for="spot in savedSpots"
          :key="spot.id"
          class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-wrap items-center justify-between gap-3 shadow-sm"
        >
          <!-- Left: Title, Board, Metadata -->
          <div class="flex items-center gap-3">
            <!-- Board mini cards -->
            <div class="flex items-center gap-1">
              <div
                v-for="(c, cIdx) in spot.board"
                :key="cIdx"
                class="w-7 h-9 bg-white rounded border border-slate-300 flex flex-col items-center justify-between p-0.5 shadow"
              >
                <span class="font-bold text-[10px]" :class="cardText(c).colorClass">{{ cardText(c).rank }}</span>
                <span class="text-[10px]" :class="cardText(c).colorClass">{{ cardText(c).suit }}</span>
              </div>
            </div>

            <div>
              <div class="font-bold text-sm text-slate-200">
                {{ spot.title }}
              </div>
              <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Pot: <strong class="text-slate-300">{{ spot.startingPot }}bb</strong></span>
                <span>•</span>
                <span>Stack: <strong class="text-slate-300">{{ spot.effectiveStack }}bb</strong></span>
                <span>•</span>
                <span class="text-slate-500 font-mono">{{ formatDate(spot.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Badges & Action Buttons -->
          <div class="flex items-center gap-2">
            <span
              v-if="spot.chanceReports"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30"
              title="Runout Heatmap included"
            >
              🗺️ Runout Heatmap
            </span>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              title="Matrix Heatmap included"
            >
              🟢 Matrix Heatmap
            </span>

            <button
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center gap-1"
              @click="loadSpot(spot)"
            >
              <span>📂</span>
              <span>Load</span>
            </button>

            <button
              class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs transition border border-slate-700 hover:border-rose-700"
              title="Delete from Library"
              @click="deleteSpot(spot.id)"
            >
              🗑️
            </button>
          </div>
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
import { ref, onMounted } from "vue";
import {
  SavedSpotData,
  getSavedSpots,
  saveSpotToLibrary,
  deleteSavedSpot,
} from "../utils/heatmapStorage";
import { cardText } from "../utils";

const emit = defineEmits<{
  (event: "close"): void;
  (event: "load-spot", spot: SavedSpotData): void;
}>();

const savedSpots = ref<SavedSpotData[]>([]);

const refresh = () => {
  savedSpots.value = getSavedSpots();
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const loadSpot = (spot: SavedSpotData) => {
  emit("load-spot", spot);
  emit("close");
};

const deleteSpot = (id: string) => {
  deleteSavedSpot(id);
  refresh();
};

const exportAll = () => {
  const json = JSON.stringify(savedSpots.value, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `desktop-postflop-saved-spots-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const onImportFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target?.result as string);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.id && item.board && item.results) {
            saveSpotToLibrary(item);
          }
        }
      } else if (data.id && data.board && data.results) {
        saveSpotToLibrary(data);
      }
      refresh();
    } catch (err) {
      console.error("Failed to parse JSON spot file:", err);
    }
  };
  reader.readAsText(file);
};

onMounted(() => {
  refresh();
});
</script>
