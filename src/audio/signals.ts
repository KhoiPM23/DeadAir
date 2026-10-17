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
    source: 'Arctic Outpost Beacon Alpha',
    morseText: 'SOS BASE ECHO',
    clueHint: 'Distress carrier intercepted at 124.5 MHz. Decipher the Morse sequence (... --- ... / -... .- ... . / . -.-. .... ---). Which outpost is transmitting?',
    hints: [
      'Carrier sounds like pulsed telemetry near 124 MHz. Check the International Morse Reference button above.',
      'The message starts with classic distress (... --- ...) followed by an outpost designation name.',
      'The letters after SOS are: -... (B), .- (A), ... (S), . (E) followed by . (E), -.-. (C), .... (H), --- (O).'
    ],
    solutionKey: 'Distress Origin Outpost',
    expectedInput: 'BASE ECHO'
  },
  {
    id: 'signal-omega',
    name: 'CHANNEL 2: FREQUENCY-JAMMED CIPHER',
    frequencyMHz: 285.4,
    bandwidthMHz: 0.7,
    modulation: 'CIPHER_TONES',
    source: 'Encrypted Relay Node 07',
    clueHint: 'Heavy high-pitch electrical interference at 285.4 MHz. Switch Filter to LOW-PASS (Cutoff ~ 800Hz) to strip away the hiss and identify the 4-digit code.',
    hints: [
      'Hidden dual-frequency audio tones are buried under high-pitch white noise static (>2500 Hz).',
      'Select LOW-PASS filter and adjust the Cutoff slider down to ~800 Hz to cut off the screeching hiss.',
      'With the high frequencies muted, listen or watch the 4 rhythmic DTMF dual-tone telephone pulses: 7, 3, 9, 1.'
    ],
    solutionKey: 'Relay Bypass Passcode',
    expectedInput: '7391'
  },
  {
    id: 'signal-nexus',
    name: 'CHANNEL 3: RESONANT NOTCH CARRIER',
    frequencyMHz: 340.8,
    bandwidthMHz: 0.8,
    modulation: 'NOTCH_BEACON',
    source: 'Subterranean Bunker Vault',
    clueHint: 'A piercing 1000 Hz acoustic feedback loop masks the bunker transmission. Engage the NOTCH FILTER at 1000 Hz to null the resonant squeal.',
    hints: [
      'A deafening continuous 1000 Hz tone is drowning out the underlying sub-carrier data broadcast.',
      'Click the NOTCH FILTER button and slide the Filter Cutoff slider directly to 1000 Hz.',
      'With the 1000 Hz spike carved out, the clean pulsed beacon reveals the secure clearance word: NEXUS.'
    ],
    solutionKey: 'Bunker Clearance Word',
    expectedInput: 'NEXUS',
    notchFrequencyHz: 1000
  },
  {
    id: 'signal-icarus',
    name: 'CHANNEL 4: SPECTRAL WATERFALL TELEMETRY',
    frequencyMHz: 415.0,
    bandwidthMHz: 0.8,
    modulation: 'SPECTRAL_WATERFALL',
    source: 'Blacksite Orbital Satellite',
    clueHint: 'Harmonic data carrier at 415.0 MHz. Look directly at the WATERFALL SPECTROGRAM display to read the visual text encoded in the audio frequencies.',
    hints: [
      'This transmission uses audio steganography: sound frequencies are modulated to paint visible shapes on a spectrograph.',
      'Look at the upper half of the CRT display where the amber waterfall scrolls downward in real time.',
      'Watch for glowing letterforms tracing out across the spectrum bins: I - C - A - R - U - S.'
    ],
    solutionKey: 'Project Codename',
    expectedInput: 'ICARUS'
  }
];
