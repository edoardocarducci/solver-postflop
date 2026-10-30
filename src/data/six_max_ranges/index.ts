import { SixMaxRangeItem, SixMaxSpotPreset } from "./types";

export * from "./types";

// ==========================================
// 1. RAISE FIRST IN (RFI) - 100bb 6-Max Cash
// ==========================================

export const SIX_MAX_RFI_RANGES: SixMaxRangeItem[] = [
  {
    id: "rfi_utg",
    category: "RFI",
    position: "UTG",
    name: "UTG Open 2.5x (16.2%)",
    action: "Open",
    frequency: 16.2,
    combosApprox: 215,
    rangeStr:
      "66+,55:0.6,44:0.3,A2s+,K9s+,Q9s+,J9s+,T9s,98s,87s,76s,65s,K8s:0.5,AJo+,ATo:0.5,KQo,KJo:0.4",
    description:
      "Standard GTO 6-Max UTG opening range (2.5bb). Linear, weighted toward high card equity and suited playability.",
  },
  {
    id: "rfi_hj",
    category: "RFI",
    position: "HJ",
    name: "HJ Open 2.5x (20.5%)",
    action: "Open",
    frequency: 20.5,
    combosApprox: 272,
    rangeStr:
      "55+,44:0.6,33:0.4,22:0.3,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,65s,54s,K7s:0.5,Q8s:0.6,J8s:0.5,ATo+,A9o:0.3,KTo+,QTo:0.6,JTo:0.5",
    description:
      "Hijack opening range (2.5bb). Adds more suited connectors, pocket pairs and suited kings.",
  },
  {
    id: "rfi_co",
    category: "RFI",
    position: "CO",
    name: "CO Open 2.5x (27.2%)",
    action: "Open",
    frequency: 27.2,
    combosApprox: 360,
    rangeStr:
      "22+,A2s+,K4s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s,43s:0.5,A8o+,A7o:0.5,A5o:0.4,K9o+,Q9o+,J9o+,T9o,98o:0.5",
    description:
      "Cutoff opening range (2.5bb). Steal territory with aggressive suited gappers and broadway offsuits.",
  },
  {
    id: "rfi_btn",
    category: "RFI",
    position: "BTN",
    name: "BTN Open 2.5x (43.5%)",
    action: "Open",
    frequency: 43.5,
    combosApprox: 575,
    rangeStr:
      "22+,A2s+,K2s+,Q2s+,J3s+,T6s+,95s+,85s+,74s+,63s+,53s+,43s,32s:0.5,A2o+,K6o+,Q7o+,J7o+,T7o+,97o+,87o,76o,65o,54o:0.5",
    description:
      "Button opening range (2.5bb). The widest and most profitable seat, opening ~43.5% of hands.",
  },
  {
    id: "rfi_sb",
    category: "RFI",
    position: "SB",
    name: "SB Open 3.0x vs BB (42.0%)",
    action: "Open",
    vsPosition: "BB",
    frequency: 42.0,
    combosApprox: 555,
    rangeStr:
      "22+,A2s+,K2s+,Q3s+,J5s+,T6s+,96s+,85s+,74s+,63s+,53s+,43s,A2o+,K7o+,Q8o+,J8o+,T8o+,97o+,86o+,76o,65o",
    description:
      "Small Blind Open (RFI vs BB). Raise sizing 3.0bb out of position.",
  },
];

// ==========================================
// 2. BB DEFENSE VS OPEN (100bb 6-Max Cash)
// ==========================================

export const SIX_MAX_BB_DEFENSE_RANGES: SixMaxRangeItem[] = [
  {
    id: "bb_vs_utg_call",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs UTG (Call - 16.5%)",
    action: "Call",
    vsPosition: "UTG",
    frequency: 16.5,
    combosApprox: 218,
    rangeStr:
      "JJ-22,AQs-A2s,KQs-K8s,QJs-Q8s,JTs-J8s,T9s-T8s,98s-97s,87s-86s,76s-75s,65s-64s,54s,AQo-ATo,KJo-KTo,QJo-QTo,JTo",
    description:
      "BB Flat Call vs UTG 2.5bb open. Tight and condensed, avoiding reverse implied odds.",
  },
  {
    id: "bb_vs_utg_3bet",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs UTG (3-Bet - 7.2%)",
    action: "3-Bet",
    vsPosition: "UTG",
    frequency: 7.2,
    combosApprox: 95,
    rangeStr:
      "QQ+,AKs,A5s-A4s,KQs:0.5,A2s:0.5,AKo,JJ:0.3,TT:0.2,AJs:0.3,76s:0.4,65s:0.4",
    description:
      "BB 3-Bet vs UTG 2.5bb open. Polarized premium value + wheel ace & suited connector bluffs.",
  },
  {
    id: "bb_vs_hj_call",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs HJ (Call - 20.5%)",
    action: "Call",
    vsPosition: "HJ",
    frequency: 20.5,
    combosApprox: 272,
    rangeStr:
      "TT-22,ATs-A2s,KJs-K6s,QJs-Q7s,JTs-J7s,T9s-T7s,98s-96s,87s-86s,76s-75s,65s-64s,54s-53s,AJo-A8o,KTo-K9o,QTo-Q9o,JTo-J9o,T9o",
    description: "BB Flat Call vs Hijack open.",
  },
  {
    id: "bb_vs_hj_3bet",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs HJ (3-Bet - 8.8%)",
    action: "3-Bet",
    vsPosition: "HJ",
    frequency: 8.8,
    combosApprox: 116,
    rangeStr:
      "JJ+,AJs+,A5s-A3s,KQs,KJs:0.5,QJs:0.5,AKo,AQo:0.6,TT:0.5,87s:0.4,76s:0.5,65s:0.5",
    description: "BB 3-Bet vs Hijack open.",
  },
  {
    id: "bb_vs_co_call",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs CO (Call - 26.5%)",
    action: "Call",
    vsPosition: "CO",
    frequency: 26.5,
    combosApprox: 350,
    rangeStr:
      "99-22,ATs-A2s,K9s-K2s,Q9s-Q4s,J9s-J6s,T9s-T6s,98s-96s,87s-85s,76s-74s,65s-63s,54s-53s,43s,ATo-A6o,KTo-K7o,QTo-Q8o,JTo-J8o,T9o-T8o,98o,87o",
    description: "BB Flat Call vs Cutoff open.",
  },
  {
    id: "bb_vs_co_3bet",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs CO (3-Bet - 11.5%)",
    action: "3-Bet",
    vsPosition: "CO",
    frequency: 11.5,
    combosApprox: 152,
    rangeStr:
      "TT+,AJs+,A5s-A2s,KTs+,QTs+,JTs,AKo,AQo,AJo:0.7,KQo,KJo:0.5,87s:0.6,76s:0.6,65s:0.6,54s:0.5",
    description:
      "BB 3-Bet vs Cutoff open. Expanding 3-bet frequency as CO opens wide.",
  },
  {
    id: "bb_vs_btn_call",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs BTN (Call - 37.5%)",
    action: "Call",
    vsPosition: "BTN",
    frequency: 37.5,
    combosApprox: 495,
    rangeStr:
      "88-22,A9s-A2s,K9s-K2s,Q9s-Q2s,J8s-J2s,T8s-T2s,97s-92s,86s-82s,75s-72s,64s-62s,53s-52s,43s,32s,ATo-A2o,KTo-K4o,QTo-Q6o,JTo-J7o,T9o-T7o,98o-97o,87o-86o,76o,65o",
    description:
      "BB Flat Call vs BTN open. Wide defense due to pot odds and BTN wide range.",
  },
  {
    id: "bb_vs_btn_3bet",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs BTN (3-Bet - 14.5%)",
    action: "3-Bet",
    vsPosition: "BTN",
    frequency: 14.5,
    combosApprox: 192,
    rangeStr:
      "99+,ATs+,A5s-A2s,KTs+,QTs+,JTs,T9s,98s,AKo,AQo,AJo,ATo:0.5,KQo,KJo:0.6,QJo:0.5,A9o-A7o:0.4,87s:0.7,76s:0.7,65s:0.7,54s:0.6",
    description: "BB 3-Bet vs BTN open. Aggressive 3-betting against button steal.",
  },
  {
    id: "bb_vs_sb_call",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs SB (Call IP - 40.0%)",
    action: "Call",
    vsPosition: "SB",
    frequency: 40.0,
    combosApprox: 530,
    rangeStr:
      "77-22,A9s-A2s,K9s-K2s,Q9s-Q2s,J8s-J2s,T8s-T2s,97s-92s,86s-82s,75s-72s,64s-62s,53s-52s,43s,32s,ATo-A2o,KTo-K3o,QTo-Q5o,JTo-J6o,T9o-T6o,98o-96o,87o-85o,76o-75o,65o,54o",
    description:
      "BB Flat Call vs SB 3x open. Playing in position with high equity realization.",
  },
  {
    id: "bb_vs_sb_3bet",
    category: "BB_DEFENSE",
    position: "BB",
    name: "BB vs SB (3-Bet IP - 16.0%)",
    action: "3-Bet",
    vsPosition: "SB",
    frequency: 16.0,
    combosApprox: 212,
    rangeStr:
      "88+,ATs+,A5s-A2s,KTs+,QTs+,JTs,T9s,98s,87s,AKo,AQo,AJo,ATo,KQo,KJo,QJo,A9o-A6o:0.5,K9o:0.5,Q9o:0.5,J9o:0.5,76s:0.7,65s:0.7,54s:0.7",
    description: "BB 3-Bet IP vs SB open (to 9.0bb).",
  },
];

