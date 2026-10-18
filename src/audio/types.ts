export type FilterType = 'ALL_PASS' | 'LOW_PASS' | 'HIGH_PASS' | 'NOTCH';

export type ModulationType = 'AM_MORSE' | 'CIPHER_TONES' | 'SPECTRAL_WATERFALL' | 'NOTCH_BEACON';

export interface MysterySignal {
  id: string;
  name: string;
  frequencyMHz: number;
  bandwidthMHz: number;
  modulation: ModulationType;
  source: string;
  coordinates: string;
  interceptDate: string;
  classification: string;
  declassifiedCable: string;
  pinboardX: number; // 0 to 100 percentage
  pinboardY: number;
  morseText?: string;
  clueHint: string;
  hints: string[]; // Graduated hints (Level 1, 2, 3)
  solutionKey: string;
  expectedInput: string;
  notchFrequencyHz?: number; // Target frequency for notch filtering
  spectralPattern?: number[][];
}

export interface StationLogEntry {
  id: string;
  date: string;
  author: string;
  callsign: string;
  title: string;
  content: string;
  clearance?: string;
  targetFrequencyMHz?: number;
}

export interface ReceiverParams {
  frequencyMHz: number;
  filterType: FilterType;
  filterCutoffHz: number;
  squelch: number; // 0 to 1
  volume: number; // 0 to 1
  isMuted: boolean;
  powerOn: boolean;
}

export interface ReceptionMetrics {
  currentFrequencyMHz: number;
  tunedSignal: MysterySignal | null;
  signalStrength: number; // 0 to 1
  signalToNoiseRatio: number; // dB
  heterodynePitchHz: number;
  isFilterOptimal: boolean;
  isSignalBlipActive: boolean; // Visual blink indicator for accessibility
}

export interface DecodedEntry {
  signalId: string;
  solved: boolean;
  hintsRevealed: number;
  discoveredText?: string;
}
