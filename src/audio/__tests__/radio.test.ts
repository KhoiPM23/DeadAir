import { describe, expect, it } from 'vitest';
import { RadioEngine } from '../radioEngine';
import { NotebookManager } from '../../ui/notebook';

describe('DeadAir Audio Reception & Solution Validation', () => {
  it('should calculate signal metrics correctly on exact frequency', () => {
    const radio = new RadioEngine();
    radio.setFrequency(124.5);

    const metrics = radio.getReceptionMetrics();
    expect(metrics.tunedSignal).not.toBeNull();
    expect(metrics.tunedSignal?.id).toBe('signal-echo');
    expect(metrics.signalStrength).toBeCloseTo(1.0, 1);
    expect(metrics.signalToNoiseRatio).toBeGreaterThan(20);
    expect(metrics.heterodynePitchHz).toBe(0);
  });

  it('should detect carrier drop when out of signal bandwidth', () => {
    const radio = new RadioEngine();
    radio.setFrequency(100.0); // No signal at 100.0 MHz

    const metrics = radio.getReceptionMetrics();
    expect(metrics.tunedSignal).toBeNull();
    expect(metrics.signalStrength).toBe(0);
    expect(metrics.signalToNoiseRatio).toBe(0);
  });

  it('should verify filter requirement for Signal Omega', () => {
    const radio = new RadioEngine();
    radio.setFrequency(285.4); // Signal Omega

    // Default filter is ALL_PASS -> not optimal
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(false);

    // Switch to LOW_PASS with 800Hz cutoff
    radio.setFilterType('LOW_PASS');
    radio.setFilterCutoff(800);
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(true);
  });

  it('should validate mystery solutions in NotebookManager', () => {
    let allSolved = false;
    const notebook = new NotebookManager(() => {
      allSolved = true;
    });

    // Test rejection of wrong answer
    const wrong = notebook.checkSolution('signal-echo', 'WRONG GUESS');
    expect(wrong).toBe(false);
    expect(notebook.isAllSolved()).toBe(false);

    // Solve signal 1
    const s1 = notebook.checkSolution('signal-echo', 'BASE ECHO');
    expect(s1).toBe(true);

    // Solve signal 2
    const s2 = notebook.checkSolution('signal-omega', '7391');
    expect(s2).toBe(true);

    // Solve signal 3
    const s3 = notebook.checkSolution('signal-icarus', 'ICARUS');
    expect(s3).toBe(true);

    expect(notebook.isAllSolved()).toBe(true);
    expect(allSolved).toBe(true);
  });
});