// ==========================================
// 3. SB DEFENSE / 3-BET (100bb 6-Max Cash)
// ==========================================

export const SIX_MAX_SB_DEFENSE_RANGES: SixMaxRangeItem[] = [
  {
    id: "sb_vs_btn_3bet",
    category: "SB_DEFENSE",
    position: "SB",
    name: "SB vs BTN (3-Bet - 15.0%)",
    action: "3-Bet",
    vsPosition: "BTN",
    frequency: 15.0,
    combosApprox: 198,
    rangeStr:
      "77+,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,65s,54s,AJo+,KQo,ATo:0.6,KJo:0.6,QJo:0.5,66:0.5,55:0.5",
    description:
      "SB 3-Bet or Fold strategy vs BTN. Pure linear 3-betting to deny BB flat odds.",
  },
  {
    id: "sb_vs_co_3bet",
    category: "SB_DEFENSE",
    position: "SB",
    name: "SB vs CO (3-Bet - 11.0%)",
    action: "3-Bet",
    vsPosition: "CO",
    frequency: 11.0,
    combosApprox: 145,
    rangeStr:
      "88+,A8s+,A5s-A3s,KTs+,QTs+,JTs,T9s,98s,87s,76s,AQo+,AKo,AJo:0.7,KQo,KJo:0.4,77:0.5",
    description: "SB 3-Bet vs Cutoff open.",
  },
  {
    id: "sb_vs_hj_3bet",
    category: "SB_DEFENSE",
    position: "SB",
    name: "SB vs HJ (3-Bet - 8.5%)",
    action: "3-Bet",
    vsPosition: "HJ",
    frequency: 8.5,
    combosApprox: 112,
    rangeStr:
      "99+,ATs+,A5s-A4s,KTs+,QJs,JTs,T9s,87s:0.5,76s:0.5,AQo+,AKo,88:0.5",
    description: "SB 3-Bet vs Hijack open.",
  },
  {
    id: "sb_vs_utg_3bet",
    category: "SB_DEFENSE",
    position: "SB",
    name: "SB vs UTG (3-Bet - 6.8%)",
    action: "3-Bet",
    vsPosition: "UTG",
    frequency: 6.8,
    combosApprox: 90,
    rangeStr: "TT+,AJs+,A5s,KQs,AKo,AQo:0.7,99:0.4,A4s:0.5",
    description: "SB 3-Bet vs UTG open. Very tight against UTG range.",
  },
];

// ==========================================
// 4. IN POSITION (BTN / CO / HJ) DEFENSE VS OPEN
// ==========================================

export const SIX_MAX_IP_DEFENSE_RANGES: SixMaxRangeItem[] = [
  {
    id: "btn_vs_co_call",
    category: "IP_DEFENSE",
    position: "BTN",
    name: "BTN vs CO (Call - 7.5%)",
    action: "Call",
    vsPosition: "CO",
    frequency: 7.5,
    combosApprox: 99,
    rangeStr: "99-55,AQs-ATs,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s,AQo:0.3",
    description:
      "BTN Flat Call vs CO open. High playability suited hands and middle pocket pairs.",
  },
  {
    id: "btn_vs_co_3bet",
    category: "IP_DEFENSE",
    position: "BTN",
    name: "BTN vs CO (3-Bet - 8.8%)",
    action: "3-Bet",
    vsPosition: "CO",
    frequency: 8.8,
    combosApprox: 116,
    rangeStr:
      "TT+,AJs+,A5s-A4s,A2s:0.5,KTs+,QJs,AKo,AQo:0.7,87s:0.5,76s:0.5,65s:0.5",
    description: "BTN 3-Bet vs CO open.",
  },
  {
    id: "btn_vs_hj_call",
    category: "IP_DEFENSE",
    position: "BTN",
    name: "BTN vs HJ (Call - 6.0%)",
    action: "Call",
    vsPosition: "HJ",
    frequency: 6.0,
    combosApprox: 79,
    rangeStr: "TT-66,AJs-ATs,KJs,QJs,JTs,T9s,98s,87s,76s:0.5",
    description: "BTN Flat Call vs HJ open.",
  },
  {
    id: "btn_vs_hj_3bet",
    category: "IP_DEFENSE",
    position: "BTN",
    name: "BTN vs HJ (3-Bet - 7.2%)",
    action: "3-Bet",
    vsPosition: "HJ",
    frequency: 7.2,
    combosApprox: 95,
    rangeStr: "JJ+,AQs+,A5s-A4s,KQs,AKo,AQo:0.5,65s:0.5",
    description: "BTN 3-Bet vs HJ open.",
  },
  {
    id: "btn_vs_utg_call",
    category: "IP_DEFENSE",
    position: "BTN",
    name: "BTN vs UTG (Call - 4.5%)",
    action: "Call",
    vsPosition: "UTG",
    frequency: 4.5,
    combosApprox: 60,
    rangeStr: "JJ-77,AQs-AJs,KQs,QJs,JTs,T9s,98s",
    description: "BTN Flat Call vs UTG open.",
  },
  {
    id: "btn_vs_utg_3bet",
    category: "IP_DEFENSE",
    position: "BTN",
    name: "BTN vs UTG (3-Bet - 5.5%)",
    action: "3-Bet",
    vsPosition: "UTG",
    frequency: 5.5,
    combosApprox: 73,
    rangeStr: "QQ+,AKs,A5s,KQs:0.5,AKo,JJ:0.3",
    description: "BTN 3-Bet vs UTG open.",
  },
  {
    id: "co_vs_hj_call",
    category: "IP_DEFENSE",
    position: "CO",
    name: "CO vs HJ (Call - 5.5%)",
    action: "Call",
    vsPosition: "HJ",
    frequency: 5.5,
    combosApprox: 73,
    rangeStr: "TT-66,AJs-ATs,KJs,QJs,JTs,T9s,98s,87s",
    description: "Cutoff Flat Call vs Hijack open.",
  },
  {
    id: "co_vs_hj_3bet",
    category: "IP_DEFENSE",
    position: "CO",
    name: "CO vs HJ (3-Bet - 7.0%)",
    action: "3-Bet",
    vsPosition: "HJ",
    frequency: 7.0,
    combosApprox: 92,
    rangeStr: "JJ+,AQs+,A5s-A4s,KQs,AKo,AQo:0.6,87s:0.5,76s:0.5",
    description: "Cutoff 3-Bet vs Hijack open.",
  },
  {
    id: "co_vs_utg_call",
    category: "IP_DEFENSE",
    position: "CO",
    name: "CO vs UTG (Call - 4.2%)",
    action: "Call",
    vsPosition: "UTG",
    frequency: 4.2,
    combosApprox: 56,
    rangeStr: "JJ-77,AQs-AJs,KQs,QJs,JTs,T9s",
    description: "Cutoff Flat Call vs UTG open.",
  },
  {
    id: "co_vs_utg_3bet",
    category: "IP_DEFENSE",
    position: "CO",
    name: "CO vs UTG (3-Bet - 5.2%)",
    action: "3-Bet",
    vsPosition: "UTG",
    frequency: 5.2,
    combosApprox: 69,
    rangeStr: "QQ+,AKs,A5s,KQs:0.5,AKo,JJ:0.3",
    description: "Cutoff 3-Bet vs UTG open.",
  },
  {
    id: "hj_vs_utg_3bet",
    category: "IP_DEFENSE",
    position: "HJ",
    name: "HJ vs UTG (3-Bet - 4.8%)",
    action: "3-Bet",
    vsPosition: "UTG",
    frequency: 4.8,
    combosApprox: 64,
    rangeStr: "QQ+,AKs,A5s,A4s:0.5,AKo,JJ:0.4",
    description: "Hijack 3-Bet vs UTG open.",
  },
];

