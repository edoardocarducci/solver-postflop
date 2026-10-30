<template>
  <div class="w-full bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 text-xs select-none">
    <!-- Breadcrumb Cards -->
    <div class="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[70%]">
      <div
        v-for="(item, idx) in breadcrumbItems"
        :key="idx"
        class="flex items-center gap-1.5 shrink-0"
      >
        <button
          :class="[
            'px-2.5 py-1 rounded-md font-semibold transition border flex items-center gap-1',
            item.isCurrent
              ? 'bg-blue-600 text-white border-blue-400 shadow'
              : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
          ]"
          @click="item.spotIndex !== undefined && $emit('select-spot', item.spotIndex)"
        >
          <span v-if="item.badge" class="text-[10px] px-1 py-0.2 rounded bg-black/40 text-amber-300 uppercase font-bold">
            {{ item.badge }}
          </span>
          <span>{{ item.title }}</span>
          <span v-if="item.cards" class="font-mono text-emerald-400 font-bold ml-1">
            {{ item.cards }}
          </span>
        </button>

        <span v-if="idx < breadcrumbItems.length - 1" class="text-slate-600 font-bold">
          &rarr;
        </span>
      </div>
    </div>

    <!-- Quick Tool Buttons: Range vs Range, Runout Heatmap, Node Lock -->
    <div class="flex items-center gap-2 shrink-0">
      <button
        class="px-2.5 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shadow transition"
        title="Open Range vs Range Equity & EV Distribution"
        @click="$emit('open-range-vs-range')"
      >
        <span class="text-xs">📊</span>
        <span>Range vs Range</span>
      </button>

      <button
        class="px-2.5 py-1 rounded-md bg-purple-600/80 hover:bg-purple-500 text-white font-semibold flex items-center gap-1 shadow transition"
        title="Open Turn / River Runout Heatmap"
        @click="$emit('open-runout-heatmap')"
      >
        <span class="text-xs">🗺️</span>
        <span>Runout Heatmap</span>
      </button>

      <button
        class="px-2.5 py-1 rounded-md bg-amber-600/80 hover:bg-amber-500 text-white font-semibold flex items-center gap-1 shadow transition"
        title="Node-Lock this spot and re-solve"
        @click="$emit('open-node-lock')"
      >
        <span class="text-xs">🔒</span>
        <span>Node Lock</span>
      </button>

      <div v-if="activeLocksCount > 0" class="flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/60">
        <span class="text-amber-300 font-bold text-[11px]">
          🔒 Locked ({{ activeLocksCount }})
        </span>
        <button
          class="ml-1 px-1.5 py-0.2 rounded bg-rose-900/80 hover:bg-rose-700 text-rose-200 font-bold text-[10px] transition"
          title="Reset all node locks"
          @click="resetAllLocks"
        >
          Reset
        </button>
      </div>

      <button
        class="px-2.5 py-1 rounded-md bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow transition"
        title="Save this spot and all its heatmaps to local library"
        @click="$emit('save-spot')"
      >
        <span class="text-xs">💾</span>
        <span>Save Spot</span>
      </button>

      <button
        class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1 shadow transition"
        title="Open Saved Spots and Heatmaps Library"
        @click="$emit('open-saved-library')"
      >
        <span class="text-xs">📁</span>
        <span>Library</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Spot } from "../result-types";
import { cardText } from "../utils";
import { getActiveLocksCount, resetNodeLocks } from "../invokes";

interface BreadcrumbItem {
  spotIndex?: number;
  badge?: string;
  title: string;
  cards?: string;
  isCurrent: boolean;
}

const props = defineProps<{
  spots: Spot[];
  selectedSpotIndex: number;
  currentBoard: number[];
}>();

const emit = defineEmits<{
  (event: "select-spot", index: number): void;
  (event: "open-range-vs-range"): void;
  (event: "open-runout-heatmap"): void;
  (event: "open-node-lock"): void;
  (event: "save-spot"): void;
  (event: "open-saved-library"): void;
  (event: "locks-reset"): void;
}>();

const activeLocksCount = computed(() => getActiveLocksCount());

const resetAllLocks = () => {
  resetNodeLocks();
  emit("locks-reset");
};

const formatBoardCards = (cards: number[]) => {
  return cards
    .map((c) => {
      const info = cardText(c);
      return `${info.rank}${info.suit}`;
    })
    .join(" ");
};

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [];

  // Preflop / Spot header
  items.push({
    title: "Preflop: Heads-Up",
    badge: "Spot",
    isCurrent: false,
  });

  for (let i = 0; i < props.spots.length; i++) {
    const spot = props.spots[i];
    const isCurrent = spot.index === props.selectedSpotIndex;

    if (spot.type === "root") {
      items.push({
        spotIndex: spot.index,
        title: "Flop",
        cards: formatBoardCards(spot.board),
        isCurrent,
      });
    } else if (spot.type === "chance") {
      const dealt = spot.cards.find((c) => c.isSelected);
      const cardStr = dealt ? formatBoardCards([dealt.card]) : "??";
      items.push({
        spotIndex: spot.index,
        title: spot.player === "turn" ? "Turn Card" : "River Card",
        cards: cardStr,
        isCurrent,
      });
    } else if (spot.type === "player") {
      const selectedAction = spot.actions.find((a) => a.isSelected);
      const actionName = selectedAction ? selectedAction.name : "Action";
      items.push({
        spotIndex: spot.index,
        badge: spot.player.toUpperCase(),
        title: actionName,
        isCurrent,
      });
    } else if (spot.type === "terminal") {
      items.push({
        spotIndex: spot.index,
        badge: "Showdown",
        title: "Terminal",
        isCurrent,
      });
    }
  }

  return items;
});
</script>
