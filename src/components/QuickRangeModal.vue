<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm select-none">
    <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[90vh] text-white">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
            ⚡
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Libreria Range Preflop 6-Max Cash 100bb</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-normal">
                GTO Standard
              </span>
            </h2>
            <p class="text-xs text-slate-400">
              Seleziona un range preflop ottimale per inserirlo all'istante nel
              <strong class="text-amber-300">Giocatore {{ player === 0 ? '0 (OOP)' : '1 (IP)' }}</strong>.
            </p>
          </div>
        </div>
        <button
          class="text-slate-400 hover:text-white text-2xl font-bold transition"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="my-3 space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <!-- Search bar -->
        <div class="flex items-center gap-2">
          <div class="relative flex-grow">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cerca per posizione o azione (es. 'BTN open', 'BB vs', '3-bet', 'UTG')..."
              class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <span class="absolute left-2.5 top-1.5 text-slate-500">🔍</span>
          </div>

          <button
            v-if="searchQuery"
            class="px-2 py-1 text-slate-400 hover:text-white"
            @click="searchQuery = ''"
          >
            Cancella
          </button>
        </div>

        <!-- Category Tabs -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
          <span class="text-slate-500 font-semibold text-[11px] mr-1">Categoria:</span>
          <button
            v-for="cat in categories"
            :key="cat.key"
            :class="[
              'px-2.5 py-1 rounded-md text-xs font-semibold transition',
              selectedCategory === cat.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
            @click="selectedCategory = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Position Filter -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-slate-500 font-semibold text-[11px] mr-1">Posizione:</span>
          <button
            v-for="pos in positions"
            :key="pos"
            :class="[
              'px-2 py-0.5 rounded text-[11px] font-bold transition',
              selectedPosition === pos
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            ]"
            @click="selectedPosition = pos"
          >
            {{ pos }}
          </button>
        </div>
      </div>

      <!-- Range List -->
      <div class="flex-grow overflow-y-auto space-y-2 pr-1 my-2">
        <div
          v-if="filteredRanges.length === 0"
          class="flex flex-col items-center justify-center p-12 text-slate-500 text-center"
        >
          <span class="text-3xl mb-2">🔍</span>
          <span class="font-bold text-sm text-slate-400">Nessun range trovato</span>
          <span class="text-xs mt-1">Prova a cambiare termine di ricerca o filtro.</span>
        </div>

        <div
          v-for="item in filteredRanges"
          :key="item.id"
          class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow"
        >
          <!-- Left: Position Badge, Name, Frequency & Details -->
          <div class="flex items-start gap-3 flex-grow min-w-0">
            <!-- Position Badge -->
            <div
              :class="[
                'w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 border shadow-inner',
                positionColorClass(item.position)
              ]"
            >
              <span>{{ item.position }}</span>
              <span class="text-[9px] font-normal opacity-80">{{ item.action }}</span>
            </div>

            <div class="min-w-0 flex-grow">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-bold text-sm text-slate-100">
                  {{ item.name }}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {{ item.frequency.toFixed(1) }}% (~{{ item.combosApprox }} combos)
                </span>
                <span
                  v-if="item.vsPosition"
                  class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                >
                  vs {{ item.vsPosition }}
                </span>
              </div>

              <p class="text-xs text-slate-400 mt-1 line-clamp-1">
                {{ item.description || item.rangeStr }}
              </p>

              <!-- Truncated Pio string snippet -->
              <div class="text-[11px] font-mono text-slate-500 mt-1 truncate bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/60">
                {{ item.rangeStr }}
              </div>
            </div>
          </div>

          <!-- Right: Action Buttons -->
          <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1"
              title="Copia stringa Pio negli appunti"
              @click="copyPioString(item.rangeStr)"
            >
              <span>📋</span>
              <span class="hidden sm:inline">Copia</span>
            </button>

            <button
              class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
              @click="selectRange(item)"
            >
              <span>⚡</span>
              <span>Inserisci Subito</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Mostrati <strong>{{ filteredRanges.length }}</strong> range su {{ allRanges.length }} disponibili
        </div>
        <button
          class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
          @click="$emit('close')"
        >
          Chiudi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ALL_SIX_MAX_RANGES, SixMaxRangeItem } from "../data/six_max_ranges";

const props = defineProps<{
  player: number;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "apply-range", rangeStr: string, name: string): void;
}>();

const allRanges = ALL_SIX_MAX_RANGES;
const searchQuery = ref("");
const selectedCategory = ref<string>("ALL");
const selectedPosition = ref<string>("ALL");

const categories = [
  { key: "ALL", label: "Tutti" },
  { key: "RFI", label: "🟢 Open (RFI)" },
  { key: "BB_DEFENSE", label: "🔵 BB vs Open" },
  { key: "SB_DEFENSE", label: "🟣 SB vs Open" },
  { key: "IP_DEFENSE", label: "🟠 IP vs Open" },
  { key: "VS_3BET", label: "🔴 Call vs 3-Bet" },
  { key: "FOUR_BET", label: "⚡ 4-Bet" },
  { key: "VS_4BET", label: "🛡️ Call vs 4-Bet" },
  { key: "SQUEEZE", label: "💥 Squeeze" },
];

const positions = ["ALL", "UTG", "HJ", "CO", "BTN", "SB", "BB"];

const positionColorClass = (pos: string) => {
  switch (pos) {
    case "UTG":
      return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    case "HJ":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "CO":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "BTN":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "SB":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "BB":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
};

const filteredRanges = computed(() => {
  return allRanges.filter((r) => {
    // Category filter
    if (selectedCategory.value !== "ALL" && r.category !== selectedCategory.value) {
      return false;
    }

    // Position filter
    if (selectedPosition.value !== "ALL" && r.position !== selectedPosition.value) {
      return false;
    }

    // Search query filter
    if (searchQuery.value.trim() !== "") {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = r.name.toLowerCase().includes(q);
      const matchPos = r.position.toLowerCase().includes(q);
      const matchAction = r.action.toLowerCase().includes(q);
      const matchVs = r.vsPosition?.toLowerCase().includes(q) ?? false;
      const matchDesc = r.description?.toLowerCase().includes(q) ?? false;
      const matchStr = r.rangeStr.toLowerCase().includes(q);
      if (!matchName && !matchPos && !matchAction && !matchVs && !matchDesc && !matchStr) {
        return false;
      }
    }

    return true;
  });
});

const selectRange = (item: SixMaxRangeItem) => {
  emit("apply-range", item.rangeStr, item.name);
  emit("close");
};

const copyPioString = (str: string) => {
  navigator.clipboard.writeText(str);
};
</script>