// ==========================================
// 5. CALLING RANGES VS 3-BET (In 3-Bet Pots)
// ==========================================

export const SIX_MAX_VS_3BET_RANGES: SixMaxRangeItem[] = [
  {
    id: "btn_call_vs_bb_3bet",
    category: "VS_3BET",
    position: "BTN",
    name: "BTN Call vs BB 3-Bet (19.0%)",
    action: "Call 3-Bet",
    vsPosition: "BB",
    frequency: 19.0,
    combosApprox: 252,
    rangeStr:
      "JJ-66,55:0.5,AQs-ATs,A5s-A3s:0.6,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s,65s:0.5,AQo-AJo,ATo:0.5,KQo,KJo:0.6",
    description:
      "Button Continuation Call IP vs BB 3-Bet (~44% of BTN opening range).",
  },
  {
    id: "btn_call_vs_sb_3bet",
    category: "VS_3BET",
    position: "BTN",
    name: "BTN Call vs SB 3-Bet (18.5%)",
    action: "Call 3-Bet",
    vsPosition: "SB",
    frequency: 18.5,
    combosApprox: 245,
    rangeStr:
      "TT-66,55:0.5,AQs-ATs,A5s-A3s:0.5,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s,AQo-AJo,KQo",
    description: "Button Continuation Call IP vs SB 3-Bet.",
  },
  {
    id: "co_call_vs_bb_3bet",
    category: "VS_3BET",
    position: "CO",
    name: "CO Call vs BB 3-Bet (11.0%)",
    action: "Call 3-Bet",
    vsPosition: "BB",
    frequency: 11.0,
    combosApprox: 145,
    rangeStr:
      "JJ-77,66:0.5,AQs-ATs,A5s-A4s:0.5,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s:0.6,AQo,AJo:0.6,KQo",
    description: "Cutoff Continuation Call IP vs BB 3-Bet.",
  },
  {
    id: "co_call_vs_sb_3bet",
    category: "VS_3BET",
    position: "CO",
    name: "CO Call vs SB 3-Bet (10.5%)",
    action: "Call 3-Bet",
    vsPosition: "SB",
    frequency: 10.5,
    combosApprox: 139,
    rangeStr:
      "JJ-77,66:0.5,AQs-ATs,A5s-A4s:0.5,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,AQo,KQo",
    description: "Cutoff Continuation Call IP vs SB 3-Bet.",
  },
  {
    id: "co_call_vs_btn_3bet",
    category: "VS_3BET",
    position: "CO",
    name: "CO Call OOP vs BTN 3-Bet (9.8%)",
    action: "Call 3-Bet",
    vsPosition: "BTN",
    frequency: 9.8,
    combosApprox: 130,
    rangeStr:
      "JJ-77,66:0.5,AQs-ATs,A5s-A4s:0.5,KQs-KJs,QJs,JTs,T9s,98s,87s,AQo,KQo:0.5",
    description: "Cutoff Continuation Call OOP vs BTN 3-Bet.",
  },
  {
    id: "hj_call_vs_bb_3bet",
    category: "VS_3BET",
    position: "HJ",
    name: "HJ Call vs BB 3-Bet (8.0%)",
    action: "Call 3-Bet",
    vsPosition: "BB",
    frequency: 8.0,
    combosApprox: 106,
    rangeStr:
      "JJ-88,77:0.5,AQs-AJs,ATs:0.6,KQs-KJs,QJs,JTs,T9s,98s:0.6,AQo,AJo:0.4",
    description: "Hijack Continuation Call IP vs BB 3-Bet.",
  },
  {
    id: "hj_call_vs_sb_3bet",
    category: "VS_3BET",
    position: "HJ",
    name: "HJ Call vs SB 3-Bet (7.6%)",
    action: "Call 3-Bet",
    vsPosition: "SB",
    frequency: 7.6,
    combosApprox: 101,
    rangeStr:
      "JJ-88,77:0.5,AQs-AJs,ATs:0.5,KQs-KJs,QJs,JTs,T9s,AQo",
    description: "Hijack Continuation Call IP vs SB 3-Bet.",
  },
  {
    id: "hj_call_vs_btn_3bet",
    category: "VS_3BET",
    position: "HJ",
    name: "HJ Call OOP vs BTN 3-Bet (7.2%)",
    action: "Call 3-Bet",
    vsPosition: "BTN",
    frequency: 7.2,
    combosApprox: 95,
    rangeStr:
      "JJ-88,77:0.5,AQs-AJs,ATs:0.5,KQs-KJs,QJs,JTs,T9s,AQo:0.7",
    description: "Hijack Continuation Call OOP vs BTN 3-Bet.",
  },
  {
    id: "hj_call_vs_co_3bet",
    category: "VS_3BET",
    position: "HJ",
    name: "HJ Call OOP vs CO 3-Bet (7.0%)",
    action: "Call 3-Bet",
    vsPosition: "CO",
    frequency: 7.0,
    combosApprox: 92,
    rangeStr:
      "JJ-88,77:0.4,AQs-AJs,ATs:0.4,KQs-KJs,QJs,JTs,T9s,AQo:0.6",
    description: "Hijack Continuation Call OOP vs CO 3-Bet.",
  },
  {
    id: "utg_call_vs_bb_3bet",
    category: "VS_3BET",
    position: "UTG",
    name: "UTG Call vs BB 3-Bet (5.8%)",
    action: "Call 3-Bet",
    vsPosition: "BB",
    frequency: 5.8,
    combosApprox: 77,
    rangeStr:
      "QQ-99,88:0.5,AQs,AJs:0.6,KQs,QJs,JTs,T9s:0.6,AKo:0.5,AQo:0.4",
    description: "UTG Continuation Call IP vs BB 3-Bet.",
  },
  {
    id: "utg_call_vs_sb_3bet",
    category: "VS_3BET",
    position: "UTG",
    name: "UTG Call vs SB 3-Bet (5.6%)",
    action: "Call 3-Bet",
    vsPosition: "SB",
    frequency: 5.6,
    combosApprox: 74,
    rangeStr:
      "QQ-99,88:0.4,AQs,AJs:0.5,KQs,QJs,JTs,T9s:0.5,AKo:0.4,AQo:0.3",
    description: "UTG Continuation Call IP vs SB 3-Bet.",
  },
  {
    id: "utg_call_vs_btn_3bet",
    category: "VS_3BET",
    position: "UTG",
    name: "UTG Call OOP vs BTN 3-Bet (5.2%)",
    action: "Call 3-Bet",
    vsPosition: "BTN",
    frequency: 5.2,
    combosApprox: 69,
    rangeStr:
      "QQ-99,88:0.4,AQs,AJs:0.5,KQs,QJs,JTs,AKo:0.4",
    description: "UTG Continuation Call OOP vs BTN 3-Bet.",
  },
  {
    id: "utg_call_vs_co_3bet",
    category: "VS_3BET",
    position: "UTG",
    name: "UTG Call OOP vs CO 3-Bet (5.0%)",
    action: "Call 3-Bet",
    vsPosition: "CO",
    frequency: 5.0,
    combosApprox: 66,
    rangeStr:
      "QQ-99,88:0.3,AQs,AJs:0.4,KQs,QJs,JTs,AKo:0.4",
    description: "UTG Continuation Call OOP vs CO 3-Bet.",
  },
  {
    id: "utg_call_vs_hj_3bet",
    category: "VS_3BET",
    position: "UTG",
    name: "UTG Call OOP vs HJ 3-Bet (4.8%)",
    action: "Call 3-Bet",
    vsPosition: "HJ",
    frequency: 4.8,
    combosApprox: 64,
    rangeStr:
      "QQ-99,AQs,AJs:0.4,KQs,QJs,JTs:0.6,AKo:0.4",
    description: "UTG Continuation Call OOP vs HJ 3-Bet.",
  },
  {
    id: "sb_call_vs_bb_3bet",
    category: "VS_3BET",
    position: "SB",
    name: "SB Call OOP vs BB 3-Bet (18.0%)",
    action: "Call 3-Bet",
    vsPosition: "BB",
    frequency: 18.0,
    combosApprox: 238,
    rangeStr:
      "JJ-77,66:0.5,AQs-ATs,A5s-A3s:0.6,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s:0.5,AQo-AJo,KQo",
    description: "Small Blind Continuation Call OOP vs BB 3-Bet.",
  },
];

