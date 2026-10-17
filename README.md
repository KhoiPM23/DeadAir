# DeadAir — Offline Signal Intercept & Decoding

An offline audio mystery deduction game built around interactive radio signal processing, heterodyne tuning, frequency analysis, and cryptographic deciphering.

![DeadAir](https://img.shields.io/badge/License-MIT-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-4%2F4%20Passing-brightgreen.svg)

---

## 📻 Game Concept & Premise

You are operating an analog SIGINT receiver console monitoring classified VHF/UHF bands. Three anomalous signals have been intercepted from an abandoned blacksite:

1. **Signal 1 (124.5 MHz — Emergency Distress)**: An automated Morse transmission transmitting an SOS distress signal from an isolated outpost.
2. **Signal 2 (285.4 MHz — High-Pitch Jammed Cipher)**: A 4-digit code transmission masked behind heavy high-frequency static noise. Requires switching to a **LOW-PASS** filter (~800 Hz) to eliminate the hiss and isolate the tone pairs.
3. **Signal 3 (415.0 MHz — Spectral Waterfall Telemetry)**: An orbital telemetry carrier. By observing the real-time **Waterfall Spectrogram**, visual glyphs can be directly read as they scroll across the frequency spectrum.

---

## 🕹️ Controls & Receiver Operations

| Control | Function |
| :--- | :--- |
| **SYSTEM POWER** | Powers up the analog receiver circuits and initializes Web Audio |
| **Frequency Slider / Step Buttons** | Scans from 80.0 MHz to 500.0 MHz with fine ±0.1 MHz adjustments |
| **Filter Modes** | Toggle between `ALL-PASS`, `LOW-PASS`, `HIGH-PASS`, and `NOTCH` |
| **Filter Cutoff Slider** | Adjusts the active BiquadFilter cutoff frequency (200 Hz - 5000 Hz) |
| **Squelch Slider** | Mutes background static when no carrier frequency is tuned |
| **Morse Reference** | Opens in-game international Morse code translation chart |
| **Dossier Entry Verification** | Input deduced answers to decrypt each frequency and unlock extraction coordinates |

---

## 🛠️ Architecture & Audio DSP

- **Browser-Native Web Audio API**: 100% offline signal generation using `AudioContext`, custom looping procedural pink-noise buffer, dual sine oscillators, and real-time heterodyne whistling beat synthesis.
- **Biquad Filtering**: Hardware-accurate lowpass, highpass, and notch DSP filters shaping audio frequencies.
- **CRT Phosphor Visualizer**: 60 FPS HTML5 Canvas2D rendering:
  - Scrolling Waterfall Spectrogram (Thermal amber/cyan colormap mapping frequency intensity vs time).
  - Time-Domain Phosphor Green Oscilloscope with scanlines and VU signal strength meter.
- **Zero Cloud / AI Dependencies**: Runs completely offline in any standard browser.

---

## 🧪 Testing & Verification

Run the Vitest test suite:
```bash
npm test
```

Build production bundle:
```bash
npm run build
```

Run local dev server:
```bash
npm run dev
```

---

## 📜 License
MIT License.
