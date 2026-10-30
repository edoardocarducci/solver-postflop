export type SixMaxPosition = "UTG" | "HJ" | "CO" | "BTN" | "SB" | "BB";

export type SixMaxPotType = "SRP" | "3Bet" | "4Bet" | "Squeeze";

export interface SixMaxRangeItem {
  id: string;
  category:
    | "RFI"
    | "BB_DEFENSE"
    | "SB_DEFENSE"
    | "IP_DEFENSE"
    | "VS_3BET"
    | "FOUR_BET"
    | "VS_4BET"
    | "SQUEEZE";
  position: SixMaxPosition;
  name: string;
  action: "Open" | "Call" | "3-Bet" | "Call 3-Bet" | "4-Bet" | "Call 4-Bet" | "Squeeze";
  vsPosition?: SixMaxPosition;
  frequency: number; // in %
  combosApprox: number;
  rangeStr: string;
  description?: string;
}

export interface SixMaxSpotPreset {
  id: string;
  name: string;
  shortLabel: string; // e.g. "UTG vs BB", "BTN vs BB"
  subLabel?: string; // e.g. "Open 2.5x vs Call", "3-Bet vs Call"
  potType: SixMaxPotType;
  oopPosition: SixMaxPosition;
  ipPosition: SixMaxPosition;
  startingPot: number;
  effectiveStack: number;
  oopPlayerName: string;
  ipPlayerName: string;
  oopRange: string;
  ipRange: string;
  defaultBetSizes: {
    flop: { ipBet: string; oopBet: string; raise: string };
    turn: { ipBet: string; oopBet: string; raise: string; donk: string };
    river: { ipBet: string; oopBet: string; raise: string; donk: string };
  };
}
