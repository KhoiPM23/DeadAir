import { RadioEngine } from './audio/radioEngine';
import { MYSTERY_SIGNALS, STATION_LOGS } from './audio/signals';
import { FilterType, MysterySignal } from './audio/types';
import { NotebookManager } from './ui/notebook';
import { OscilloscopeRenderer } from './ui/oscilloscope';

// DOM elements
const crtCanvas = document.getElementById('crtCanvas') as HTMLCanvasElement;
const btnPower = document.getElementById('btnPower') as HTMLButtonElement;
const freqText = document.getElementById('freqText') as HTMLElement;
const freqSlider = document.getElementById('freqSlider') as HTMLInputElement;
const sliderVal = document.getElementById('sliderVal') as HTMLElement;
const cutoffSlider = document.getElementById('cutoffSlider') as HTMLInputElement;
const cutoffVal = document.getElementById('cutoffVal') as HTMLElement;
const squelchSlider = document.getElementById('squelchSlider') as HTMLInputElement;
const squelchVal = document.getElementById('squelchVal') as HTMLElement;
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
const volumeVal = document.getElementById('volumeVal') as HTMLElement;

const btnMute = document.getElementById('btnMute') as HTMLButtonElement;
const muteLabel = document.getElementById('muteLabel') as HTMLElement;
const btnPause = document.getElementById('btnPause') as HTMLButtonElement;
const pauseLabel = document.getElementById('pauseLabel') as HTMLElement;
const modalPause = document.getElementById('modalPause') as HTMLElement;
const btnResumeGame = document.getElementById('btnResumeGame') as HTMLButtonElement;

const btnMorseRef = document.getElementById('btnMorseRef') as HTMLButtonElement;
const modalMorse = document.getElementById('modalMorse') as HTMLElement;
const btnCloseMorse = document.getElementById('btnCloseMorse') as HTMLButtonElement;

const btnTheme = document.getElementById('btnTheme') as HTMLButtonElement | null;
const themeLabel = document.getElementById('themeLabel') as HTMLElement | null;
const btnDossiers = document.getElementById('btnDossiers') as HTMLButtonElement | null;
const modalDossier = document.getElementById('modalDossier') as HTMLElement | null;
const btnCloseDossier = document.getElementById('btnCloseDossier') as HTMLButtonElement | null;
const dossierList = document.getElementById('dossierList') as HTMLElement | null;

// Cold War Evidence Board & Station Logs DOM
const btnEvidenceBoard = document.getElementById('btnEvidenceBoard') as HTMLButtonElement | null;
const modalEvidenceBoard = document.getElementById('modalEvidenceBoard') as HTMLElement | null;
const btnCloseEvidence = document.getElementById('btnCloseEvidence') as HTMLButtonElement | null;
const pinboardPins = document.getElementById('pinboardPins') as HTMLElement | null;
const pinboardStrings = document.getElementById('pinboardStrings') as HTMLElement | null;
const evTitle = document.getElementById('evTitle') as HTMLElement | null;
const evClassification = document.getElementById('evClassification') as HTMLElement | null;
const evCoords = document.getElementById('evCoords') as HTMLElement | null;
const evDate = document.getElementById('evDate') as HTMLElement | null;
const evCable = document.getElementById('evCable') as HTMLElement | null;
const btnTuneFromEvidence = document.getElementById('btnTuneFromEvidence') as HTMLButtonElement | null;

const btnStationLogs = document.getElementById('btnStationLogs') as HTMLButtonElement | null;
const modalStationLogs = document.getElementById('modalStationLogs') as HTMLElement | null;
const btnCloseLogs = document.getElementById('btnCloseLogs') as HTMLButtonElement | null;
const stationLogsContainer = document.getElementById('stationLogsContainer') as HTMLElement | null;

const modalBriefing = document.getElementById('modalBriefing') as HTMLElement;
const btnStartBriefing = document.getElementById('btnStartBriefing') as HTMLButtonElement;

