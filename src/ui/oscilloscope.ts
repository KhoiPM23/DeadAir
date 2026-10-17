import { ReceptionMetrics } from '../audio/types';

export class OscilloscopeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private waterfallCanvas: HTMLCanvasElement;
  private waterfallCtx: CanvasRenderingContext2D;

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context for CRT display');
    this.ctx = context;

    // Offscreen scrolling canvas for waterfall
    this.waterfallCanvas = document.createElement('canvas');
    this.waterfallCanvas.width = canvas.width;
    this.waterfallCanvas.height = 200;
    const wCtx = this.waterfallCanvas.getContext('2d');
    if (!wCtx) throw new Error('No 2D context for waterfall buffer');
    this.waterfallCtx = wCtx;
    this.waterfallCtx.fillStyle = '#060a0f';
    this.waterfallCtx.fillRect(0, 0, this.waterfallCanvas.width, this.waterfallCanvas.height);

    this.timeData = new Uint8Array(512);
    this.freqData = new Uint8Array(512);
  }

  public render(analyser: AnalyserNode | null, metrics: ReceptionMetrics, powerOn: boolean): void {
    const { ctx } = this;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // CRT Bezel background
    ctx.fillStyle = '#05090f';
    ctx.fillRect(0, 0, width, height);

    if (!powerOn) {
      // Off state: slight scanline glow
      ctx.fillStyle = '#0f1722';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('STANDBY // POWER OFF', width / 2, height / 2);
      this.drawScanlines(ctx, width, height);
      return;
    }

    if (analyser) {
      analyser.getByteTimeDomainData(this.timeData);
      analyser.getByteFrequencyData(this.freqData);
    }

    // 1. Draw Waterfall (Top portion: y 0..200)
    this.updateWaterfall(metrics);
    ctx.drawImage(this.waterfallCanvas, 0, 0);

    // Divider line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(width, 200);
    ctx.stroke();

    // 2. Draw Oscilloscope (Bottom portion: y 200..380)
    this.drawOscilloscopeWaveform(width, height);

    // 3. CRT Scanline overlay & Reticle
    this.drawReticleAndMetrics(width, height, metrics);
    this.drawScanlines(ctx, width, height);
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
      // Map x to frequency bins
      const binIdx = Math.floor((x / w) * (this.freqData.length * 0.7));
      let intensity = this.freqData[binIdx] || 0;

      // Inject hidden visual waterfall pattern if tuned to Icarus
      if (glyphCol && x > w * 0.35 && x < w * 0.65) {
        const glyphY = Math.floor(((x - w * 0.35) / (w * 0.3)) * glyphCol.length);
        if (glyphCol[glyphY] === 1) {
          intensity = Math.min(255, intensity + 160);
        }
      }

      // Amber / Cyan thermal heatmap palette
      const r = intensity > 160 ? 255 : intensity * 1.2;
      const g = intensity > 80 ? intensity : intensity * 0.5;
      const b = intensity > 200 ? 220 : intensity * 0.3;

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
    const oscYCenter = 290;
    const oscHeight = 80;

    // Grid lines for oscilloscope
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 210; y < height - 10; y += 20) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }
    for (let x = 10; x < width - 10; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 210);
      ctx.lineTo(x, height - 10);
      ctx.stroke();
    }

    // Phosphor green wave
    ctx.save();
    ctx.strokeStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / this.timeData.length;
    let x = 0;

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

  private drawReticleAndMetrics(width: number, height: number, metrics: ReceptionMetrics): void {
    const { ctx } = this;

    // Labels
    ctx.fillStyle = '#00e5ff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WATERFALL SPECTROGRAM [0 - 5.0 kHz]', 12, 16);
    ctx.fillText('TIME-DOMAIN PHOSPHOR OSCILLOSCOPE', 12, 218);

    // Tuned signal HUD badge
    ctx.textAlign = 'right';
    if (metrics.tunedSignal && metrics.signalStrength > 0.2) {
      ctx.fillStyle = '#00ff88';
      ctx.fillText(`SIGNAL LOCK: ${metrics.tunedSignal.name} (${metrics.signalToNoiseRatio} dB SNR)`, width - 12, 16);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.fillText('NO CARRIER // STATIC NOISE', width - 12, 16);
    }

    // Signal strength bar (VU Meter in CRT corner)
    const meterX = width - 150;
    const meterY = height - 24;
    const meterW = 138;
    const meterH = 10;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(meterX, meterY, meterW, meterH);
    ctx.fillStyle = metrics.signalStrength > 0.7 ? '#00ff88' : '#00e5ff';
    ctx.fillRect(meterX, meterY, meterW * metrics.signalStrength, meterH);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(meterX, meterY, meterW, meterH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText(`RSSI: ${(metrics.signalStrength * 100).toFixed(0)}%`, meterX - 8, meterY + 9);
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < height; y += 3) {
      ctx.fillRect(0, y, width, 1);
    }
  }
}
