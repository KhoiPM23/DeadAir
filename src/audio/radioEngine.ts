import { MYSTERY_SIGNALS } from './signals';
import { FilterType, MysterySignal, ReceiverParams, ReceptionMetrics } from './types';

export class RadioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private signalGain: GainNode | null = null;
  private signalOsc1: OscillatorNode | null = null;
  private signalOsc2: OscillatorNode | null = null;

  private heterodyneOsc: OscillatorNode | null = null;
  private heterodyneGain: GainNode | null = null;

  // Dedicated interference oscillator for the Notch puzzle
  private notchInterferenceOsc: OscillatorNode | null = null;
  private notchInterferenceGain: GainNode | null = null;

  private filterNode: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private params: ReceiverParams = {
    frequencyMHz: 100.0,
    filterType: 'ALL_PASS',
    filterCutoffHz: 1500,
    squelch: 0.1,
    volume: 0.8,
    isMuted: false,
    powerOn: false
  };

  private currentSequenceIndex = 0;
  private timerHandle: number | null = null;
  private isBlipActive = false;

  // Analog Tape Deck Subsystem
  private recorderNode: ScriptProcessorNode | null = null;
  private recordedSamples: Float32Array[] = [];
  private tapeAudioBuffer: AudioBuffer | null = null;
  private isRecordingTape: boolean = false;
  private isPlayingTape: boolean = false;
  private currentTapeSpeed: number = 1.0;
  private tapeSourceNode: AudioBufferSourceNode | null = null;
  private tapeRecordedDurationSec: number = 0;

  constructor() {

    // Audio context is initialized lazily upon user gesture to comply with browser autoplay policies
  }

  public initAudio(): boolean {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      const currentVol = this.params.isMuted ? 0 : this.params.volume;
      this.masterGain.gain.setValueAtTime(currentVol, this.ctx.currentTime);

      // Analyser for CRT / Waterfall spectrogram
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.75;

      // Primary Biquad Filter Node
      this.filterNode = this.ctx.createBiquadFilter();
      this.applyFilterSettings();

      // Output chain: Filter -> Analyser -> Master -> Speakers
      this.filterNode.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // 1. Static Noise Generator (Pink/Brown noise filter)
      const noiseBuffer = this.createWhiteNoiseBuffer(this.ctx);
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;
      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.noiseNode.connect(this.noiseGain);
      this.noiseGain.connect(this.filterNode);
      this.noiseNode.start();

      // 2. Heterodyne Beat Oscillator (Radio Whistle when off-center)
      this.heterodyneOsc = this.ctx.createOscillator();
      this.heterodyneOsc.type = 'sine';
      this.heterodyneGain = this.ctx.createGain();
      this.heterodyneGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.heterodyneOsc.connect(this.heterodyneGain);
      this.heterodyneGain.connect(this.filterNode);
      this.heterodyneOsc.start();

      // 3. Piercing 1000Hz Notch Interference Whine
      this.notchInterferenceOsc = this.ctx.createOscillator();
      this.notchInterferenceOsc.type = 'square';
      this.notchInterferenceOsc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.notchInterferenceGain = this.ctx.createGain();
      this.notchInterferenceGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.notchInterferenceOsc.connect(this.notchInterferenceGain);
      this.notchInterferenceGain.connect(this.filterNode);
      this.notchInterferenceOsc.start();

      // 4. Signal Audio Generators (Dual tone carrier)
      this.signalGain = this.ctx.createGain();
      this.signalGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.signalGain.connect(this.filterNode);

      this.signalOsc1 = this.ctx.createOscillator();
      this.signalOsc1.type = 'sine';
      this.signalOsc1.frequency.setValueAtTime(750, this.ctx.currentTime);
      this.signalOsc1.connect(this.signalGain);
      this.signalOsc1.start();

      this.signalOsc2 = this.ctx.createOscillator();
      this.signalOsc2.type = 'sine';
      this.signalOsc2.frequency.setValueAtTime(1209, this.ctx.currentTime);
      this.signalOsc2.connect(this.signalGain);
      this.signalOsc2.start();

      // Start modulation loop for pulsing signals
      this.startSignalModulationLoop();
      return true;
    } catch (err) {
      console.warn('Web Audio init failed:', err);
      return false;
    }
  }

  private createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  public setPower(power: boolean): void {
    this.params.powerOn = power;
    if (power) {
      this.initAudio();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    this.updateAudioLevels();
  }

  public setFrequency(freqMHz: number): void {
    this.params.frequencyMHz = Math.max(80.0, Math.min(520.0, parseFloat(freqMHz.toFixed(2))));
    this.updateAudioLevels();
  }


  public setFilterType(type: FilterType): void {
    this.params.filterType = type;
    this.applyFilterSettings();
    this.updateAudioLevels();
  }

  public setFilterCutoff(hz: number): void {
    this.params.filterCutoffHz = Math.max(100, Math.min(10000, hz));
    this.applyFilterSettings();
    this.updateAudioLevels();
  }

  public setSquelch(val: number): void {
    this.params.squelch = Math.max(0, Math.min(1, val));
    this.updateAudioLevels();
  }

  public setVolume(val: number): void {
    this.params.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.params.isMuted) {
      this.masterGain.gain.setValueAtTime(this.params.volume, this.ctx.currentTime);
    }
  }

  public setMute(muted: boolean): boolean {
    this.params.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.params.isMuted ? 0 : this.params.volume;
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
    return this.params.isMuted;
  }

  public isMuted(): boolean {
    return this.params.isMuted;
  }

  public getParams(): Readonly<ReceiverParams> {
    return this.params;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  private applyFilterSettings(): void {
    if (!this.filterNode || !this.ctx) return;

    switch (this.params.filterType) {
      case 'ALL_PASS':
        this.filterNode.type = 'allpass';
        break;
      case 'LOW_PASS':
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.setValueAtTime(this.params.filterCutoffHz, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);
        break;
      case 'HIGH_PASS':
        this.filterNode.type = 'highpass';
        this.filterNode.frequency.setValueAtTime(this.params.filterCutoffHz, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime);
        break;
      case 'NOTCH':
        this.filterNode.type = 'notch';
        this.filterNode.frequency.setValueAtTime(this.params.filterCutoffHz, this.ctx.currentTime);
        this.filterNode.Q.setValueAtTime(7.0, this.ctx.currentTime);
        break;
    }
  }

  public getReceptionMetrics(): ReceptionMetrics {
    const freq = this.params.frequencyMHz;
    let closestSignal: MysterySignal | null = null;
    let minDistance = Infinity;

    for (const sig of MYSTERY_SIGNALS) {
      const dist = Math.abs(freq - sig.frequencyMHz);
      if (dist < sig.bandwidthMHz && dist < minDistance) {
        minDistance = dist;
        closestSignal = sig;
      }
    }

    if (!closestSignal || minDistance >= closestSignal.bandwidthMHz) {
      return {
        currentFrequencyMHz: freq,
        tunedSignal: null,
        signalStrength: 0,
        signalToNoiseRatio: 0,
        heterodynePitchHz: 0,
        isFilterOptimal: false,
        isSignalBlipActive: false
      };
    }

    // Proximity factor (1 = dead center, 0 = edge of band)
    const factor = Math.max(0, 1 - minDistance / closestSignal.bandwidthMHz);
    const strength = Math.pow(factor, 1.8);
    const snr = strength * 30; // 0 to 30 dB

    // Whistling beat frequency drops to 0 as you dial in exactly
    const heterodyneHz = minDistance > 0.02 ? Math.min(2200, minDistance * 1800 + 100) : 0;

    // Filter verification rules
    let isFilterOptimal = true;
    if (closestSignal.id === 'signal-omega') {
      isFilterOptimal = this.params.filterType === 'LOW_PASS' && this.params.filterCutoffHz < 1200;
    } else if (closestSignal.id === 'signal-nexus') {
      isFilterOptimal = this.params.filterType === 'NOTCH' && Math.abs(this.params.filterCutoffHz - 1000) <= 150;
    }

    return {
      currentFrequencyMHz: freq,
      tunedSignal: closestSignal,
      signalStrength: strength,
      signalToNoiseRatio: Math.round(snr),
      heterodynePitchHz: Math.round(heterodyneHz),
      isFilterOptimal,
      isSignalBlipActive: this.isBlipActive && strength > 0.25
    };
  }

  private updateAudioLevels(): void {
    if (!this.ctx || !this.params.powerOn) {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return;
    }

    const metrics = this.getReceptionMetrics();
    const now = this.ctx.currentTime;

    const currentVol = this.params.isMuted ? 0 : this.params.volume;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(currentVol, now);
    }

    // Squelch muting logic
    const isMutedBySquelch = metrics.signalStrength < this.params.squelch && !metrics.tunedSignal;

    // Static noise level
    if (this.noiseGain) {
      const noiseVol = isMutedBySquelch ? 0.005 : Math.max(0.04, (1 - metrics.signalStrength * 0.85) * 0.25);
      this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.05);
    }

    // Heterodyne whistle level
    if (this.heterodyneGain && this.heterodyneOsc) {
      if (metrics.heterodynePitchHz > 0 && metrics.signalStrength > 0.15) {
        this.heterodyneOsc.frequency.setTargetAtTime(metrics.heterodynePitchHz, now, 0.04);
        const whistleVol = (1 - metrics.signalStrength) * 0.18;
        this.heterodyneGain.gain.setTargetAtTime(whistleVol, now, 0.05);
      } else {
        this.heterodyneGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }

    // Notch 1000Hz interference squeal (active on signal-nexus unless notch filtered)
    if (this.notchInterferenceGain && this.notchInterferenceOsc) {
      if (metrics.tunedSignal?.id === 'signal-nexus' && metrics.signalStrength > 0.2) {
        const interferenceVol = metrics.isFilterOptimal ? 0.001 : 0.28;
        this.notchInterferenceGain.gain.setTargetAtTime(interferenceVol, now, 0.05);
      } else {
        this.notchInterferenceGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }
  }

  private startSignalModulationLoop(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);

    this.timerHandle = window.setInterval(() => {
      if (!this.ctx || !this.params.powerOn) return;

      const metrics = this.getReceptionMetrics();
      if (!metrics.tunedSignal || metrics.signalStrength < 0.25) {
        this.isBlipActive = false;
        if (this.signalGain) this.signalGain.gain.setValueAtTime(0, this.ctx.currentTime);
        return;
      }

      const signal = metrics.tunedSignal;
      this.currentSequenceIndex++;

      if (signal.id === 'signal-blackout') {
        // High-speed compressed burst Morse sequence for VOID: ...- --- .. -..
        const burstSequence = [
          1,0,1,0,1,0,2, 0,0,  // V
          2,0,2,0,2,     0,0,  // O
          1,0,1,         0,0,  // I
          2,0,1,0,1,     0,0,0,0 // D
        ];
        const step = burstSequence[this.currentSequenceIndex % burstSequence.length];
        this.isBlipActive = step > 0;
        const gain = step > 0 ? metrics.signalStrength * 0.32 : 0;

        if (this.signalOsc1 && this.signalGain) {
          this.signalOsc1.frequency.setValueAtTime(1050, this.ctx.currentTime);
          this.signalGain.gain.setValueAtTime(gain, this.ctx.currentTime);
        }
      } else if (signal.modulation === 'AM_MORSE') {
        // Morse sequence for "SOS BASE ECHO"
        const morseSequence = [
          1,0,1,0,1, 0,0, 2,0,2,0,2, 0,0, 1,0,1,0,1, // S O S
          0,0,0,
          2,0,1,0,1,0,1, 0,0, 1,0,2, 0,0, 1,0,1,0,1, 0,0, 1, // BASE
          0,0,0,
          1, 0,0, 2,0,1,0,2,0,1, 0,0, 1,0,1,0,1,0,1, 0,0, 2,0,2,0,2 // ECHO
        ];

        const step = morseSequence[this.currentSequenceIndex % morseSequence.length];
        this.isBlipActive = step > 0;
        const gain = step > 0 ? metrics.signalStrength * 0.28 : 0;

        if (this.signalOsc1 && this.signalGain) {
          this.signalOsc1.frequency.setValueAtTime(800, this.ctx.currentTime);
          this.signalGain.gain.setValueAtTime(gain, this.ctx.currentTime);
        }
      } else if (signal.modulation === 'CIPHER_TONES') {
        // 4 dual tones representing cipher 7 3 9 1
        const dtmfTones = [
          [852, 1209], // 7
          [697, 1477], // 3
          [852, 1477], // 9
          [697, 1209], // 1
          [0, 0]       // pause
        ];
        const pair = dtmfTones[this.currentSequenceIndex % dtmfTones.length];
        this.isBlipActive = pair[0] > 0;

        if (this.signalOsc1 && this.signalOsc2 && this.signalGain) {
          if (pair[0] > 0) {
            this.signalOsc1.frequency.setValueAtTime(pair[0], this.ctx.currentTime);
            this.signalOsc2.frequency.setValueAtTime(pair[1], this.ctx.currentTime);
            this.signalGain.gain.setValueAtTime(metrics.signalStrength * 0.22, this.ctx.currentTime);
          } else {
            this.signalGain.gain.setValueAtTime(0, this.ctx.currentTime);
          }
        }
      } else if (signal.modulation === 'NOTCH_BEACON') {
        // Deep pulsed tone for "NEXUS"
        const beaconPattern = [440, 0, 554, 0, 659, 0, 880, 0];
        const freq = beaconPattern[this.currentSequenceIndex % beaconPattern.length];
        this.isBlipActive = freq > 0;

        if (this.signalOsc1 && this.signalGain) {
          if (freq > 0) {
            this.signalOsc1.frequency.setValueAtTime(freq, this.ctx.currentTime);
            this.signalGain.gain.setValueAtTime(metrics.signalStrength * 0.25, this.ctx.currentTime);
          } else {
            this.signalGain.gain.setValueAtTime(0, this.ctx.currentTime);
          }
        }
      } else if (signal.modulation === 'SPECTRAL_WATERFALL') {
        // High altitude harmonic sweep that creates visible bands on waterfall
        const harmonicSteps = [520, 680, 840, 1060, 1280, 1500, 1720];
        const freq1 = harmonicSteps[this.currentSequenceIndex % harmonicSteps.length];
        const freq2 = harmonicSteps[(this.currentSequenceIndex + 2) % harmonicSteps.length];
        this.isBlipActive = true;

        if (this.signalOsc1 && this.signalOsc2 && this.signalGain) {
          this.signalOsc1.frequency.setValueAtTime(freq1, this.ctx.currentTime);
          this.signalOsc2.frequency.setValueAtTime(freq2, this.ctx.currentTime);
          this.signalGain.gain.setValueAtTime(metrics.signalStrength * 0.2, this.ctx.currentTime);
        }
      }
    }, 140);
  }

  // --- Analog Tape Deck Subsystem Methods ---
  public startTapeRecording(): boolean {
    if (!this.ctx || this.isRecordingTape) return false;
    this.stopTape();
    this.isRecordingTape = true;
    this.recordedSamples = [];

    try {
      this.recorderNode = this.ctx.createScriptProcessor(4096, 1, 1);
      this.recorderNode.onaudioprocess = (e) => {
        if (!this.isRecordingTape) return;
        const input = e.inputBuffer.getChannelData(0);
        this.recordedSamples.push(new Float32Array(input));
      };
      if (this.filterNode) {
        this.filterNode.connect(this.recorderNode);
        this.recorderNode.connect(this.ctx.destination);
      }
      return true;
    } catch (err) {
      console.warn('Tape recording start failed:', err);
      this.isRecordingTape = false;
      return false;
    }
  }

  public stopTapeRecording(): number {
    if (!this.isRecordingTape) return this.tapeRecordedDurationSec;
    this.isRecordingTape = false;

    if (this.recorderNode) {
      try {
        this.recorderNode.disconnect();
      } catch {}
      this.recorderNode = null;
    }

    if (this.ctx && this.recordedSamples.length > 0) {
      const totalLen = this.recordedSamples.reduce((acc, chunk) => acc + chunk.length, 0);
      this.tapeAudioBuffer = this.ctx.createBuffer(1, totalLen, this.ctx.sampleRate);
      const outData = this.tapeAudioBuffer.getChannelData(0);
      let offset = 0;
      for (const chunk of this.recordedSamples) {
        outData.set(chunk, offset);
        offset += chunk.length;
      }
      this.tapeRecordedDurationSec = totalLen / this.ctx.sampleRate;
    }
    return this.tapeRecordedDurationSec;
  }

  public playTape(speed = 1.0): boolean {
    if (!this.ctx || !this.tapeAudioBuffer) return false;
    this.stopTape();
    this.currentTapeSpeed = speed;

    try {
      this.tapeSourceNode = this.ctx.createBufferSource();
      this.tapeSourceNode.buffer = this.tapeAudioBuffer;
      this.tapeSourceNode.playbackRate.setValueAtTime(speed, this.ctx.currentTime);
      this.tapeSourceNode.connect(this.masterGain || this.ctx.destination);
      this.isPlayingTape = true;
      this.tapeSourceNode.onended = () => {
        this.isPlayingTape = false;
      };
      this.tapeSourceNode.start();
      return true;
    } catch (err) {
      console.warn('Tape play failed:', err);
      this.isPlayingTape = false;
      return false;
    }
  }

  public stopTape(): void {
    if (this.tapeSourceNode) {
      try {
        this.tapeSourceNode.stop();
        this.tapeSourceNode.disconnect();
      } catch {}
      this.tapeSourceNode = null;
    }
    this.isPlayingTape = false;
  }

  public getTapeStatus(): {
    isRecording: boolean;
    isPlaying: boolean;
    durationSec: number;
    speed: number;
    hasTape: boolean;
  } {
    return {
      isRecording: this.isRecordingTape,
      isPlaying: this.isPlayingTape,
      durationSec: Math.round(this.tapeRecordedDurationSec * 10) / 10,
      speed: this.currentTapeSpeed,
      hasTape: this.tapeAudioBuffer !== null
    };
  }

  public destroy(): void {
    this.stopTape();
    if (this.timerHandle) clearInterval(this.timerHandle);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