const modalVictory = document.getElementById('modalVictory') as HTMLElement;
const btnRestartDossier = document.getElementById('btnRestartDossier') as HTMLButtonElement;
const unresolvedBadge = document.getElementById('unresolvedBadge') as HTMLElement;

// Systems
let isPaused = false;
const radio = new RadioEngine();
const oscRenderer = new OscilloscopeRenderer(crtCanvas);

const notebook = new NotebookManager(() => {
  modalVictory.classList.remove('hidden');
});

function updateUnresolvedBadge(): void {
  const remaining = notebook.getTotalCount() - notebook.getSolvedCount();
  if (remaining === 0) {
    unresolvedBadge.textContent = 'ALL SIGNALS DECRYPTED';
    unresolvedBadge.style.color = '#00ffaa';
  } else {
    unresolvedBadge.textContent = `${remaining} UNRESOLVED FREQUENCIES`;
    unresolvedBadge.style.color = '#00e5ff';
  }
}

// Power Button
function togglePower(): void {
  const currentPower = radio.getParams().powerOn;
  const newPower = !currentPower;
  radio.setPower(newPower);

  if (newPower) {
    btnPower.classList.add('active');
    btnPower.textContent = 'POWER: ONLINE';
  } else {
    btnPower.classList.remove('active');
    btnPower.textContent = 'POWER: OFF';
  }
}

btnPower.addEventListener('click', togglePower);

btnStartBriefing.addEventListener('click', () => {
  modalBriefing.classList.add('hidden');
  if (!radio.getParams().powerOn) {
    togglePower();
  }
});

// Frequency controls
function updateFrequency(freq: number): void {
  const clamped = Math.max(80.0, Math.min(520.0, parseFloat(freq.toFixed(1))));
  radio.setFrequency(clamped);
  freqSlider.value = clamped.toString();
  freqText.textContent = `${clamped.toFixed(2)} MHz`;
  sliderVal.textContent = `${clamped.toFixed(1)} MHz`;
}

freqSlider.addEventListener('input', () => {
  updateFrequency(parseFloat(freqSlider.value));
});

document.querySelectorAll('.btn-step[data-delta]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const delta = btn.getAttribute('data-delta');
    if (delta) {
      updateFrequency(radio.getParams().frequencyMHz + parseFloat(delta));
    }
  });
});


const directFreqInput = document.getElementById('directFreqInput') as HTMLInputElement | null;
const btnDirectTune = document.getElementById('btnDirectTune') as HTMLButtonElement | null;
const btnToggleMorseDock = document.getElementById('btnToggleMorseDock') as HTMLButtonElement | null;
const morseDockGrid = document.getElementById('morseDockGrid') as HTMLElement | null;

function applyDirectTune(): void {
  if (!directFreqInput) return;
  const val = parseFloat(directFreqInput.value);
  if (!isNaN(val)) {
    updateFrequency(val);
  }
}

btnDirectTune?.addEventListener('click', applyDirectTune);
directFreqInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    applyDirectTune();
  }
});

btnToggleMorseDock?.addEventListener('click', () => {
  if (!morseDockGrid || !btnToggleMorseDock) return;
  const isHidden = morseDockGrid.style.display === 'none';
  morseDockGrid.style.display = isHidden ? 'grid' : 'none';
  btnToggleMorseDock.textContent = isHidden ? 'COLLAPSE' : 'EXPAND';
});

// Filter controls
document.querySelectorAll('.btn-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-filter').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.getAttribute('data-filter') as FilterType;
    if (filter) {
      radio.setFilterType(filter);
    }
  });
});

cutoffSlider.addEventListener('input', () => {
  const cutoff = parseInt(cutoffSlider.value, 10);
  cutoffVal.textContent = `${cutoff} Hz`;
  radio.setFilterCutoff(cutoff);
});

