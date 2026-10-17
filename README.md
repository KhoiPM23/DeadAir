# DeadAir — Offline Signal Intercept & Decoding

An atmospheric browser mystery game where the player operates an analog SIGINT receiver console, investigates anomalous transmissions across classified VHF/UHF bands, manipulates audio DSP filters, and decodes cryptic evidence to uncover a military blacksite incident.

![DeadAir](https://img.shields.io/badge/License-MIT-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-8%2F8%20Passing-brightgreen.svg)
![Bundle](https://img.shields.io/badge/Bundle-8.09%20kB%20gzip-informational.svg)

---

## 📻 Game Premise & Narrative

You are a signal intercept analyst stationed at Sub-Arctic Listening Post 47. An abandoned military blacksite has suddenly broken silent guard frequencies. By tuning carrier frequencies, filtering out electrical jamming noise, analyzing spectrograms, and consulting field dossiers, you reconstruct the incident timeline and authorize an extraction helicopter.

### 4 Authored Signal Investigation Puzzles:

1. **Channel 1 (124.5 MHz — Automated Distress Beacon)**
   - *Modulation*: `AM_MORSE`
   - *Investigation*: An emergency distress carrier broadcasts rhythmic Morse code (`... --- ... / -... .- ... . / . -.-. .... ---`).
   - *Deduction*: Identify the transmitting outpost designation (**BASE ECHO**). Includes in-game International Morse reference chart.

2. **Channel 2 (285.4 MHz — Frequency-Jammed Cipher)**
   - *Modulation*: `CIPHER_TONES` (DTMF Dual-Tone Multi-Frequency)
   - *Investigation*: Heavy high-pitch electronic jamming noise (>2500 Hz) masks an encrypted 4-digit sequence.
   - *Signal Processing*: Switch the receiver filter to **LOW-PASS** and dial the Cutoff slider down to ~800 Hz to eliminate the hiss, exposing the 4 dual-tone telephone pulses (**7391**).

3. **Channel 3 (340.8 MHz — Resonant Notch Carrier)**
   - *Modulation*: `NOTCH_BEACON`
   - *Investigation*: A deafening continuous 1000 Hz acoustic feedback loop drowns out a subterranean bunker broadcast.
   - *Signal Processing*: Engage the **NOTCH FILTER** and adjust the Cutoff frequency to 1000 Hz to cancel the resonant squeal, revealing the clearance code word (**NEXUS**).

4. **Channel 4 (415.0 MHz — Spectral Waterfall Telemetry)**
   - *Modulation*: `SPECTRAL_WATERFALL` (Audio Steganography)
   - *Investigation*: A high-altitude orbital harmonic sweep paints visual letterforms across the real-time thermal waterfall spectrogram.
   - *Deduction*: Read the six glowing capital letters scrolling down the CRT display (**ICARUS**).

---

## 🕹️ Controls & Receiver Operations

| Input | Control | Function |
| :--- | :--- | :--- |
| `Click` | **SYSTEM POWER** | Powers up receiver circuits and initializes browser Web Audio |
| `←` / `→` | **Fine Frequency Tuning** | Steps carrier frequency by ±0.1 MHz |
| `↑` / `↓` | **Coarse Frequency Tuning** | Steps carrier frequency by ±1.0 MHz |
| `Space` | **Quick Carrier Lock** | Snaps receiver to nearest detected mystery carrier |
| `Buttons` | **Step Buttons** | Direct frequency increments (`-10`, `-1`, `-0.1`, `+0.1`, `+1`, `+10`) |
| `Sliders` | **Band & Cutoff Sliders** | Continuous sweep across VHF/UHF band (80–500 MHz) and filter cutoff (200–5000 Hz) |
| `Buttons` | **Filter Modes** | Select `ALL-PASS`, `LOW-PASS`, `NOTCH`, or `HIGH-PASS` BiquadFilter |
| `M` | **SFX Mute** | Mutes audio output without interrupting visual signal analysis |
| `P` / `Escape` | **Pause / Resume** | Suspends/resumes audio generation and CRT oscilloscope scan |
| `Button` | **MORSE REF** | Opens International Morse code lookup modal |
| `Button` | **REQUEST HINT** | Progressively unlocks graduated hints (1/3, 2/3, 3/3) per dossier card |

---

## 🛠️ Architecture & Audio DSP

- **Browser-Native Web Audio API**:
  - 100% offline, zero external audio asset dependencies.
  - Custom pink/brown noise generator synthesized in an `AudioBufferSourceNode`.
  - Dual sine and square oscillators for Morse beeps, DTMF pairs, and resonant feedback tones.
  - Real-time heterodyne whistling beat synthesis that drops to 0 Hz as carrier frequency is precisely centered.
- **Hardware-Accurate Biquad Filtering**:
  - Low-pass filter (de-hiss) for jamming suppression.
  - High-Q Notch filter for surgical cancellation of feedback tones.
- **CRT Phosphor Visualizer (60 FPS Canvas2D)**:
  - Real-time scrolling thermal waterfall spectrogram (amber/cyan colormap mapping frequency intensity).
  - Time-domain phosphor green oscilloscope with scanlines and dynamic persistence.
  - Analog VU signal strength meter (RSSI) and Signal-to-Noise Ratio (SNR dB).
- **Accessibility & Hearing-Impaired Support**:
  - Optical Carrier Pulse LED on the CRT display flashes in sync with Morse pulses and DTMF envelopes.
  - The entire game is 100% solvable with audio muted via visual oscilloscope waveforms, waterfall glyphs, and LED pulses.
- **Graduated Hint System**:
  - 3-tier progressive assistance per signal (Equipment guidance -> Filter technique -> Concrete deduction prompt) preventing players from being stuck while avoiding instant spoilers.

---

## 🧪 Testing & Verification

8 automated Vitest unit tests verifying carrier matching, SNR, Low-Pass and Notch filters, mute/volume, graduated hints, and victory conditions:

```bash
# Run Vitest test suite
npm test

# Build production bundle (only 8.09 kB gzip!)
npm run build

# Run local development server
npm run dev
```

---

## 📜 Asset Licenses & Attribution

- **Source Code**: MIT License.
- **Sound & DSP**: 100% procedural synthesized Web Audio API (zero third-party audio files).
- **Typography**: Share Tech Mono & VT323 (Google Fonts, SIL Open Font License).
