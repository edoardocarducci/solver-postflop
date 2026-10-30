# Solver Postflop

<p align="center">
  <strong>Modern, 100% Offline Desktop GTO Texas Hold'em Solver & Interactive Training Suite</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-1.5-blue?logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/Rust-Nightly%20%2F%20AVX2-red?logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/Vue-3.3-green?logo=vuedotjs&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-AGPL%203.0-orange" alt="License">
</p>

---

## Overview

**Solver Postflop** is a high-performance, open-source Game Theory Optimal (GTO) Texas Hold'em poker solver and interactive study platform designed for serious players and researchers.

Running completely locally as a native desktop application powered by **Rust** and **Tauri** with a reactive **Vue 3 + Tailwind CSS** frontend, Solver Postflop provides zero-latency analysis, complete offline privacy, and unlimited solving without recurring cloud subscription fees.

---

## Key Features & Implementations

### 1. Interactive GTO Trainer Mode (`TrainerView.vue`)
- **Real-Time Play Against Solver**: Practice postflop decisions in simulated Heads-Up scenarios against pre-computed or on-demand solved GTO trees.
- **RNG Roll Simulation**: Integrated 1–100 random number generator badge to assist in playing exact mixed-frequency strategies.
- **Instant Decision Feedback & EV Loss**:
  - Automatically calculates $\Delta\text{EV} = \max_a \text{EV}(a) - \text{EV}(a_{\text{chosen}})$.
  - Classifies decisions using industry-standard thresholds:
    - **Best Move**: Maximum EV action / zero EV loss.
    - **Correct**: Mixed viable strategy ($\Delta\text{EV} < 0.5\%$ pot, frequency $\ge 5\%$).
    - **Inaccuracy**: Minor EV deviation ($0.5\% \le \Delta\text{EV} < 1.5\%$ pot).
    - **Mistake**: Notable error ($1.5\% \le \Delta\text{EV} < 3.0\%$ pot).
    - **Blunder**: Critical error ($\Delta\text{EV} \ge 3.0\%$ pot or $0\%$ frequency).
- **Post-Action Review & Matrix Overlay**: Inspect the full 13×13 strategy matrix immediately after each street action.
- **Session Tracking**: Real-time tracking of hands played, GTO score percentage, average EV loss in bb/100, and an interactive list of blunders to review.

### 2. Preloaded Spot Selector & Range Library (`HUSpotSelector.vue`)
- **1-Click Spot Setup**: Instant setup for Heads-Up (SB/BTN vs BB) and 6-Max spot presets without manual range input.
- **Multi-Depth & Pot Type Coverage**:
  - Pot Types: Single Raised Pot (**SRP**), **3-Bet**, **4-Bet**, and Limped / Check pots.
  - Stack Depths: 20bb, 25bb, 40bb, 50bb, 75bb, and 100bb.
- **Automatic Configuration**: Instantly seeds starting pot, effective stacks, OOP/IP ranges, and standard postflop sizing trees.

### 3. Node Locking & Exploitative Solving (`NodeLockModal.vue`)
- **Custom Opponent Tendencies**: Lock specific villain actions or entire strategy distributions at any node in the game tree.
- **CFR Recalculation**: Re-run Discounted CFR iterations to compute the mathematically optimal exploitative counter-strategy and quantify the EV gain.

### 4. Runout Heatmaps (`RunoutHeatmap.vue`)
- **Complete Turn & River Runout Visualization**: Visual 49-card matrix showing strategic shifts across every possible upcoming board card.
- **Equity & EV Transitions**: Quickly identify which turn or river cards heavily favor Hero or Villain, check-raise runouts, and favorable barrel textures.

### 5. Hand Category Breakdown (`CategoryBreakdown.vue` & `handCategorizer.ts`)
- **Granular Range Decomposition**: Automatically classifies player holdings into structured hand classes (Straight Flush, Quads, Full House, Sets, Overpairs, Top Pairs, Middle/Low Pairs, Flush Draws, OESD, Gutshots, Air).
- **Action Frequency Distribution**: See at a glance what percentage of each hand category checks, calls, bets small, or bets large.

### 6. Range vs Range Comparison (`RangeVsRangeModal.vue` & `ActionInfobar.vue`)
- **Side-by-Side Matrix Viewer**: Compare OOP vs IP ranges, equity distribution bars, and expected value side by side.
- **Combo Count & Sizing Details**: Quick inspection of surviving combos and bet sizing allocations.

### 7. Local Spot Persistence & Convergence Logging (`SavedSpotsModal.vue` & `SolverLogConsole.vue`)
- **Local Storage Integration**: Save solved trees, spot notes, and runouts to local IndexedDB (via Dexie) for offline recall.
- **Live Convergence Metrics**: Real-time console displaying Discounted CFR iterations, exploitability gap (Nash distance in % of pot), elapsed time, and memory utilization.

---

## Architecture & Technology Stack

| Component | Technology | Description |
|---|---|---|
| **GUI Framework** | [Tauri](https://tauri.app/) (v1.5) | Ultra-lightweight native webview bridge with minimal memory footprint |
| **Frontend UI** | [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) | Reactive Composition API, Pinia state management |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Modern responsive UI with dark/light theme support |
| **Charts & Visuals** | [Chart.js](https://www.chartjs.org/) & `vue-chartjs` | Strategy and equity graphs |
| **Local Database** | [Dexie.js](https://dexie.org/) | Fast client-side persistence for spots and trees |
| **Solver Backend** | [Rust](https://www.rust-lang.org/) (Nightly) | Multi-threaded CFR solver leveraging AVX2 SIMD instructions |

---

## Supported Environments

- **Operating System**:
  - Windows: 10 / 11 (64-bit)
  - Linux: glibc 2.31 and later (Ubuntu 20.04+, Debian, Arch, Fedora)
  - macOS: macOS 11.7 (Big Sur) and later (x86_64 and Apple Silicon)
- **CPU Requirements**:
  - x86_64 architecture with **AVX2** support (Intel Haswell 2013+ / AMD Zen 2017+).
  - Apple Silicon (M1 / M2 / M3 / M4) via native ARM compilation.

---

## Getting Started

### Prerequisites
1. **Node.js** (v18 or newer) and `npm`
2. **Rust** (Nightly channel recommended for maximum solver speed):
   ```sh
   rustup install nightly
   rustup default nightly
   ```
3. Platform-specific build prerequisites:
   - **Windows**: [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11).
   - **Linux**: Standard Tauri dependencies (`libgtk-3-dev`, `libwebkit2gtk-4.0-dev`, `librsvg2-dev`).

### Installation & Development

1. Clone the repository:
   ```sh
   git clone https://github.com/edoardocarducci/solver-postflop.git
   cd solver-postflop
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Run the development server with live reload:
   ```sh
   npm run tauri dev
   ```

### Building for Production

To build a standalone executable:

```sh
npm run build
npm run tauri build
```

The compiled binaries will be output to:
- **Windows**: `src-tauri/target/release/bundle/msi/` or standalone `.exe` in `src-tauri/target/release/`
- **Linux**: `src-tauri/target/release/bundle/deb/` and `.AppImage`
- **macOS**: `src-tauri/target/release/bundle/dmg/`

---

## License & Credits

- **License**: Released under the [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).
- **Core Engine & Base UI**: Originally inspired by and porting the core algorithm from `postflop-solver` and `desktop-postflop` (Copyright (C) 2022 Wataru Inariba).
- **Solver Postflop Suite Extensions**: Extended with GTO Trainer mode, Heads-Up range suite, node locking, runout heatmaps, and advanced study analytics by **Edoardo Carducci**.