squelchSlider.addEventListener('input', () => {
  const squelch = parseFloat(squelchSlider.value);
  squelchVal.textContent = `${(squelch * 100).toFixed(0)}%`;
  radio.setSquelch(squelch);
});

volumeSlider.addEventListener('input', () => {
  const vol = parseFloat(volumeSlider.value);
  volumeVal.textContent = `${Math.round(vol * 100)}%`;
  radio.setVolume(vol);
});

// Mute & Pause
function toggleMute(): void {
  const muted = radio.setMute(!radio.isMuted());
  muteLabel.textContent = muted ? 'SFX: MUTED' : 'SFX: ON';
  btnMute.style.borderColor = muted ? '#f59e0b' : '#334a6e';
}

function togglePause(): void {
  isPaused = !isPaused;
  if (isPaused) {
    modalPause.classList.remove('hidden');
    pauseLabel.textContent = 'RESUME';
  } else {
    modalPause.classList.add('hidden');
    pauseLabel.textContent = 'PAUSE';
  }
}

btnMute.addEventListener('click', toggleMute);
btnPause.addEventListener('click', togglePause);
btnResumeGame.addEventListener('click', togglePause);

// Theme switching
function handleCycleTheme(): void {
  oscRenderer.cycleTheme();
  if (themeLabel) {
    themeLabel.textContent = oscRenderer.getThemeName();
  }
}

btnTheme?.addEventListener('click', handleCycleTheme);

