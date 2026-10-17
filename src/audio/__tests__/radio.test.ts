import { describe, expect, it } from 'vitest';
import { RadioEngine } from '../radioEngine';
import { NotebookManager } from '../../ui/notebook';

describe('DeadAir Audio Reception & Solution Validation', () => {
  it('should calculate signal metrics correctly on exact Morse frequency (124.5 MHz)', () => {
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
    radio.setFrequency(100.0); // Dead air at 100.0 MHz

    const metrics = radio.getReceptionMetrics();
    expect(metrics.tunedSignal).toBeNull();
    expect(metrics.signalStrength).toBe(0);
    expect(metrics.signalToNoiseRatio).toBe(0);
  });

  it('should verify Low-Pass filter requirement for Signal Omega (285.4 MHz)', () => {
    const radio = new RadioEngine();
    radio.setFrequency(285.4); // Signal Omega

    // Default filter is ALL_PASS -> not optimal
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(false);

    // Switch to LOW_PASS with 800Hz cutoff -> optimal
    radio.setFilterType('LOW_PASS');
    radio.setFilterCutoff(800);
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(true);
  });

  it('should verify Notch filter requirement for Signal Nexus (340.8 MHz)', () => {
    const radio = new RadioEngine();
    radio.setFrequency(340.8); // Signal Nexus

    // On ALL_PASS, 1000Hz feedback loop is active
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(false);

    // On LOW_PASS, still not notch -> false
    radio.setFilterType('LOW_PASS');
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(false);

    // On NOTCH with 1000Hz cutoff -> optimal
    radio.setFilterType('NOTCH');
    radio.setFilterCutoff(1000);
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(true);

    // On NOTCH with 3000Hz cutoff (far from 1000Hz) -> not optimal
    radio.setFilterCutoff(3000);
    expect(radio.getReceptionMetrics().isFilterOptimal).toBe(false);
  });

  it('should lock carrier for Spectral Waterfall signal (415.0 MHz)', () => {
    const radio = new RadioEngine();
    radio.setFrequency(415.0);

    const metrics = radio.getReceptionMetrics();
    expect(metrics.tunedSignal).not.toBeNull();
    expect(metrics.tunedSignal?.id).toBe('signal-icarus');
    expect(metrics.signalStrength).toBeCloseTo(1.0, 1);
  });

  it('should support volume adjustment and audio muting', () => {
    const radio = new RadioEngine();
    expect(radio.isMuted()).toBe(false);

    radio.setMute(true);
    expect(radio.isMuted()).toBe(true);

    radio.setMute(false);
    expect(radio.isMuted()).toBe(false);

    radio.setVolume(0.5);
    expect(radio.getParams().volume).toBe(0.5);
  });

  it('should unlock graduated hints progressively (Level 1 -> 2 -> 3)', () => {
    const notebook = new NotebookManager();
    expect(notebook.getRevealedHintLevel('signal-echo')).toBe(0);

    // Reveal Hint 1
    const l1 = notebook.revealHint('signal-echo');
    expect(l1).toBe(1);
    expect(notebook.getRevealedHintLevel('signal-echo')).toBe(1);

    // Reveal Hint 2
    const l2 = notebook.revealHint('signal-echo');
    expect(l2).toBe(2);

    // Reveal Hint 3
    const l3 = notebook.revealHint('signal-echo');
    expect(l3).toBe(3);

    // Calling again does not exceed max hints
    const l4 = notebook.revealHint('signal-echo');
    expect(l4).toBe(3);
  });

  it('should lock carrier for Classified Numbers Station (502.4 MHz)', () => {
    const radio = new RadioEngine();
    radio.setFrequency(502.4);

    const metrics = radio.getReceptionMetrics();
    expect(metrics.tunedSignal).not.toBeNull();
    expect(metrics.tunedSignal?.id).toBe('signal-blackout');
    expect(metrics.signalStrength).toBeCloseTo(1.0, 1);
  });

  it('should validate all 5 mystery solutions and trigger victory', () => {
    let allSolved = false;
    const notebook = new NotebookManager(() => {
      allSolved = true;
    });

    // Rejection of invalid answer
    expect(notebook.checkSolution('signal-echo', 'UNKNOWN')).toBe(false);
    expect(notebook.isAllSolved()).toBe(false);

    // Solve signal 1: Base Echo
    expect(notebook.checkSolution('signal-echo', 'BASE ECHO')).toBe(true);
    expect(notebook.getSolvedCount()).toBe(1);

    // Solve signal 2: Cipher 7391
    expect(notebook.checkSolution('signal-omega', '7391')).toBe(true);
    expect(notebook.getSolvedCount()).toBe(2);

    // Solve signal 3: Bunker Nexus
    expect(notebook.checkSolution('signal-nexus', 'NEXUS')).toBe(true);
    expect(notebook.getSolvedCount()).toBe(3);

    // Solve signal 4: Project Icarus
    expect(notebook.checkSolution('signal-icarus', 'ICARUS')).toBe(true);
    expect(notebook.getSolvedCount()).toBe(4);

    // Solve signal 5: Blackout Numbers Station VOID
    expect(notebook.checkSolution('signal-blackout', 'VOID')).toBe(true);
    expect(notebook.getSolvedCount()).toBe(5);

    expect(notebook.isAllSolved()).toBe(true);
    expect(allSolved).toBe(true);
  });
});

