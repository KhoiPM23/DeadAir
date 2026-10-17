import { ReceptionMetrics } from '../audio/types';

export interface TapeStatusInfo {
  isRecording: boolean;
  isPlaying: boolean;
  durationSec: number;
  speed: number;
  hasTape: boolean;
}

export type PhosphorTheme = 'GREEN' | 'AMBER' | 'CYAN' | 'SILVER';

export class OscilloscopeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private waterfallCanvas: HTMLCanvasElement;
  private waterfallCtx: CanvasRenderingContext2D;
  private theme: PhosphorTheme = 'GREEN';

  private timeData: Uint8Array<ArrayBuffer>;
  private freqData: Uint8Array<ArrayBuffer>;

  // Pattern matrix for rendering hidden "ICARUS" glyphs on waterfall
  private icarusColIndex: number = 0;
  private icarusGlyphs: number[][] = [
    // I
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0],
    // C
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,0,0,0,0,1],
    [0,0,0,0,0,0,0],
    // A
    [0,1,1,1,1,1,1],
    [1,0,0,1,0,0,0],
    [0,1,1,1,1,1,1],
    [0,0,0,0,0,0,0],
    // R
    [1,1,1,1,1,1,1],
    [1,0,0,1,0,0,0],
    [0,1,1,0,1,1,1],
    [0,0,0,0,0,0,0],
    // U
    [1,1,1,1,1,1,0],
    [0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0],
    // S
    [1,0,0,1,1,1,1],
    [1,0,1,0,0,0,1],
    [1,1,1,1,0,0,1],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
  ];

  // Analog VU meter physics state
  private needlePos: number = 0;
  private needleVelocity: number = 0;

  // Tape reel animation angle
  private reelRotation: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context for CRT display');
    this.ctx = context;

    // Offscreen scrolling canvas for waterfall
    this.waterfallCanvas = document.createElement('canvas');
    this.waterfallCanvas.width = canvas.width;
    this.waterfallCanvas.height = 185;
    const wCtx = this.waterfallCanvas.getContext('2d');
    if (!wCtx) throw new Error('No 2D context for waterfall buffer');
    this.waterfallCtx = wCtx;
    this.waterfallCtx.fillStyle = '#060a0f';
    this.waterfallCtx.fillRect(0, 0, this.waterfallCanvas.width, this.waterfallCanvas.height);

    this.timeData = new Uint8Array(512);
    this.freqData = new Uint8Array(512);
  }

  public setTheme(theme: PhosphorTheme): void {
    this.theme = theme;
  }

  public getTheme(): PhosphorTheme {
    return this.theme;
  }

  public getThemeName(): string {
    switch (this.theme) {
      case 'GREEN': return 'CRT: P24 GREEN';
      case 'AMBER': return 'CRT: P39 AMBER';
      case 'CYAN': return 'CRT: CRYPTIC CYAN';
      case 'SILVER': return 'CRT: P4 SILVER';
    }
  }

  public cycleTheme(): PhosphorTheme {
    const themes: PhosphorTheme[] = ['GREEN', 'AMBER', 'CYAN', 'SILVER'];
    const nextIdx = (themes.indexOf(this.theme) + 1) % themes.length;
    this.theme = themes[nextIdx];
    return this.theme;
  }

  public render(
    analyser: AnalyserNode | null,
    metrics: ReceptionMetrics,
    powerOn: boolean,
    tapeStatus?: TapeStatusInfo
  ): void {
    const { ctx } = this;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Update tape animation
    if (tapeStatus && (tapeStatus.isRecording || tapeStatus.isPlaying)) {
      const speedMult = tapeStatus.speed || 1.0;
      this.reelRotation += 0.08 * speedMult;
    }

    // 1. CRT Curved Bezel Outer Frame
    ctx.fillStyle = '#05090f';
    ctx.fillRect(0, 0, width, height);

    if (!powerOn) {
      ctx.fillStyle = '#0b111a';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STANDBY // RACK RECEIVER DEACTIVATED', width / 2, height / 2 - 8);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('PRESS POWER [POWER] BUTTON TO INITIALIZE VACUUM TUBES & DSP', width / 2, height / 2 + 16);
      this.drawCRTOverlay(ctx, width, height);
      return;
    }

    if (analyser) {
      analyser.getByteTimeDomainData(this.timeData);
      analyser.getByteFrequencyData(this.freqData);
    }

    // 2. Draw Waterfall Spectrogram (Top half: y 0..185)
    this.updateWaterfall(metrics);
    ctx.drawImage(this.waterfallCanvas, 0, 0);

    // Divider line between Waterfall and Oscilloscope
    ctx.strokeStyle = '#1e2d42';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 185);
    ctx.lineTo(width, 185);
    ctx.stroke();

    // 3. Draw Phosphor Oscilloscope (Bottom half: y 185..360)
    this.drawOscilloscopeWaveform(width, height);

    // 4. Draw Analog Galvanometer VU Meter
    this.drawAnalogVUMeter(width - 150, height - 85, 138, 72, metrics);

    // 5. Draw Analog Tape Reel Monitor (if active)
    if (tapeStatus) {
      this.drawTapeReelMonitor(width - 240, 24, 76, 42, tapeStatus);
    }

    // 6. Reticles, Badges, Carrier Pulse LED
    this.drawReticleAndMetrics(width, height, metrics);

    // 7. CRT Scanlines & Curved Screen Vignette
    this.drawCRTOverlay(ctx, width, height);
  }

  private updateWaterfall(metrics: ReceptionMetrics): void {
    const w = this.waterfallCanvas.width;
    const h = this.waterfallCanvas.height;
    const { waterfallCtx } = this;

    // Shift previous waterfall down by 2 pixels
    waterfallCtx.drawImage(this.waterfallCanvas, 0, 0, w, h - 2, 0, 2, w, h - 2);

    // Create 1-line pixel strip at top
    const imgData = waterfallCtx.createImageData(w, 2);
    const data = imgData.data;

    const isIcarusActive = metrics.tunedSignal?.id === 'signal-icarus' && metrics.signalStrength > 0.45;
    let glyphCol: number[] | null = null;
    if (isIcarusActive) {
      glyphCol = this.icarusGlyphs[this.icarusColIndex % this.icarusGlyphs.length];
      this.icarusColIndex++;
    }

    for (let x = 0; x < w; x++) {
      const binIdx = Math.floor((x / w) * (this.freqData.length * 0.7));
      let intensity = this.freqData[binIdx] || 0;

      // Inject hidden visual waterfall pattern if tuned to Icarus
      if (glyphCol && x > w * 0.35 && x < w * 0.65) {
        const glyphY = Math.floor(((x - w * 0.35) / (w * 0.3)) * glyphCol.length);
        if (glyphCol[glyphY] === 1) {
          intensity = Math.min(255, intensity + 175);
        }
      }

      // Theme-specific thermal heatmap palette
      let r = 0, g = 0, b = 0;
      if (this.theme === 'GREEN') {
        r = intensity > 200 ? 120 : 0;
        g = Math.min(255, Math.floor(intensity * 1.25));
        b = intensity > 180 ? 80 : 0;
      } else if (this.theme === 'AMBER') {
        r = Math.min(255, Math.floor(intensity * 1.35));
        g = Math.floor(intensity * 0.65);
        b = Math.floor(intensity * 0.08);
      } else if (this.theme === 'CYAN') {
        r = intensity > 220 ? 160 : Math.floor(intensity * 0.2);
        g = Math.min(255, Math.floor(intensity * 0.9));
        b = Math.min(255, Math.floor(intensity * 1.25));
      } else {
        // SILVER
        r = intensity;
        g = intensity;
        b = intensity;
      }

      const idx0 = x * 4;
      data[idx0] = r;
      data[idx0 + 1] = g;
      data[idx0 + 2] = b;
      data[idx0 + 3] = 255;

      const idx1 = (w + x) * 4;
      data[idx1] = r;
      data[idx1 + 1] = g;
      data[idx1 + 2] = b;
      data[idx1 + 3] = 255;
    }

    waterfallCtx.putImageData(imgData, 0, 0);
  }

  private drawOscilloscopeWaveform(width: number, height: number): void {
    const { ctx } = this;
    const oscYCenter = 270;
    const oscHeight = 65;

    let strokeColor = '#00ff88';
    let glowColor = '#00ff88';
    let gridColor = 'rgba(0, 255, 136, 0.07)';

    if (this.theme === 'AMBER') {
      strokeColor = '#ffaa00';
      glowColor = '#ff6600';
      gridColor = 'rgba(255, 170, 0, 0.07)';
    } else if (this.theme === 'CYAN') {
      strokeColor = '#00e5ff';
      glowColor = '#00e5ff';
      gridColor = 'rgba(0, 229, 255, 0.07)';
    } else if (this.theme === 'SILVER') {
      strokeColor = '#f1f5f9';
      glowColor = '#94a3b8';
      gridColor = 'rgba(241, 245, 249, 0.07)';
    }

    // Reticle Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let y = 195; y < height - 10; y += 18) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 165, y);
      ctx.stroke();
    }
    for (let x = 10; x < width - 165; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 195);
      ctx.lineTo(x, height - 10);
      ctx.stroke();
    }

    // Phosphor wave with multi-pass glow
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const maxRenderW = width - 165;
    const sliceWidth = maxRenderW / this.timeData.length;
    let x = 10;

    for (let i = 0; i < this.timeData.length; i++) {
      const v = this.timeData[i] / 128.0; // 0..2
      const y = oscYCenter + (v - 1.0) * oscHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.restore();
  }

  private drawAnalogVUMeter(x: number, y: number, w: number, h: number, metrics: ReceptionMetrics): void {
    const { ctx } = this;
    ctx.save();

    // Meter Dial Background (Warm analog meter)
    ctx.fillStyle = '#0a1017';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#27384e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Meter scale arc
    const pivotX = x + w / 2;
    const pivotY = y + h + 18;
    const arcR = h * 0.95;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, arcR, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    // Red zone (> 0dB)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, arcR, -Math.PI * 0.38, -Math.PI * 0.25);
    ctx.stroke();

    // Scale ticks
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIGNAL VU', pivotX, y + 16);
    ctx.fillText('-20', x + 18, y + 36);
    ctx.fillText('0dB', x + w - 24, y + 36);

    // Spring damping needle simulation
    const targetAngle = -Math.PI * 0.75 + metrics.signalStrength * (Math.PI * 0.5);
    const jitter = metrics.signalStrength < 0.2 ? (Math.random() - 0.5) * 0.04 : 0;
    const force = (targetAngle + jitter - this.needlePos) * 0.2;
    this.needleVelocity = this.needleVelocity * 0.78 + force;
    this.needlePos += this.needleVelocity;

    // Draw Galvanometer Needle
    ctx.strokeStyle = metrics.signalStrength > 0.8 ? '#ef4444' : '#00ffaa';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(
      pivotX + Math.cos(this.needlePos) * arcR,
      pivotY + Math.sin(this.needlePos) * arcR
    );
    ctx.stroke();

    // Pivot cap
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawTapeReelMonitor(x: number, y: number, w: number, h: number, tape: TapeStatusInfo): void {
    const { ctx } = this;
    ctx.save();

    // Tape Deck Monitor Bezel
    ctx.fillStyle = '#080d14';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    const r1X = x + 20;
    const r2X = x + w - 20;
    const rY = y + h / 2;
    const rRad = 12;

    // Tape connecting band
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(r1X, rY + rRad);
    ctx.lineTo(r2X, rY + rRad);
    ctx.stroke();

    // Draw Left and Right Reels with spokes
    [r1X, r2X].forEach((rx) => {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(rx, rY, rRad, 0, Math.PI * 2);
      ctx.fill();

      // Spinning 3-spoke reel
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      for (let s = 0; s < 3; s++) {
        const ang = this.reelRotation + (s * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.moveTo(rx, rY);
        ctx.lineTo(rx + Math.cos(ang) * (rRad - 2), rY + Math.sin(ang) * (rRad - 2));
        ctx.stroke();
      }

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(rx, rY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Recording / Playing Status LED
    if (tape.isRecording) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('● REC', x + w / 2, y + 22);
    } else if (tape.isPlaying) {
      ctx.fillStyle = '#00ffaa';
      ctx.shadowColor = '#00ffaa';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ffaa';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`▶ ${tape.speed}x`, x + w / 2, y + 22);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(tape.hasTape ? `${tape.durationSec}s TAPE` : 'NO TAPE', x + w / 2, y + 22);
    }

    ctx.restore();
  }

  private drawReticleAndMetrics(width: number, height: number, metrics: ReceptionMetrics): void {
    const { ctx } = this;

    let accentColor = '#00ff88';
    if (this.theme === 'AMBER') accentColor = '#ffaa00';
    else if (this.theme === 'CYAN') accentColor = '#00e5ff';
    else if (this.theme === 'SILVER') accentColor = '#f1f5f9';

    // Top Section Labels
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WATERFALL SPECTROGRAM [0 - 5.0 kHz]', 12, 16);
    ctx.fillText('TIME-DOMAIN PHOSPHOR OSCILLOSCOPE', 12, 204);

    // Optical Signal Indicator LED
    const ledX = width - 20;
    const ledY = 202;
    ctx.beginPath();
    ctx.arc(ledX, ledY, 5, 0, Math.PI * 2);
    if (metrics.isSignalBlipActive) {
      ctx.fillStyle = accentColor;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('CARRIER PULSE [ACTIVE]', ledX - 10, ledY + 3);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fill();
    }

    // Tuned signal HUD badge
    ctx.textAlign = 'right';
    if (metrics.tunedSignal && metrics.signalStrength > 0.2) {
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`SIGNAL LOCK: ${metrics.tunedSignal.name} (${metrics.signalToNoiseRatio} dB SNR)`, width - 12, 16);

      // Filter status alert badge on CRT
      ctx.textAlign = 'left';
      if (metrics.isFilterOptimal) {
        ctx.fillStyle = accentColor;
        ctx.fillText('✓ FILTER ENVELOPE OPTIMAL', 12, height - 12);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('⚠ HIGH INTERFERENCE // ADJUST BIQUAD FILTER', 12, height - 12);
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('NO CARRIER // AMBIENT STATIC', width - 12, 16);
    }
  }

  private drawCRTOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1.2);
    }

    // Glass Screen Curved Vignette Shadow
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.45,
      width / 2, height / 2, Math.max(width, height) * 0.72
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Glass Screen Border
    ctx.strokeStyle = 'rgba(30, 48, 70, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, width - 2, height - 2);
  }
}