// Classified Dossiers
function openDossierModal(): void {
  if (!dossierList || !modalDossier) return;
  dossierList.innerHTML = '';

  const dossierLore: Record<string, { title: string; clearance: string; text: string }> = {
    'signal-echo': {
      title: 'OUTPOST ECHO // EMERGENCY BEACON',
      clearance: 'SECRET',
      text: 'Outpost Echo personnel abandoned installation following the severe 1987 geomagnetic storm. Automated distress transmitter continues repeating callsign ECHO on 124.5 MHz.'
    },
    'signal-7391': {
      title: 'STATION 7391 // SUBTERRANEAN ARCTIC CORE',
      clearance: 'TOP SECRET',
      text: 'Subterranean coolant breach occurred at 02:45. Cryogenic containment protocol COLD was broadcast over 285.4 MHz before primary communications mast froze.'
    },
    'signal-nexus': {
      title: 'PROJECT NEXUS // QUANTUM TRANSCEIVER',
      clearance: 'RESTRICTED',
      text: 'Experimental autonomous relay array. Neural node operating without human supervision on 340.8 MHz. Termination code OMEGA verified.'
    },
    'signal-icarus': {
      title: 'PROBE ICARUS // SOLAR ORBITAL TELEMETRY',
      clearance: 'CONFIDENTIAL',
      text: 'Deep space telemetry probe entered eccentric solar orbit. Attitude control thrusters depleted. Steganographic waterfall broadcast confirmed status ORBIT.'
    },
    'signal-blackout': {
      title: 'OPERATION VOID // CLOAKED OBSERVATORY',
      clearance: 'EYES ONLY',
      text: 'High-frequency 4x audio burst intercepted at 502.4 MHz. Slow-speed tape analysis decoded distress cipher VOID. Void anomaly containment status: UNKNOWN.'
    }
  };

  MYSTERY_SIGNALS.forEach(sig => {
    const isSolved = notebook.isSignalSolved(sig.id);
    const card = document.createElement('div');
    card.style.cssText = `background: #090f18; border: 1px solid ${isSolved ? '#00ffaa' : '#334155'}; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 4px;`;
    const lore = dossierLore[sig.id] || { title: sig.name, clearance: 'UNCLASSIFIED', text: sig.clueHint };

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: ${isSolved ? '#00ffaa' : '#64748b'};">${lore.title}</span>
        <span style="font-size: 9px; padding: 2px 6px; border-radius: 3px; background: ${isSolved ? 'rgba(0,255,170,0.15)' : 'rgba(255,255,255,0.05)'}; color: ${isSolved ? '#00ffaa' : '#64748b'};">[${isSolved ? lore.clearance : 'ENCRYPTED'}]</span>
      </div>
      <div style="font-size: 10px; color: ${isSolved ? '#cbd5e1' : '#475569'}; line-height: 1.4;">
        ${isSolved ? lore.text : '/// INTELLIGENCE REDACTED /// Solve signal cipher in the evidence notebook to decrypt classified military memorandum.'}
      </div>
    `;
    dossierList.appendChild(card);
  });

  modalDossier.classList.remove('hidden');
}

btnDossiers?.addEventListener('click', openDossierModal);
btnCloseDossier?.addEventListener('click', () => {
  modalDossier?.classList.add('hidden');
});

// Cold War Evidence Board & Polar Map Logic
function renderEvidenceDetail(sig: MysterySignal): void {
  if (!evTitle || !evClassification || !evCoords || !evDate || !evCable || !btnTuneFromEvidence) return;
  const isSolved = notebook.isSignalSolved(sig.id);

  evClassification.textContent = sig.classification;
  const isTopSecret = sig.classification.includes('TOP') || sig.classification.includes('EYES');
  evClassification.style.borderColor = isSolved ? '#00ffaa' : isTopSecret ? '#ef4444' : '#f59e0b';
  evClassification.style.color = isSolved ? '#00ffaa' : isTopSecret ? '#f87171' : '#fbbf24';

  evTitle.textContent = `${sig.name.toUpperCase()} // ${sig.frequencyMHz.toFixed(1)} MHz`;
  evCoords.textContent = `POLAR RADAR COORDINATES: ${sig.coordinates}`;
  evDate.textContent = `DE-SIGINT INTERCEPT: ${sig.interceptDate}`;

  if (isSolved) {
    evCable.textContent = sig.declassifiedCable;
    evCable.style.borderColor = '#00ffaa';
    evCable.style.color = '#cbd5e1';
  } else {
    evCable.textContent = `[ENCRYPTED MILITARY CABLE]\nCarrier: ${sig.frequencyMHz.toFixed(1)} MHz (${sig.modulation.toUpperCase()})\nClue: ${sig.clueHint}\n\n/// DECLASSIFICATION LOCKED ///\nMatch the carrier on your tuner and record the correct keyword in the notebook to unlock full cable.`;
    evCable.style.borderColor = '#ef4444';
    evCable.style.color = '#94a3b8';
  }

  btnTuneFromEvidence.style.display = 'block';
  btnTuneFromEvidence.textContent = `TUNE RECEIVER TO ${sig.frequencyMHz.toFixed(1)} MHz`;
  btnTuneFromEvidence.onclick = () => {
    updateFrequency(sig.frequencyMHz);
    modalEvidenceBoard?.classList.add('hidden');
  };
}

function openEvidenceBoard(): void {
  if (!modalEvidenceBoard || !pinboardPins || !pinboardStrings) return;
  pinboardPins.innerHTML = '';
  pinboardStrings.innerHTML = '';

  // Station Echo-4 central listening post
  const centerPin = document.createElement('div');
  centerPin.className = 'pin-node solved';
  centerPin.style.left = '50%';
  centerPin.style.top = '50%';
  centerPin.style.background = '#00e5ff';
  centerPin.style.boxShadow = '0 0 14px #00e5ff';
  centerPin.title = 'Station Echo-4 (Listening Post, Shemya)';
  pinboardPins.appendChild(centerPin);

  MYSTERY_SIGNALS.forEach((sig, idx) => {
    const isSolved = notebook.isSignalSolved(sig.id);
    const pin = document.createElement('div');
    pin.className = `pin-node ${isSolved ? 'solved' : ''}`;
    pin.style.left = `${sig.pinboardX}%`;
    pin.style.top = `${sig.pinboardY}%`;
    pin.innerHTML = `<span class="pin-label">${sig.frequencyMHz.toFixed(1)}M</span>`;
    pin.title = `${sig.name} (${sig.coordinates})`;

    pin.addEventListener('click', () => {
      document.querySelectorAll('.pin-node').forEach(p => (p as HTMLElement).style.outline = 'none');
      pin.style.outline = '2px solid #ffffff';
      renderEvidenceDetail(sig);
    });

    pinboardPins.appendChild(pin);

    // SVG string connection
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '50%');
    line.setAttribute('y1', '50%');
    line.setAttribute('x2', `${sig.pinboardX}%`);
    line.setAttribute('y2', `${sig.pinboardY}%`);
    line.setAttribute('stroke', isSolved ? '#00ffaa' : '#ef4444');
    line.setAttribute('stroke-width', isSolved ? '2' : '1');
    line.setAttribute('stroke-dasharray', isSolved ? 'none' : '4 4');
    line.setAttribute('opacity', '0.6');
    pinboardStrings.appendChild(line);

    if (idx === 0) {
      renderEvidenceDetail(sig);
    }
  });

  modalEvidenceBoard.classList.remove('hidden');
}

function openStationLogsModal(): void {
  if (!modalStationLogs || !stationLogsContainer) return;
  stationLogsContainer.innerHTML = '';

  STATION_LOGS.forEach(log => {
    const card = document.createElement('div');
    card.style.cssText = 'background: #090f18; border: 1px solid #28374f; border-left: 3px solid #f59e0b; border-radius: 4px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px;';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: #fbbf24; font-size: 11px;">${log.title}</span>
        <span style="font-size: 9px; color: #64748b; font-family: monospace;">${log.date}</span>
      </div>
      <div style="font-size: 10px; color: #38bdf8;">OPERATOR: ${log.author} // [${log.clearance}]</div>
      <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5; white-space: pre-line; margin-top: 4px;">${log.content}</div>
    `;
    stationLogsContainer.appendChild(card);
  });

  modalStationLogs.classList.remove('hidden');
}

btnEvidenceBoard?.addEventListener('click', openEvidenceBoard);
btnCloseEvidence?.addEventListener('click', () => {
  modalEvidenceBoard?.classList.add('hidden');
});

btnStationLogs?.addEventListener('click', openStationLogsModal);
btnCloseLogs?.addEventListener('click', () => {
  modalStationLogs?.classList.add('hidden');
});

// Modals
btnMorseRef.addEventListener('click', () => {
  modalMorse.classList.remove('hidden');
});

btnCloseMorse.addEventListener('click', () => {
  modalMorse.classList.add('hidden');
});

btnRestartDossier.addEventListener('click', () => {
  modalVictory.classList.add('hidden');
  notebook.resetNotebook();
  updateUnresolvedBadge();
});

// Global Keyboard Navigation
window.addEventListener('keydown', (e) => {
  // Toggle Evidence Board [B]
  if (e.key === 'b' || e.key === 'B') {
    const isInputActive = ['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase());
    if (!isInputActive) {
      e.preventDefault();
      if (modalEvidenceBoard?.classList.contains('hidden')) {
        openEvidenceBoard();
      } else {
        modalEvidenceBoard?.classList.add('hidden');
      }
      return;
    }
  }

  // Toggle Station Logs [L]
  if (e.key === 'l' || e.key === 'L') {
    const isInputActive = ['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase());
    if (!isInputActive) {
      e.preventDefault();
      if (modalStationLogs?.classList.contains('hidden')) {
        openStationLogsModal();
      } else {
        modalStationLogs?.classList.add('hidden');
      }
      return;
    }
  }

  // Theme cycle [C]
  if (e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    handleCycleTheme();
    return;
  }

  // Close modals on Escape
  if (e.key === 'Escape') {
    modalEvidenceBoard?.classList.add('hidden');
    modalStationLogs?.classList.add('hidden');
    modalDossier?.classList.add('hidden');
    modalMorse?.classList.add('hidden');
    modalPause?.classList.add('hidden');
    return;
  }

  // Pause
  if (e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    togglePause();
    return;
  }

  if (isPaused) return;

  // Mute
  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    toggleMute();
    return;
  }

  // Preset Channels [1]..[5]
  const isInputActive = ['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase());
  if (!isInputActive && e.key >= '1' && e.key <= '5') {
    const idx = parseInt(e.key, 10) - 1;
    if (idx < MYSTERY_SIGNALS.length) {
      e.preventDefault();
      updateFrequency(MYSTERY_SIGNALS[idx].frequencyMHz);
      return;
    }
  }

  // Quick tune to nearest signal with Space
  if (e.code === 'Space') {
    e.preventDefault();
    const curFreq = radio.getParams().frequencyMHz;
    let closest = MYSTERY_SIGNALS[0];
    let minDist = Math.abs(curFreq - closest.frequencyMHz);
    for (const s of MYSTERY_SIGNALS) {
      const d = Math.abs(curFreq - s.frequencyMHz);
      if (d < minDist) {
        minDist = d;
        closest = s;
      }
    }
    updateFrequency(closest.frequencyMHz);
    return;
  }

  // Arrow Key Tuning
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    updateFrequency(radio.getParams().frequencyMHz - 0.1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    updateFrequency(radio.getParams().frequencyMHz + 0.1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    updateFrequency(radio.getParams().frequencyMHz + 1.0);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    updateFrequency(radio.getParams().frequencyMHz - 1.0);
  }
});

// Analog Tape Deck UI Controls
const btnTapeRecord = document.getElementById('btnTapeRecord') as HTMLButtonElement | null;
const btnTapeStop = document.getElementById('btnTapeStop') as HTMLButtonElement | null;
const btnTapePlay = document.getElementById('btnTapePlay') as HTMLButtonElement | null;
const tapeStatusText = document.getElementById('tapeStatusText') as HTMLElement | null;
let currentTapeSpeed = 1.0;

if (btnTapeRecord) {
  btnTapeRecord.addEventListener('click', () => {
    radio.startTapeRecording();
  });
}

if (btnTapeStop) {
  btnTapeStop.addEventListener('click', () => {
    radio.stopTapeRecording();
    radio.stopTape();
  });
}

if (btnTapePlay) {
  btnTapePlay.addEventListener('click', () => {
    radio.playTape(currentTapeSpeed);
  });
}

document.querySelectorAll('.btn-tape-speed').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-tape-speed').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const spd = parseFloat(btn.getAttribute('data-speed') || '1.0');
    currentTapeSpeed = spd;
    if (radio.getTapeStatus().isPlaying) {
      radio.playTape(spd);
    }
  });
});

// Render loop at 60fps
function renderLoop(): void {
  if (!isPaused) {
    const analyser = radio.getAnalyser();
    const metrics = radio.getReceptionMetrics();
    const powerOn = radio.getParams().powerOn;
    const tapeStatus = radio.getTapeStatus();

    oscRenderer.render(analyser, metrics, powerOn, tapeStatus);
    updateUnresolvedBadge();

    // Update tape deck status text
    if (tapeStatusText) {
      if (tapeStatus.isRecording) {
        tapeStatusText.textContent = '● RECORDING IN PROGRESS';
        tapeStatusText.style.color = '#ef4444';
      } else if (tapeStatus.isPlaying) {
        tapeStatusText.textContent = `▶ PLAYING AT ${tapeStatus.speed}x SPEED`;
        tapeStatusText.style.color = '#00ffaa';
      } else if (tapeStatus.hasTape) {
        tapeStatusText.textContent = `TAPE READY [${tapeStatus.durationSec}s RECORDED]`;
        tapeStatusText.style.color = '#f59e0b';
      } else {
        tapeStatusText.textContent = 'NO TAPE CAPTURED';
        tapeStatusText.style.color = '#94a3b8';
      }
    }
  }
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