// ==========================================
// 6. 4-BET & CALL VS 4-BET RANGES (100bb 6-Max Cash)
// ==========================================

export const SIX_MAX_FOUR_BET_RANGES: SixMaxRangeItem[] = [
  {
    id: "btn_4bet_vs_bb",
    category: "FOUR_BET",
    position: "BTN",
    name: "BTN 4-Bet vs BB (4.8%)",
    action: "4-Bet",
    vsPosition: "BB",
    frequency: 4.8,
    combosApprox: 64,
    rangeStr:
      "QQ+,AKs,A5s-A4s:0.7,A2s:0.5,K5s:0.4,AKo,AQo:0.5,JJ:0.3",
    description: "Button 4-Bet vs BB 3-Bet. Value monsters + suited wheel aces.",
  },
  {
    id: "btn_4bet_vs_sb",
    category: "FOUR_BET",
    position: "BTN",
    name: "BTN 4-Bet vs SB (4.5%)",
    action: "4-Bet",
    vsPosition: "SB",
    frequency: 4.5,
    combosApprox: 60,
    rangeStr:
      "QQ+,AKs,A5s-A4s:0.6,A2s:0.4,AKo,AQo:0.4,JJ:0.3",
    description: "Button 4-Bet vs SB 3-Bet.",
  },
  {
    id: "co_4bet_vs_bb",
    category: "FOUR_BET",
    position: "CO",
    name: "CO 4-Bet vs BB (3.6%)",
    action: "4-Bet",
    vsPosition: "BB",
    frequency: 3.6,
    combosApprox: 48,
    rangeStr: "KK+,QQ:0.7,AKs,A5s-A4s:0.6,AKo,AQo:0.4",
    description: "Cutoff 4-Bet vs BB 3-Bet.",
  },
  {
    id: "co_4bet_vs_btn",
    category: "FOUR_BET",
    position: "CO",
    name: "CO 4-Bet OOP vs BTN (3.8%)",
    action: "4-Bet",
    vsPosition: "BTN",
    frequency: 3.8,
    combosApprox: 50,
    rangeStr: "QQ+,AKs,A5s-A4s:0.6,AKo,AQo:0.4,KQs:0.3",
    description: "Cutoff 4-Bet OOP vs BTN 3-Bet.",
  },
  {
    id: "hj_4bet_vs_co",
    category: "FOUR_BET",
    position: "HJ",
    name: "HJ 4-Bet OOP vs CO/BTN (3.2%)",
    action: "4-Bet",
    vsPosition: "CO",
    frequency: 3.2,
    combosApprox: 42,
    rangeStr: "QQ+,AKs,A5s:0.6,A4s:0.4,AKo,AQo:0.3",
    description: "Hijack 4-Bet OOP vs CO/BTN 3-Bet.",
  },
  {
    id: "utg_4bet_vs_btn",
    category: "FOUR_BET",
    position: "UTG",
    name: "UTG 4-Bet vs 3-Bet (2.8%)",
    action: "4-Bet",
    vsPosition: "BTN",
    frequency: 2.8,
    combosApprox: 37,
    rangeStr: "KK+,QQ:0.6,AKs,A5s:0.5,AKo",
    description: "UTG 4-Bet range vs 3-Bet.",
  },
  {
    id: "sb_4bet_vs_bb",
    category: "FOUR_BET",
    position: "SB",
    name: "SB 4-Bet OOP vs BB (4.2%)",
    action: "4-Bet",
    vsPosition: "BB",
    frequency: 4.2,
    combosApprox: 55,
    rangeStr: "QQ+,AKs,A5s-A4s:0.6,AKo,AQo:0.5,KQo:0.3",
    description: "Small Blind 4-Bet OOP vs BB 3-Bet.",
  },
  {
    id: "bb_call_vs_btn_4bet",
    category: "VS_4BET",
    position: "BB",
    name: "BB Call vs BTN 4-Bet (4.1%)",
    action: "Call 4-Bet",
    vsPosition: "BTN",
    frequency: 4.1,
    combosApprox: 54,
    rangeStr: "JJ-99,TT:0.8,AQs-AJs,KQs,AJo:0.4,AQo:0.6,88:0.4",
    description: "Big Blind Call OOP vs BTN 4-Bet.",
  },
  {
    id: "sb_call_vs_btn_4bet",
    category: "VS_4BET",
    position: "SB",
    name: "SB Call vs BTN 4-Bet (3.8%)",
    action: "Call 4-Bet",
    vsPosition: "BTN",
    frequency: 3.8,
    combosApprox: 50,
    rangeStr: "JJ-99,AQs-AJs,KQs,ATs:0.5,AQo:0.5",
    description: "Small Blind Call OOP vs BTN 4-Bet.",
  },
  {
    id: "btn_call_vs_co_4bet",
    category: "VS_4BET",
    position: "BTN",
    name: "BTN Call IP vs CO 4-Bet (3.6%)",
    action: "Call 4-Bet",
    vsPosition: "CO",
    frequency: 3.6,
    combosApprox: 48,
    rangeStr: "JJ-99,QQ:0.4,AQs-AJs,KQs,ATs:0.5,AKs:0.3,AQo:0.4",
    description: "Button Call IP vs CO 4-Bet.",
  },
];

// ==========================================
// 7. SQUEEZE RANGES (100bb 6-Max Cash)
// ==========================================

