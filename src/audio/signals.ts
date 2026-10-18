import { MysterySignal, StationLogEntry } from './types';

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
    source: 'Weather Station Echo-1 (St. Matthew Island)',
    coordinates: "60°24'N, 172°42'W (Bering Sea Outpost)",
    interceptDate: '14 OCT 1983 — 02:14 UTC',
    classification: 'SECRET // NOFORN',
    declassifiedCable: 'TELEMETRY INTERCEPT 83-A1: Emergency transmitter activation confirmed from Base Echo. Station personnel reported localized aurora borealis at ground level followed by simultaneous failure of all diesel generators. Last voice transmission recorded anomalous harmonic whistling on standard HF guard.',
    pinboardX: 18,
    pinboardY: 28,
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
    source: 'Soviet Submarine K-429 (Sub-Surface Relay)',
    coordinates: "51°18'N, 159°40'E (Kuril-Kamchatka Trench)",
    interceptDate: '15 OCT 1983 — 05:49 UTC',
    classification: 'TOP SECRET // COMINT',
    declassifiedCable: 'ACOUSTIC INTERCEPT 83-B7: Soviet Submarine K-429 transmitted encrypted DTMF bypass sequence 7-3-9-1 before initiating emergency dive to 320 meters. Sonar arrays recorded erratic underwater magnetic pulses converging toward the Kuril trench.',
    pinboardX: 42,
    pinboardY: 62,
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
    source: 'NORAD Subterranean Command (Mount Cheyenne)',
    coordinates: "38°44'N, 104°50'W (Deep Granite Bunker Vault)",
    interceptDate: '16 OCT 1983 — 11:03 UTC',
    classification: 'TOP SECRET // DEFCON INTERCEPT',
    declassifiedCable: 'SECURE BURST TRANSCRIPT: Automated quantum relay handshake accepted. Password verification confirmed: NEXUS. Strategic Air Command ordered all early-warning radar arrays to filter out ionospheric anomalies designated "PHANTOM SWARM".',
    pinboardX: 66,
    pinboardY: 26,
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
    source: 'DoD Orbital Reconnaissance Satellite 82-09',
    coordinates: 'Low Earth Orbit (Polar Inclination 82°)',
    interceptDate: '17 OCT 1983 — 19:35 UTC',
    classification: 'COSMIC TOP SECRET // STEG-09',
    declassifiedCable: 'SATELLITE DOWNLINK TELEMETRY: Project ICARUS recon bird intercepted an acoustic spectral signature echoing across VHF bands. Steganographic audio analysis reveals deliberate geometric glyphs embedded in the carrier wave. The signal did not originate from Earth.',
    pinboardX: 38,
    pinboardY: 82,
    clueHint: 'Harmonic data carrier at 415.0 MHz. Look directly at the WATERFALL SPECTROGRAM display to read the visual text encoded in the audio frequencies.',
    hints: [
      'This transmission uses audio steganography: sound frequencies are modulated to paint visible shapes on a spectrograph.',
      'Look at the upper half of the CRT display where the amber waterfall scrolls downward in real time.',
      'Watch for glowing letterforms tracing out across the spectrum bins: I - C - A - R - U - S.'
    ],
    solutionKey: 'Project Codename',
    expectedInput: 'ICARUS'
  },
  {
    id: 'signal-blackout',
    name: 'CHANNEL 5: CLASSIFIED TAPE-BURST NUMBERS STATION',
    frequencyMHz: 502.4,
    bandwidthMHz: 0.8,
    modulation: 'AM_MORSE',
    source: 'Phantom Trans-Polar Transmitter "GORKY-9"',
    coordinates: 'UNKNOWN // High-Latitude Ionospheric Mirror',
    interceptDate: '18 OCT 1983 — 03:00 UTC',
    classification: 'EYES ONLY // OPERATION AURA FINALE',
    declassifiedCable: 'NUMBERS STATION TRANSMISSION "GORKY-9": High-speed 4x tape burst decrypted as VOID. All five interception nodes correlate to an atmospheric resonance phenomenon occurring every 33 years. Whatever entered the upper atmosphere has begun transmitting our own ciphers back to us.',
    pinboardX: 84,
    pinboardY: 60,
    morseText: 'VOID',
    clueHint: 'A rapid high-speed burst broadcast intercepted at 502.4 MHz. Use the ANALOG TAPE DECK to RECORD the signal, then playback at 0.25x SLOW SPEED to decipher the 4-letter NATO callsign.',
    hints: [
      'The transmission is broadcast at 4x normal human speed, sounding like a high-speed chirp near 502.4 MHz.',
      'Press RECORD [REC] on the tape deck while tuned to 502.4 MHz to capture the transmission into the audio tape buffer.',
      'Switch playback speed to 0.25x (SLOW) to clearly hear the 4 distinct Morse letters: ...- (V), --- (O), .. (I), -.. (D) = VOID.'
    ],
    solutionKey: 'Phantom Callsign',
    expectedInput: 'VOID'
  }
];

