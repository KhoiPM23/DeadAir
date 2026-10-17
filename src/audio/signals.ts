import { MysterySignal } from './types';

export const MORSE_TABLE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

export const MYSTERY_SIGNALS: MysterySignal[] = [
  {
    id: 'signal-echo',
    name: 'CHANNEL 1: AUTOMATED DISTRESS BEACON',
    frequencyMHz: 124.5,
    bandwidthMHz: 0.9,
    modulation: 'AM_MORSE',
    source: 'Outpost Beacon Alpha',
    morseText: 'SOS BASE ECHO',
    clueHint: 'Distress carrier intercepted at 124.5 MHz. Decipher the Morse sequence (... --- ... / -... .- ... . / . -.-. .... ---). Which outpost is transmitting?',
    solutionKey: 'Distress Origin Outpost',
    expectedInput: 'BASE ECHO'
  },
  {
    id: 'signal-omega',
    name: 'CHANNEL 2: FREQUENCY-JAMMED CIPHER',
    frequencyMHz: 285.4,
    bandwidthMHz: 0.7,
    modulation: 'CIPHER_TONES',
    source: 'Encrypted Relay Node',
    clueHint: 'Heavy high-pitch electrical interference at 285.4 MHz. Switch Filter to LOW-PASS (Cutoff ~ 800Hz) to strip away the hiss and identify the 4-digit code.',
    solutionKey: 'Bypass Passcode',
    expectedInput: '7391'
  },
  {
    id: 'signal-icarus',
    name: 'CHANNEL 3: SPECTRAL WATERFALL TELEMETRY',
    frequencyMHz: 415.0,
    bandwidthMHz: 0.8,
    modulation: 'SPECTRAL_WATERFALL',
    source: 'Blacksite Orbital Satellite',
    clueHint: 'Harmonic data carrier at 415.0 MHz. Look directly at the WATERFALL SPECTROGRAM display to read the visual text encoded in the audio frequencies.',
    solutionKey: 'Project Codename',
    expectedInput: 'ICARUS'
  }
];