export const SIX_MAX_SQUEEZE_RANGES: SixMaxRangeItem[] = [
  {
    id: "bb_squeeze_vs_co_btn",
    category: "SQUEEZE",
    position: "BB",
    name: "BB Squeeze vs CO Open + BTN Call (11.8%)",
    action: "Squeeze",
    vsPosition: "CO",
    frequency: 11.8,
    combosApprox: 156,
    rangeStr:
      "TT+,99:0.5,ATs+,A5s-A2s,KTs+,QTs+,JTs,T9s,AKo,AQo,AJo:0.7,KQo",
    description: "BB Squeeze to 13bb vs CO Open and BTN Flat Call.",
  },
  {
    id: "sb_squeeze_vs_co_btn",
    category: "SQUEEZE",
    position: "SB",
    name: "SB Squeeze vs CO Open + BTN Call (11.2%)",
    action: "Squeeze",
    vsPosition: "CO",
    frequency: 11.2,
    combosApprox: 148,
    rangeStr:
      "99+,ATs+,A5s-A3s,KTs+,QTs+,JTs,T9s,98s:0.6,AKo,AQo,AJo:0.6,KQo",
    description: "SB Squeeze to 13bb vs CO Open and BTN Flat Call.",
  },
  {
    id: "bb_squeeze_vs_utg_btn",
    category: "SQUEEZE",
    position: "BB",
    name: "BB Squeeze vs UTG Open + BTN Call (7.8%)",
    action: "Squeeze",
    vsPosition: "UTG",
    frequency: 7.8,
    combosApprox: 103,
    rangeStr: "JJ+,TT:0.5,AJs+,A5s-A4s,KQs,KJs:0.5,QJs:0.5,AKo,AQo:0.7",
    description: "BB Squeeze to 13bb vs UTG Open and BTN Flat Call.",
  },
  {
    id: "btn_squeeze_vs_utg_co",
    category: "SQUEEZE",
    position: "BTN",
    name: "BTN Squeeze IP vs UTG Open + CO Call (7.5%)",
    action: "Squeeze",
    vsPosition: "UTG",
    frequency: 7.5,
    combosApprox: 99,
    rangeStr: "JJ+,TT:0.5,AQs+,A5s-A4s,KQs,QJs:0.5,JTs:0.5,AKo,AQo:0.5",
    description: "BTN Squeeze IP to 11bb vs UTG Open and CO Flat Call.",
  },
];

// All Ranges Combined
export const ALL_SIX_MAX_RANGES: SixMaxRangeItem[] = [
  ...SIX_MAX_RFI_RANGES,
  ...SIX_MAX_BB_DEFENSE_RANGES,
  ...SIX_MAX_SB_DEFENSE_RANGES,
  ...SIX_MAX_IP_DEFENSE_RANGES,
  ...SIX_MAX_VS_3BET_RANGES,
  ...SIX_MAX_FOUR_BET_RANGES,
  ...SIX_MAX_SQUEEZE_RANGES,
];

// ========================================================
// 8. PRECONFIGURED 6-MAX CASH 100BB POSTFLOP SPOT PRESETS
//    Organized by Action Type (SRP, 3-Bet, 4-Bet, Squeeze)
//    and Specific Positional Matchups
// ========================================================

const standardBetSizes = {
  srp: {
    flop: { ipBet: "33, 75", oopBet: "33", raise: "50" },
    turn: { ipBet: "67, 125", oopBet: "67", raise: "50", donk: "" },
    river: { ipBet: "75, 150", oopBet: "75", raise: "50", donk: "" },
  },
  threeBet: {
    flop: { ipBet: "33, 67", oopBet: "33, 67", raise: "50" },
    turn: { ipBet: "50, 100", oopBet: "50, 100", raise: "50", donk: "" },
    river: { ipBet: "67, allin", oopBet: "67, allin", raise: "50", donk: "" },
  },
  fourBet: {
    flop: { ipBet: "25, 50", oopBet: "25", raise: "allin" },
    turn: { ipBet: "allin", oopBet: "allin", raise: "allin", donk: "" },
    river: { ipBet: "allin", oopBet: "allin", raise: "allin", donk: "" },
  },
};

