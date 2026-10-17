export type FilterType = 'ALL_PASS' | 'LOW_PASS' | 'HIGH_PASS' | 'NOTCH';

export interface MysterySignal {
  id: string;
  name: string;
  frequencyMHz: number;
  bandwidthMHz: number;
  modulation: 'AM_MORSE' | 'CIPHER_TONES' | 'SPECTRAL_WATERFALL';
  source: string;
  morseText?: string;
  clueHint: string;
  solutionKey: string;
  expectedInput: string;
  spectralPattern?: number[][]; // Custom frequency bins to light up on FFT
}

export interface ReceiverParams {
  frequencyMHz: number;
  filterType: FilterType;
  filterCutoffHz: number;
  squelch: number; // 0 to 1
  volume: number; // 0 to 1
  powerOn: boolean;
}

export interface ReceptionMetrics {
  currentFrequencyMHz: number;
  tunedSignal: MysterySignal | null;
  signalStrength: number; // 0 to 1
  signalToNoiseRatio: number; // dB
  heterodynePitchHz: number;
  isFilterOptimal: boolean;
}

export interface DecodedEntry {
  signalId: string;
  solved: boolean;
  discoveredText?: string;
}
