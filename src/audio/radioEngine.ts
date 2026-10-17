import { MYSTERY_SIGNALS } from './signals';
import { MysterySignal, ReceiverParams, ReceptionMetrics } from './types';

export class RadioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private signalGain: GainNode | null = null;
  private signalOsc1: OscillatorNode | null = null;
  private signalOsc2: OscillatorNode | null = null;

  private heterodyneOsc: OscillatorNode | null = null;
  private heterodyneGain: GainNode | null = null;

  private filterNode: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private params: ReceiverParams = {
    frequencyMHz: 100.0,
    filterType: 'ALL_PASS',
    filterCutoffHz: 1500,
    squelch: 0.1,
    volume: 0.8,
    powerOn: false
  };

  private currentSequenceIndex = 0;
  private timerHandle: number | null = null;

  constructor() {
    // Lazy initialize on user gesture to obey autoplay policy
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
      this.masterGain.gain.setValueAtTime(this.params.volume, this.ctx.currentTime);

      // Analyser for CRT / Waterfall
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.75;

      // Filter Node
      this.filterNode = this.ctx.createBiquadFilter();
      this.applyFilterSettings();

      // Wiring output chain: Filter -> Analyser -> Master -> Destination
      this.filterNode.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // 1. Static Noise Generator
      const noiseBuffer = this.createWhiteNoiseBuffer(this.ctx);
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;
      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.noiseNode.connect(this.noiseGain);
      this.noiseGain.connect(this.filterNode);
      this.noiseNode.start();

      // 2. Heterodyne Beat Oscillator (Radio Whistle)
      this.heterodyneOsc = this.ctx.createOscillator();
      this.heterodyneOsc.type = 'sine';
      this.heterodyneGain = this.ctx.createGain();
      this.heterodyneGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.heterodyneOsc.connect(this.heterodyneGain);
      this.heterodyneGain.connect(this.filterNode);
      this.heterodyneOsc.start();

      // 3. Signal Audio Generators
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

      // Start sequence interval for signal modulation
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
      // Pink/Brownish radio static filter for authentic analog hiss
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
    this.params.frequencyMHz = Math.max(80.0, Math.min(500.0, freqMHz));
    this.updateAudioLevels();
  }

  public setFilterType(type: ReceiverParams['filterType']): void {
    this.params.filterType = type;
    this.applyFilterSettings();
  }

  public setFilterCutoff(hz: number): void {
    this.params.filterCutoffHz = Math.max(100, Math.min(10000, hz));
    this.applyFilterSettings();
  }

  public setSquelch(val: number): void {
    this.params.squelch = Math.max(0, Math.min(1, val));
    this.updateAudioLevels();
  }

  public setVolume(val: number): void {
    this.params.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.params.volume, this.ctx.currentTime);
    }
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
        this.filterNode.Q.setValueAtTime(6.0, this.ctx.currentTime);
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
        isFilterOptimal: false
      };
    }

    // Proximity factor (1 = dead center, 0 = edge of band)
    const factor = Math.max(0, 1 - minDistance / closestSignal.bandwidthMHz);
    const strength = Math.pow(factor, 1.8);
    const snr = strength * 30; // 0 to 30 dB

    // Whistling beat frequency drops to 0 as you dial in exactly
    const heterodyneHz = minDistance > 0.02 ? Math.min(2200, minDistance * 1800 + 100) : 0;

    // Filter check: signal-omega requires lowpass; others are fine on allpass
    let isFilterOptimal = true;
    if (closestSignal.id === 'signal-omega') {
      isFilterOptimal = this.params.filterType === 'LOW_PASS' && this.params.filterCutoffHz < 1200;
    }

    return {
      currentFrequencyMHz: freq,
      tunedSignal: closestSignal,
      signalStrength: strength,
      signalToNoiseRatio: Math.round(snr),
      heterodynePitchHz: Math.round(heterodyneHz),
      isFilterOptimal
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

    // Squelch muting logic
    const isMutedBySquelch = metrics.signalStrength < this.params.squelch && !metrics.tunedSignal;

    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.params.volume, now);
    }

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
  }

  private startSignalModulationLoop(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);

    this.timerHandle = window.setInterval(() => {
      if (!this.ctx || !this.params.powerOn) return;

      const metrics = this.getReceptionMetrics();
      if (!metrics.tunedSignal || metrics.signalStrength < 0.25) {
        if (this.signalGain) this.signalGain.gain.setValueAtTime(0, this.ctx.currentTime);
        return;
      }

      const signal = metrics.tunedSignal;
      this.currentSequenceIndex++;

      if (signal.modulation === 'AM_MORSE') {
        // Morse timing pattern for "SOS BASE ECHO"
        // 1 = beep (dot), 2 = dash, 0 = space
        const morseSequence = [
          1,0,1,0,1, 0,0, 2,0,2,0,2, 0,0, 1,0,1,0,1, // S O S
          0,0,0,
          2,0,1,0,1,0,1, 0,0, 1,0,2, 0,0, 1,0,1,0,1, 0,0, 1, // BASE
          0,0,0,
          1, 0,0, 2,0,1,0,2,0,1, 0,0, 1,0,1,0,1,0,1, 0,0, 2,0,2,0,2 // ECHO
        ];

        const step = morseSequence[this.currentSequenceIndex % morseSequence.length];
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

        if (this.signalOsc1 && this.signalOsc2 && this.signalGain) {
          if (pair[0] > 0) {
            this.signalOsc1.frequency.setValueAtTime(pair[0], this.ctx.currentTime);
            this.signalOsc2.frequency.setValueAtTime(pair[1], this.ctx.currentTime);
            this.signalGain.gain.setValueAtTime(metrics.signalStrength * 0.22, this.ctx.currentTime);
          } else {
            this.signalGain.gain.setValueAtTime(0, this.ctx.currentTime);
          }
        }
      } else if (signal.modulation === 'SPECTRAL_WATERFALL') {
        // High altitude harmonic sweep that creates visible bands on waterfall
        const harmonicSteps = [520, 680, 840, 1060, 1280, 1500, 1720];
        const freq1 = harmonicSteps[this.currentSequenceIndex % harmonicSteps.length];
        const freq2 = harmonicSteps[(this.currentSequenceIndex + 2) % harmonicSteps.length];

        if (this.signalOsc1 && this.signalOsc2 && this.signalGain) {
          this.signalOsc1.frequency.setValueAtTime(freq1, this.ctx.currentTime);
          this.signalOsc2.frequency.setValueAtTime(freq2, this.ctx.currentTime);
          this.signalGain.gain.setValueAtTime(metrics.signalStrength * 0.2, this.ctx.currentTime);
        }
      }
    }, 140);
  }

  public destroy(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
