import { Results, ChanceReports } from "../result-types";

export interface SavedSpotData {
  id: string;
  title: string;
  timestamp: number;
  board: number[];
  startingPot: number;
  effectiveStack: number;
  oopRangeStr?: string;
  ipRangeStr?: string;
  results: {
    currentPlayer: "oop" | "ip" | "chance" | "terminal";
    numActions: number;
    equity: number[][];
    ev: number[][];
    eqr: number[][];
    strategy: number[];
    actionEv?: number[];
  };
  chanceReports?: {
    status: number[];
    combos: number[][];
    equity: number[][];
    ev: number[][];
    eqr: number[][];
    strategy: number[];
  };
}

const STORAGE_KEY_SAVED_SPOTS = "desktop_postflop_saved_spots_library_v1";
const STORAGE_KEY_LAST_SOLVED = "desktop_postflop_last_solved_spot_v1";
const STORAGE_KEY_MATRIX_MODE = "desktop_postflop_matrix_view_mode";

// 1. Matrix View Mode Persistence ("default" | "eq" | "ev")
export function getSavedMatrixMode(): "default" | "eq" | "ev" {
  try {
    const val = localStorage.getItem(STORAGE_KEY_MATRIX_MODE);
    if (val === "default" || val === "eq" || val === "ev") return val;
  } catch {}
  return "default";
}

export function saveMatrixMode(mode: "default" | "eq" | "ev"): void {
  try {
    localStorage.setItem(STORAGE_KEY_MATRIX_MODE, mode);
  } catch {}
}

// 2. Saved Spots Library
export function getSavedSpots(): SavedSpotData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_SPOTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading saved spots library:", e);
    return [];
  }
}

export function saveSpotToLibrary(spot: SavedSpotData): void {
  try {
    const current = getSavedSpots().filter((s) => s.id !== spot.id);
    current.unshift(spot); // most recent first
    localStorage.setItem(STORAGE_KEY_SAVED_SPOTS, JSON.stringify(current));
  } catch (e) {
    console.error("Error saving spot to library:", e);
  }
}

export function deleteSavedSpot(id: string): void {
  try {
    const current = getSavedSpots().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SAVED_SPOTS, JSON.stringify(current));
  } catch (e) {
    console.error("Error deleting saved spot:", e);
  }
}

// 3. Auto-cache of last solved spot
export function saveLastSolvedSpot(spot: SavedSpotData): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SOLVED, JSON.stringify(spot));
  } catch (e) {
    console.error("Error caching last solved spot:", e);
  }
}

export function getLastSolvedSpot(): SavedSpotData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SOLVED);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