export const STATION_LOGS: StationLogEntry[] = [
  {
    id: 'log-01',
    date: '03 OCT 1983 — 23:45 UTC',
    author: 'Specialist Hayes, Radio Watch Alpha',
    callsign: 'ECHO-4-ALPHA',
    clearance: 'CONFIDENTIAL',
    title: 'LOG ENTRY #182: UNUSUAL DRIFT ON HF EMERGENCY GUARD',
    content: 'Routine watch turnover with Sgt. Novak. Noted anomalous carrier modulation around 124.5 MHz. Signal displays strict Morse cadence SOS BASE ECHO, but automated logs confirm Weather Outpost Echo on St. Matthew Island was shuttered two years ago. Weather instruments show a sudden 14-millibar barometric plunge.',
    targetFrequencyMHz: 124.5
  },
  {
    id: 'log-02',
    date: '07 OCT 1983 — 04:15 UTC',
    author: 'Staff Sergeant Novak, Lead SIGINT',
    callsign: 'ECHO-4-LEAD',
    clearance: 'SECRET // NOFORN',
    title: 'LOG ENTRY #186: SOVIET TELEMETRY & KURIL CAVITATION',
    content: 'Underwater hydrophone array intercepted heavy cavitation signatures from the Kuril-Kamchatka Trench. Minutes later, a 285.4 MHz carrier started transmitting DTMF dual-tone bursts buried under heavy intentional noise jamming. Filtered through the audio oscilloscope, it sounds like an automated missile submarine bypass authorization.',
    targetFrequencyMHz: 285.4
  },
  {
    id: 'log-03',
    date: '11 OCT 1983 — 14:02 UTC',
    author: 'Specialist Hayes, Radio Watch Alpha',
    callsign: 'ECHO-4-ALPHA',
    clearance: 'TOP SECRET // FLASH',
    title: 'LOG ENTRY #191: FLASH CABLE FROM CHEYENNE MOUNTAIN',
    content: 'Priority teletype arrived via cryptographic line: "Station Echo-4 is ordered to disregard 1000 Hz acoustic resonance on 340.8 MHz. Do not apply notch filtration. Maintain baseline surveillance." Who are they trying to deceive? The notch filter clearly reveals an unauthorized handshake broadcast.',
    targetFrequencyMHz: 340.8
  },
  {
    id: 'log-04',
    date: '15 OCT 1983 — 18:20 UTC',
    author: 'Specialist Miller, Night Interception',
    callsign: 'ECHO-4-NIGHT',
    clearance: 'RESTRICTED',
    title: 'LOG ENTRY #194: THE ICARUS PHOSPHOR WATERFALL',
    content: 'Connected the VHF tuner to the CRT spectrograph waterfall at 415.0 MHz. As the amber scanlines rolled down the screen, bright glowing letters formed on the CRT: I-C-A-R-U-S. Audio steganography embedded in an orbital telemetry feed. Project ICARUS was never an orbital weather satellite. It was tracking something entering the stratosphere.',
    targetFrequencyMHz: 415.0
  },
  {
    id: 'log-05',
    date: '18 OCT 1983 — 02:40 UTC',
    author: 'Staff Sergeant Novak, Lead SIGINT',
    callsign: 'ECHO-4-LEAD',
    clearance: 'EYES ONLY // DEFCON 2',
    title: 'LOG ENTRY #199: GORKY-9 BURST & EVACUATION WARNING',
    content: 'High-speed 4x tape burst detected on 502.4 MHz. The tape deck slowed playback to 0.25x reveals the NATO callsign VOID. All five signals form an exact geometric pentagram over the North Pacific ionosphere. Whatever is up there, it has breached the listening grid. If you are reading this log, verify all evidence cables and request immediate emergency extraction.',
    targetFrequencyMHz: 502.4
  }
];