export const BUILTIN_SIX_MAX_SPOTS: SixMaxSpotPreset[] = [
  // ==========================================
  // 1. SRP (Single Raised Pots) - 9 Matchups
  // ==========================================
  {
    id: "6m_srp_utg_bb",
    name: "SRP: UTG Open vs BB Call",
    shortLabel: "UTG vs BB",
    subLabel: "BB Call OOP vs UTG",
    potType: "SRP",
    oopPosition: "BB",
    ipPosition: "UTG",
    startingPot: 5.5,
    effectiveStack: 97.5,
    oopPlayerName: "BB (Call)",
    ipPlayerName: "UTG (Open 2.5x)",
    oopRange:
      "JJ-22,AQs-A2s,KQs-K8s,QJs-Q8s,JTs-J8s,T9s-T8s,98s-97s,87s-86s,76s-75s,65s-64s,54s,AQo-ATo,KJo-KTo,QJo-QTo,JTo",
    ipRange:
      "66+,55:0.6,44:0.3,A2s+,K9s+,Q9s+,J9s+,T9s,98s,87s,76s,65s,K8s:0.5,AJo+,ATo:0.5,KQo,KJo:0.4",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_hj_bb",
    name: "SRP: HJ Open vs BB Call",
    shortLabel: "HJ vs BB",
    subLabel: "BB Call OOP vs HJ",
    potType: "SRP",
    oopPosition: "BB",
    ipPosition: "HJ",
    startingPot: 5.5,
    effectiveStack: 97.5,
    oopPlayerName: "BB (Call)",
    ipPlayerName: "HJ (Open 2.5x)",
    oopRange:
      "TT-22,ATs-A2s,KJs-K6s,QJs-Q7s,JTs-J7s,T9s-T7s,98s-96s,87s-86s,76s-75s,65s-64s,54s-53s,AJo-A8o,KTo-K9o,QTo-Q9o,JTo-J9o,T9o",
    ipRange:
      "55+,44:0.6,33:0.4,22:0.3,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,65s,54s,K7s:0.5,Q8s:0.6,J8s:0.5,ATo+,A9o:0.3,KTo+,QTo:0.6,JTo:0.5",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_co_bb",
    name: "SRP: CO Open vs BB Call",
    shortLabel: "CO vs BB",
    subLabel: "BB Call OOP vs CO",
    potType: "SRP",
    oopPosition: "BB",
    ipPosition: "CO",
    startingPot: 5.5,
    effectiveStack: 97.5,
    oopPlayerName: "BB (Call)",
    ipPlayerName: "CO (Open 2.5x)",
    oopRange:
      "99-22,ATs-A2s,K9s-K2s,Q9s-Q4s,J9s-J6s,T9s-T6s,98s-96s,87s-85s,76s-74s,65s-63s,54s-53s,43s,ATo-A6o,KTo-K7o,QTo-Q8o,JTo-J8o,T9o-T8o,98o,87o",
    ipRange:
      "22+,A2s+,K4s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s,43s:0.5,A8o+,A7o:0.5,A5o:0.4,K9o+,Q9o+,J9o+,T9o,98o:0.5",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_btn_bb",
    name: "SRP: BTN Open vs BB Call",
    shortLabel: "BTN vs BB",
    subLabel: "BB Call OOP vs BTN",
    potType: "SRP",
    oopPosition: "BB",
    ipPosition: "BTN",
    startingPot: 5.5,
    effectiveStack: 97.5,
    oopPlayerName: "BB (Call)",
    ipPlayerName: "BTN (Open 2.5x)",
    oopRange:
      "88-22,A9s-A2s,K9s-K2s,Q9s-Q2s,J8s-J2s,T8s-T2s,97s-92s,86s-82s,75s-72s,64s-62s,53s-52s,43s,32s,ATo-A2o,KTo-K4o,QTo-Q6o,JTo-J7o,T9o-T7o,98o-97o,87o-86o,76o,65o",
    ipRange:
      "22+,A2s+,K2s+,Q2s+,J3s+,T6s+,95s+,85s+,74s+,63s+,53s+,43s,32s:0.5,A2o+,K6o+,Q7o+,J7o+,T7o+,97o+,87o,76o,65o,54o:0.5",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_sb_bb",
    name: "SRP: SB Open vs BB Call",
    shortLabel: "SB vs BB",
    subLabel: "SB Open OOP vs BB Call IP",
    potType: "SRP",
    oopPosition: "SB",
    ipPosition: "BB",
    startingPot: 6.0,
    effectiveStack: 97.0,
    oopPlayerName: "SB (Open 3.0x)",
    ipPlayerName: "BB (Call IP)",
    oopRange:
      "22+,A2s+,K2s+,Q3s+,J5s+,T6s+,96s+,85s+,74s+,63s+,53s+,43s,A2o+,K7o+,Q8o+,J8o+,T8o+,97o+,86o+,76o,65o",
    ipRange:
      "77-22,A9s-A2s,K9s-K2s,Q9s-Q2s,J8s-J2s,T8s-T2s,97s-92s,86s-82s,75s-72s,64s-62s,53s-52s,43s,32s,ATo-A2o,KTo-K3o,QTo-Q5o,JTo-J6o,T9o-T6o,98o-96o,87o-85o,76o-75o,65o,54o",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_utg_btn",
    name: "SRP: UTG Open vs BTN Call",
    shortLabel: "UTG vs BTN",
    subLabel: "UTG Open OOP vs BTN Call",
    potType: "SRP",
    oopPosition: "UTG",
    ipPosition: "BTN",
    startingPot: 6.5,
    effectiveStack: 97.5,
    oopPlayerName: "UTG (Open 2.5x)",
    ipPlayerName: "BTN (Flat Call)",
    oopRange:
      "66+,55:0.6,44:0.3,A2s+,K9s+,Q9s+,J9s+,T9s,98s,87s,76s,65s,K8s:0.5,AJo+,ATo:0.5,KQo,KJo:0.4",
    ipRange: "JJ-77,AQs-AJs,KQs,QJs,JTs,T9s,98s",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_hj_btn",
    name: "SRP: HJ Open vs BTN Call",
    shortLabel: "HJ vs BTN",
    subLabel: "HJ Open OOP vs BTN Call",
    potType: "SRP",
    oopPosition: "HJ",
    ipPosition: "BTN",
    startingPot: 6.5,
    effectiveStack: 97.5,
    oopPlayerName: "HJ (Open 2.5x)",
    ipPlayerName: "BTN (Flat Call)",
    oopRange:
      "55+,44:0.6,33:0.4,22:0.3,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,65s,54s,K7s:0.5,Q8s:0.6,J8s:0.5,ATo+,A9o:0.3,KTo+,QTo:0.6,JTo:0.5",
    ipRange: "TT-66,AJs-ATs,KJs,QJs,JTs,T9s,98s,87s,76s:0.5",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_co_btn",
    name: "SRP: CO Open vs BTN Call",
    shortLabel: "CO vs BTN",
    subLabel: "CO Open OOP vs BTN Call",
    potType: "SRP",
    oopPosition: "CO",
    ipPosition: "BTN",
    startingPot: 6.5,
    effectiveStack: 97.5,
    oopPlayerName: "CO (Open 2.5x)",
    ipPlayerName: "BTN (Flat Call)",
    oopRange:
      "22+,A2s+,K4s+,Q6s+,J7s+,T7s+,97s+,86s+,75s+,64s+,54s,43s:0.5,A8o+,A7o:0.5,A5o:0.4,K9o+,Q9o+,J9o+,T9o,98o:0.5",
    ipRange: "99-55,AQs-ATs,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s,AQo:0.3",
    defaultBetSizes: standardBetSizes.srp,
  },
  {
    id: "6m_srp_hj_co",
    name: "SRP: HJ Open vs CO Call",
    shortLabel: "HJ vs CO",
    subLabel: "HJ Open OOP vs CO Call",
    potType: "SRP",
    oopPosition: "HJ",
    ipPosition: "CO",
    startingPot: 6.5,
    effectiveStack: 97.5,
    oopPlayerName: "HJ (Open 2.5x)",
    ipPlayerName: "CO (Flat Call)",
    oopRange:
      "55+,44:0.6,33:0.4,22:0.3,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,65s,54s,K7s:0.5,Q8s:0.6,J8s:0.5,ATo+,A9o:0.3,KTo+,QTo:0.6,JTo:0.5",
    ipRange: "TT-66,AJs-ATs,KJs,QJs,JTs,T9s,98s,87s",
    defaultBetSizes: standardBetSizes.srp,
  },

  // ==========================================
  // 2. 3-BET POTS (3Bet) - 13 Matchups
  // ==========================================
  {
    id: "6m_3bp_bb_utg",
    name: "3-Bet: BB 3-Bet vs UTG Call",
    shortLabel: "BB vs UTG",
    subLabel: "BB 3-Bet OOP vs UTG Call",
    potType: "3Bet",
    oopPosition: "BB",
    ipPosition: "UTG",
    startingPot: 21.5,
    effectiveStack: 89.5,
    oopPlayerName: "BB (3-Bet 10.5bb)",
    ipPlayerName: "UTG (Call 3-Bet)",
    oopRange:
      "QQ+,AKs,A5s-A4s,KQs:0.5,A2s:0.5,AKo,JJ:0.3,TT:0.2,AJs:0.3,76s:0.4,65s:0.4",
    ipRange:
      "QQ-99,88:0.5,AQs,AJs:0.6,KQs,QJs,JTs,T9s:0.6,AKo:0.5,AQo:0.4",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_bb_hj",
    name: "3-Bet: BB 3-Bet vs HJ Call",
    shortLabel: "BB vs HJ",
    subLabel: "BB 3-Bet OOP vs HJ Call",
    potType: "3Bet",
    oopPosition: "BB",
    ipPosition: "HJ",
    startingPot: 21.5,
    effectiveStack: 89.5,
    oopPlayerName: "BB (3-Bet 10.5bb)",
    ipPlayerName: "HJ (Call 3-Bet)",
    oopRange:
      "JJ+,AJs+,A5s-A3s,KQs,KJs:0.5,QJs:0.5,AKo,AQo:0.6,TT:0.5,87s:0.4,76s:0.5,65s:0.5",
    ipRange:
      "JJ-88,77:0.5,AQs-AJs,ATs:0.6,KQs-KJs,QJs,JTs,T9s,98s:0.6,AQo,AJo:0.4",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_bb_co",
    name: "3-Bet: BB 3-Bet vs CO Call",
    shortLabel: "BB vs CO",
    subLabel: "BB 3-Bet OOP vs CO Call",
    potType: "3Bet",
    oopPosition: "BB",
    ipPosition: "CO",
    startingPot: 21.5,
    effectiveStack: 89.5,
    oopPlayerName: "BB (3-Bet 10.5bb)",
    ipPlayerName: "CO (Call 3-Bet)",
    oopRange:
      "TT+,AJs+,A5s-A2s,KTs+,QTs+,JTs,AKo,AQo,AJo:0.7,KQo,KJo:0.5,87s:0.6,76s:0.6,65s:0.6,54s:0.5",
    ipRange:
      "JJ-77,66:0.5,AQs-ATs,A5s-A4s:0.5,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s:0.6,AQo,AJo:0.6,KQo",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_bb_btn",
    name: "3-Bet: BB 3-Bet vs BTN Call",
    shortLabel: "BB vs BTN",
    subLabel: "BB 3-Bet OOP vs BTN Call",
    potType: "3Bet",
    oopPosition: "BB",
    ipPosition: "BTN",
    startingPot: 21.5,
    effectiveStack: 89.5,
    oopPlayerName: "BB (3-Bet 10.5bb)",
    ipPlayerName: "BTN (Call 3-Bet)",
    oopRange:
      "99+,ATs+,A5s-A2s,KTs+,QTs+,JTs,T9s,98s,AKo,AQo,AJo,ATo:0.5,KQo,KJo:0.6,QJo:0.5,A9o-A7o:0.4,87s:0.7,76s:0.7,65s:0.7,54s:0.6",
    ipRange:
      "JJ-66,55:0.5,AQs-ATs,A5s-A3s:0.6,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s,65s:0.5,AQo-AJo,ATo:0.5,KQo,KJo:0.6",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_sb_utg",
    name: "3-Bet: SB 3-Bet vs UTG Call",
    shortLabel: "SB vs UTG",
    subLabel: "SB 3-Bet OOP vs UTG Call",
    potType: "3Bet",
    oopPosition: "SB",
    ipPosition: "UTG",
    startingPot: 21.0,
    effectiveStack: 90.0,
    oopPlayerName: "SB (3-Bet 10.0bb)",
    ipPlayerName: "UTG (Call 3-Bet)",
    oopRange: "TT+,AJs+,A5s,KQs,AKo,AQo:0.7,99:0.4,A4s:0.5",
    ipRange:
      "QQ-99,88:0.4,AQs,AJs:0.5,KQs,QJs,JTs,T9s:0.5,AKo:0.4,AQo:0.3",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_sb_hj",
    name: "3-Bet: SB 3-Bet vs HJ Call",
    shortLabel: "SB vs HJ",
    subLabel: "SB 3-Bet OOP vs HJ Call",
    potType: "3Bet",
    oopPosition: "SB",
    ipPosition: "HJ",
    startingPot: 21.0,
    effectiveStack: 90.0,
    oopPlayerName: "SB (3-Bet 10.0bb)",
    ipPlayerName: "HJ (Call 3-Bet)",
    oopRange:
      "99+,ATs+,A5s-A4s,KTs+,QJs,JTs,T9s,87s:0.5,76s:0.5,AQo+,AKo,88:0.5",
    ipRange: "JJ-88,77:0.5,AQs-AJs,ATs:0.5,KQs-KJs,QJs,JTs,T9s,AQo",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_sb_co",
    name: "3-Bet: SB 3-Bet vs CO Call",
    shortLabel: "SB vs CO",
    subLabel: "SB 3-Bet OOP vs CO Call",
    potType: "3Bet",
    oopPosition: "SB",
    ipPosition: "CO",
    startingPot: 21.0,
    effectiveStack: 90.0,
    oopPlayerName: "SB (3-Bet 10.0bb)",
    ipPlayerName: "CO (Call 3-Bet)",
    oopRange:
      "88+,A8s+,A5s-A3s,KTs+,QTs+,JTs,T9s,98s,87s,76s,AQo+,AKo,AJo:0.7,KQo,KJo:0.4,77:0.5",
    ipRange:
      "JJ-77,66:0.5,AQs-ATs,A5s-A4s:0.5,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,AQo,KQo",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_sb_btn",
    name: "3-Bet: SB 3-Bet vs BTN Call",
    shortLabel: "SB vs BTN",
    subLabel: "SB 3-Bet OOP vs BTN Call",
    potType: "3Bet",
    oopPosition: "SB",
    ipPosition: "BTN",
    startingPot: 21.0,
    effectiveStack: 90.0,
    oopPlayerName: "SB (3-Bet 10.0bb)",
    ipPlayerName: "BTN (Call 3-Bet)",
    oopRange:
      "77+,A2s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,76s,65s,54s,AJo+,KQo,ATo:0.6,KJo:0.6,QJo:0.5,66:0.5,55:0.5",
    ipRange:
      "TT-66,55:0.5,AQs-ATs,A5s-A3s:0.5,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s,AQo-AJo,KQo",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_bb_sb",
    name: "3-Bet: SB Call vs BB 3-Bet IP",
    shortLabel: "SB vs BB",
    subLabel: "SB Call OOP vs BB 3-Bet IP",
    potType: "3Bet",
    oopPosition: "SB",
    ipPosition: "BB",
    startingPot: 18.0,
    effectiveStack: 91.0,
    oopPlayerName: "SB (Call 3-Bet OOP)",
    ipPlayerName: "BB (3-Bet 9.0bb IP)",
    oopRange:
      "JJ-77,66:0.5,AQs-ATs,A5s-A3s:0.6,KQs-KTs,QJs-QTs,JTs,T9s,98s,87s,76s:0.5,AQo-AJo,KQo",
    ipRange:
      "88+,ATs+,A5s-A2s,KTs+,QTs+,JTs,T9s,98s,87s,AKo,AQo,AJo,ATo,KQo,KJo,QJo,A9o-A6o:0.5,K9o:0.5,Q9o:0.5,J9o:0.5,76s:0.7,65s:0.7,54s:0.7",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_btn_utg",
    name: "3-Bet: UTG Call vs BTN 3-Bet IP",
    shortLabel: "UTG vs BTN",
    subLabel: "UTG Call OOP vs BTN 3-Bet IP",
    potType: "3Bet",
    oopPosition: "UTG",
    ipPosition: "BTN",
    startingPot: 16.5,
    effectiveStack: 92.5,
    oopPlayerName: "UTG (Call 3-Bet OOP)",
    ipPlayerName: "BTN (3-Bet 7.5bb IP)",
    oopRange: "QQ-99,88:0.4,AQs,AJs:0.5,KQs,QJs,JTs,AKo:0.4",
    ipRange: "QQ+,AKs,A5s,KQs:0.5,AKo,JJ:0.3",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_btn_hj",
    name: "3-Bet: HJ Call vs BTN 3-Bet IP",
    shortLabel: "HJ vs BTN",
    subLabel: "HJ Call OOP vs BTN 3-Bet IP",
    potType: "3Bet",
    oopPosition: "HJ",
    ipPosition: "BTN",
    startingPot: 16.5,
    effectiveStack: 92.5,
    oopPlayerName: "HJ (Call 3-Bet OOP)",
    ipPlayerName: "BTN (3-Bet 7.5bb IP)",
    oopRange: "JJ-88,77:0.5,AQs-AJs,ATs:0.5,KQs-KJs,QJs,JTs,T9s,AQo:0.7",
    ipRange: "JJ+,AQs+,A5s-A4s,KQs,AKo,AQo:0.5,65s:0.5",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_btn_co",
    name: "3-Bet: CO Call vs BTN 3-Bet IP",
    shortLabel: "CO vs BTN",
    subLabel: "CO Call OOP vs BTN 3-Bet IP",
    potType: "3Bet",
    oopPosition: "CO",
    ipPosition: "BTN",
    startingPot: 16.5,
    effectiveStack: 92.5,
    oopPlayerName: "CO (Call 3-Bet OOP)",
    ipPlayerName: "BTN (3-Bet 7.5bb IP)",
    oopRange:
      "JJ-77,66:0.5,AQs-ATs,A5s-A4s:0.5,KQs-KJs,QJs,JTs,T9s,98s,87s,AQo,KQo:0.5",
    ipRange:
      "TT+,AJs+,A5s-A4s,A2s:0.5,KTs+,QJs,AKo,AQo:0.7,87s:0.5,76s:0.5,65s:0.5",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_3bp_co_hj",
    name: "3-Bet: HJ Call vs CO 3-Bet IP",
    shortLabel: "HJ vs CO",
    subLabel: "HJ Call OOP vs CO 3-Bet IP",
    potType: "3Bet",
    oopPosition: "HJ",
    ipPosition: "CO",
    startingPot: 16.5,
    effectiveStack: 92.5,
    oopPlayerName: "HJ (Call 3-Bet OOP)",
    ipPlayerName: "CO (3-Bet 7.5bb IP)",
    oopRange: "JJ-88,77:0.4,AQs-AJs,ATs:0.4,KQs-KJs,QJs,JTs,T9s,AQo:0.6",
    ipRange: "JJ+,AQs+,A5s-A4s,KQs,AKo,AQo:0.6,87s:0.5,76s:0.5",
    defaultBetSizes: standardBetSizes.threeBet,
  },

  // ==========================================
  // 3. 4-BET POTS (4Bet) - 6 Matchups
  // ==========================================
  {
    id: "6m_4bp_btn_bb",
    name: "4-Bet: BB Call vs BTN 4-Bet IP",
    shortLabel: "BB vs BTN",
    subLabel: "BB Call OOP vs BTN 4-Bet IP",
    potType: "4Bet",
    oopPosition: "BB",
    ipPosition: "BTN",
    startingPot: 45.0,
    effectiveStack: 77.5,
    oopPlayerName: "BB (Call 4-Bet OOP)",
    ipPlayerName: "BTN (4-Bet 22.5bb IP)",
    oopRange: "JJ-99,TT:0.8,AQs-AJs,KQs,AJo:0.4,AQo:0.6,88:0.4",
    ipRange: "QQ+,AKs,A5s-A4s:0.7,A2s:0.5,K5s:0.4,AKo,AQo:0.5,JJ:0.3",
    defaultBetSizes: standardBetSizes.fourBet,
  },
  {
    id: "6m_4bp_btn_sb",
    name: "4-Bet: SB Call vs BTN 4-Bet IP",
    shortLabel: "SB vs BTN",
    subLabel: "SB Call OOP vs BTN 4-Bet IP",
    potType: "4Bet",
    oopPosition: "SB",
    ipPosition: "BTN",
    startingPot: 45.0,
    effectiveStack: 77.5,
    oopPlayerName: "SB (Call 4-Bet OOP)",
    ipPlayerName: "BTN (4-Bet 22.0bb IP)",
    oopRange: "JJ-99,AQs-AJs,KQs,ATs:0.5,AQo:0.5",
    ipRange: "QQ+,AKs,A5s-A4s:0.6,A2s:0.4,AKo,AQo:0.4,JJ:0.3",
    defaultBetSizes: standardBetSizes.fourBet,
  },
  {
    id: "6m_4bp_co_bb",
    name: "4-Bet: BB Call vs CO 4-Bet IP",
    shortLabel: "BB vs CO",
    subLabel: "BB Call OOP vs CO 4-Bet IP",
    potType: "4Bet",
    oopPosition: "BB",
    ipPosition: "CO",
    startingPot: 45.0,
    effectiveStack: 77.5,
    oopPlayerName: "BB (Call 4-Bet OOP)",
    ipPlayerName: "CO (4-Bet 22.5bb IP)",
    oopRange: "JJ-99,AQs-AJs,KQs,AQo:0.5",
    ipRange: "KK+,QQ:0.7,AKs,A5s-A4s:0.6,AKo,AQo:0.4",
    defaultBetSizes: standardBetSizes.fourBet,
  },
  {
    id: "6m_4bp_sb_bb",
    name: "4-Bet: SB 4-Bet OOP vs BB Call IP",
    shortLabel: "SB vs BB",
    subLabel: "SB 4-Bet OOP vs BB Call IP",
    potType: "4Bet",
    oopPosition: "SB",
    ipPosition: "BB",
    startingPot: 44.0,
    effectiveStack: 78.0,
    oopPlayerName: "SB (4-Bet 22.0bb OOP)",
    ipPlayerName: "BB (Call 4-Bet IP)",
    oopRange: "QQ+,AKs,A5s-A4s:0.6,AKo,AQo:0.5,KQo:0.3",
    ipRange: "JJ-99,AQs-AJs,KQs,AQo:0.5",
    defaultBetSizes: standardBetSizes.fourBet,
  },
  {
    id: "6m_4bp_co_btn",
    name: "4-Bet: CO 4-Bet OOP vs BTN Call IP",
    shortLabel: "CO vs BTN",
    subLabel: "CO 4-Bet OOP vs BTN Call IP",
    potType: "4Bet",
    oopPosition: "CO",
    ipPosition: "BTN",
    startingPot: 43.5,
    effectiveStack: 79.0,
    oopPlayerName: "CO (4-Bet 21.0bb OOP)",
    ipPlayerName: "BTN (Call 4-Bet IP)",
    oopRange: "QQ+,AKs,A5s-A4s:0.6,AKo,AQo:0.4,KQs:0.3",
    ipRange: "JJ-99,QQ:0.4,AQs-AJs,KQs,ATs:0.5,AKs:0.3,AQo:0.4",
    defaultBetSizes: standardBetSizes.fourBet,
  },
  {
    id: "6m_4bp_utg_btn",
    name: "4-Bet: UTG 4-Bet OOP vs BTN Call IP",
    shortLabel: "UTG vs BTN",
    subLabel: "UTG 4-Bet OOP vs BTN Call IP",
    potType: "4Bet",
    oopPosition: "UTG",
    ipPosition: "BTN",
    startingPot: 43.5,
    effectiveStack: 79.0,
    oopPlayerName: "UTG (4-Bet 21.0bb OOP)",
    ipPlayerName: "BTN (Call 4-Bet IP)",
    oopRange: "KK+,QQ:0.6,AKs,A5s:0.5,AKo",
    ipRange: "QQ-TT,AQs-AJs,KQs,AKs:0.4",
    defaultBetSizes: standardBetSizes.fourBet,
  },

  // ==========================================
  // 4. SQUEEZE POTS (Squeeze) - 4 Matchups
  // ==========================================
  {
    id: "6m_sqz_bb_co",
    name: "Squeeze: BB Squeeze vs CO Call (BTN Folds)",
    shortLabel: "BB Sqz vs CO",
    subLabel: "BB Sqz 13bb OOP vs CO Call",
    potType: "Squeeze",
    oopPosition: "BB",
    ipPosition: "CO",
    startingPot: 29.0,
    effectiveStack: 87.0,
    oopPlayerName: "BB (Squeeze 13bb OOP)",
    ipPlayerName: "CO (Call Squeeze IP)",
    oopRange: "TT+,99:0.5,ATs+,A5s-A2s,KTs+,QTs+,JTs,T9s,AKo,AQo,AJo:0.7,KQo",
    ipRange:
      "JJ-77,AQs-ATs,KQs-KJs,QJs,JTs,T9s,98s,87s:0.6,AQo,KQo:0.5",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_sqz_sb_co",
    name: "Squeeze: SB Squeeze vs CO Call (BTN Folds)",
    shortLabel: "SB Sqz vs CO",
    subLabel: "SB Sqz 13bb OOP vs CO Call",
    potType: "Squeeze",
    oopPosition: "SB",
    ipPosition: "CO",
    startingPot: 29.5,
    effectiveStack: 87.0,
    oopPlayerName: "SB (Squeeze 13bb OOP)",
    ipPlayerName: "CO (Call Squeeze IP)",
    oopRange:
      "99+,ATs+,A5s-A3s,KTs+,QTs+,JTs,T9s,98s:0.6,AKo,AQo,AJo:0.6,KQo",
    ipRange: "JJ-77,AQs-ATs,KQs-KJs,QJs,JTs,T9s,98s,AQo",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_sqz_bb_utg",
    name: "Squeeze: BB Squeeze vs UTG Call (BTN Folds)",
    shortLabel: "BB Sqz vs UTG",
    subLabel: "BB Sqz 13bb OOP vs UTG Call",
    potType: "Squeeze",
    oopPosition: "BB",
    ipPosition: "UTG",
    startingPot: 29.0,
    effectiveStack: 87.0,
    oopPlayerName: "BB (Squeeze 13bb OOP)",
    ipPlayerName: "UTG (Call Squeeze IP)",
    oopRange: "JJ+,TT:0.5,AJs+,A5s-A4s,KQs,KJs:0.5,QJs:0.5,AKo,AQo:0.7",
    ipRange: "QQ-99,AQs,AJs:0.6,KQs,QJs,JTs,AKo:0.5",
    defaultBetSizes: standardBetSizes.threeBet,
  },
  {
    id: "6m_sqz_btn_utg",
    name: "Squeeze: UTG Call OOP vs BTN Squeeze IP",
    shortLabel: "UTG vs BTN Sqz",
    subLabel: "UTG Call OOP vs BTN Sqz 11bb",
    potType: "Squeeze",
    oopPosition: "UTG",
    ipPosition: "BTN",
    startingPot: 26.0,
    effectiveStack: 89.0,
    oopPlayerName: "UTG (Call Squeeze OOP)",
    ipPlayerName: "BTN (Squeeze 11bb IP)",
    oopRange: "QQ-99,AQs,AJs:0.5,KQs,QJs,JTs,AKo:0.4",
    ipRange: "JJ+,TT:0.5,AQs+,A5s-A4s,KQs,QJs:0.5,JTs:0.5,AKo,AQo:0.5",
    defaultBetSizes: standardBetSizes.threeBet,
  },
];

const STORAGE_KEY_6MAX = "desktop_postflop_custom_6max_presets_v1";

export function getCustomSixMaxPresets(): SixMaxSpotPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_6MAX);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomSixMaxPresets(presets: SixMaxSpotPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_6MAX, JSON.stringify(presets));
  } catch {
    // ignore storage errors
  }
}

export function getAllSixMaxPresets(): SixMaxSpotPreset[] {
  return [...BUILTIN_SIX_MAX_SPOTS, ...getCustomSixMaxPresets()];
}
