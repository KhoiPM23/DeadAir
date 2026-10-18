import { RadioEngine } from './audio/radioEngine';
import { MYSTERY_SIGNALS, STATION_LOGS } from './audio/signals';
import { FilterType, MysterySignal } from './audio/types';
import { NotebookManager } from './ui/notebook';
import { PhosphorTheme, OscilloscopeRenderer } from './ui/oscilloscope';

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

// Settings & Options DOM
const btnSettings = document.getElementById('btnSettings') as HTMLButtonElement | null;
const modalSettings = document.getElementById('modalSettings') as HTMLElement | null;
const btnCloseSettings = document.getElementById('btnCloseSettings') as HTMLButtonElement | null;
const optMasterVol = document.getElementById('optMasterVol') as HTMLInputElement | null;
const optMasterVolVal = document.getElementById('optMasterVolVal') as HTMLElement | null;
const optStaticVol = document.getElementById('optStaticVol') as HTMLInputElement | null;
const optStaticVolVal = document.getElementById('optStaticVolVal') as HTMLElement | null;
const optScanlines = document.getElementById('optScanlines') as HTMLInputElement | null;
const optScanlinesVal = document.getElementById('optScanlinesVal') as HTMLElement | null;
const btnToggleCurvature = document.getElementById('btnToggleCurvature') as HTMLButtonElement | null;
const btnToggleFullscreen = document.getElementById('btnToggleFullscreen') as HTMLButtonElement | null;

// Field Handbook DOM
const btnHandbook = document.getElementById('btnHandbook') as HTMLButtonElement | null;
const modalHandbook = document.getElementById('modalHandbook') as HTMLElement | null;
const btnCloseHandbook = document.getElementById('btnCloseHandbook') as HTMLButtonElement | null;

// DEFCON Alert Modal DOM
const modalDefconAlert = document.getElementById('modalDefconAlert') as HTMLElement | null;
const defconBanner = document.getElementById('defconBanner') as HTMLElement | null;
const defconTitle = document.getElementById('defconTitle') as HTMLElement | null;
const defconBadge = document.getElementById('defconBadge') as HTMLElement | null;
const teletypeBox = document.getElementById('teletypeBox') as HTMLElement | null;
const debriefTime = document.getElementById('debriefTime') as HTMLElement | null;
const debriefHints = document.getElementById('debriefHints') as HTMLElement | null;
const debriefRating = document.getElementById('debriefRating') as HTMLElement | null;
const btnReviewEvidence = document.getElementById('btnReviewEvidence') as HTMLButtonElement | null;
const btnRestartDefcon = document.getElementById('btnRestartDefcon') as HTMLButtonElement | null;

const modalBriefing = document.getElementById('modalBriefing') as HTMLElement;
const btnStartBriefing = document.getElementById('btnStartBriefing') as HTMLButtonElement;

const modalVictory = document.getElementById('modalVictory') as HTMLElement;
const btnRestartDossier = document.getElementById('btnRestartDossier') as HTMLButtonElement;
const unresolvedBadge = document.getElementById('unresolvedBadge') as HTMLElement;

// Systems
let isPaused = false;
let missionStartTime = Date.now();
const radio = new RadioEngine();
const oscRenderer = new OscilloscopeRenderer(crtCanvas);

// Settings persistence
interface DeadAirSettings {
  masterVol: number;
  staticVol: number;
  scanlines: number;
  curvature: boolean;
  theme: PhosphorTheme;
}

const SETTINGS_KEY = 'deadair_settings_v1';

function loadSettings(): DeadAirSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    masterVol: 80,
    staticVol: 100,
    scanlines: 16,
    curvature: true,
    theme: 'GREEN'
  };
}

let activeSettings = loadSettings();

function applyAndSaveSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(activeSettings));
  } catch {}

  radio.setVolume(activeSettings.masterVol / 100);
  radio.setStaticVolume(activeSettings.staticVol / 100);
  oscRenderer.setScanlineIntensity(activeSettings.scanlines / 100);
  oscRenderer.setCurvatureVignette(activeSettings.curvature);
  oscRenderer.setTheme(activeSettings.theme);

  if (optMasterVol) optMasterVol.value = activeSettings.masterVol.toString();
  if (optMasterVolVal) optMasterVolVal.textContent = `${activeSettings.masterVol}%`;
  if (optStaticVol) optStaticVol.value = activeSettings.staticVol.toString();
  if (optStaticVolVal) optStaticVolVal.textContent = `${activeSettings.staticVol}%`;
  if (optScanlines) optScanlines.value = activeSettings.scanlines.toString();
  if (optScanlinesVal) optScanlinesVal.textContent = `${activeSettings.scanlines}%`;
  if (btnToggleCurvature) {
    if (activeSettings.curvature) {
      btnToggleCurvature.classList.add('active');
      btnToggleCurvature.textContent = 'ENABLED';
    } else {
      btnToggleCurvature.classList.remove('active');
      btnToggleCurvature.textContent = 'DISABLED';
    }
  }
  document.querySelectorAll('.btn-theme-choice').forEach(b => {
    const t = b.getAttribute('data-theme');
    if (t === activeSettings.theme) b.classList.add('active');
    else b.classList.remove('active');
  });
  if (themeLabel) {
    themeLabel.textContent = oscRenderer.getThemeName();
  }
}

// Initialise settings
applyAndSaveSettings();

function showDefconAlert(): void {
  if (!modalDefconAlert) {
    modalVictory.classList.remove('hidden');
    return;
  }
  modalDefconAlert.classList.remove('hidden');

  const elapsedMs = Date.now() - missionStartTime;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
  const timeFormatted = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`;

  if (debriefTime) debriefTime.textContent = timeFormatted;

  let totalHints = 0;
  for (const sig of MYSTERY_SIGNALS) {
    totalHints += notebook.getRevealedHintLevel(sig.id);
  }

  if (debriefHints) {
    debriefHints.textContent = `${totalHints} HINTS UTILIZED`;
  }

  if (debriefRating) {
    if (totalHints === 0) debriefRating.textContent = 'MASTER SIGINT CRYPTANALYST (EXEMPLARY)';
    else if (totalHints <= 3) debriefRating.textContent = 'VETERAN COMINT OPERATIVE';
    else debriefRating.textContent = 'TACTICAL LISTENING SPECIALIST';
  }

  const lines = [
    'FLASH PRIORITY // TELEX 83-X99 // STRATEGIC AIR COMMAND',
    'ORIGIN: CHEYENNE MOUNTAIN UNDERGROUND CRYPTOGRAPHIC VAULT',
    'TO: LISTENING OUTPOST ECHO-4, SHEMYA ISLAND',
    'SUBJECT: EMERGENCY WAR ORDER DE-ESCALATION (OPERATION AURA)',
    '------------------------------------------------------------',
    '1. ALL 5 HIGH-LATITUDE IONOSPHERIC CIPHERS RESOLVED.',
    '2. CONFIRMED CONTACTS:',
    '   - OUTPOST ECHO DISTRESS RECONSTRUCTED (124.5 MHz)',
    '   - SOVIET K-429 SUBMARINE BYPASS AUTHENTICATED [7391] (285.4 MHz)',
    '   - BUNKER NEXUS 1000Hz FEEDBACK LOOP CLEARED [NEXUS] (340.8 MHz)',
    '   - ORBITAL RECON SPECTRAL WATERFALL EXTRACTED [ICARUS] (415.0 MHz)',
    '   - 4x TAPE BURST CALLSIGN DECIPHERED [VOID] (502.4 MHz)',
    '3. ANOMALOUS IONOSPHERIC CONVERGENCE HAS CEASED.',
    '4. DEFCON ALERT POSTURE DE-ESCALATED: DEFCON 2 ==> DEFCON 5.',
    '5. AIR MOBILITY COMMAND DISPATCHED: CALLSIGN DUSTOFF-4.',
    '   EXTRACTION HELICOPTER INBOUND TO WEATHER STATION PAD.',
    'MISSION ACCOMPLISHED. STAND DOWN OPERATOR.'
  ];

  if (teletypeBox) {
    teletypeBox.textContent = '';
    let currentLine = 0;
    let charIdx = 0;

    if (defconBadge) {
      defconBadge.className = 'defcon-badge';
      defconBadge.textContent = 'DEFCON 2';
    }
    if (defconBanner) {
      defconBanner.className = 'defcon-banner';
    }
    if (defconTitle) {
      defconTitle.textContent = 'ALERT: DEFCON 2 // IONOSPHERIC THREAT RESOLVED';
      defconTitle.style.color = '#ef4444';
    }

    const typeNext = () => {
      if (currentLine >= lines.length) {
        if (defconBadge) {
          defconBadge.className = 'defcon-badge green';
          defconBadge.textContent = 'DEFCON 5';
        }
        if (defconBanner) {
          defconBanner.className = 'defcon-banner deescalated';
        }
        if (defconTitle) {
          defconTitle.textContent = 'CLEARED: DEFCON 5 // EMERGENCY WAR ORDER STAND DOWN';
          defconTitle.style.color = '#00ffaa';
        }
        radio.playCarrierLockChime();
        return;
      }

      const line = lines[currentLine];
      if (charIdx < line.length) {
        teletypeBox.textContent += line[charIdx];
        if (charIdx % 3 === 0) radio.playDialTick();
        charIdx++;
        setTimeout(typeNext, 12);
      } else {
        teletypeBox.textContent += '\n';
        currentLine++;
        charIdx = 0;
        teletypeBox.scrollTop = teletypeBox.scrollHeight;
        setTimeout(typeNext, 80);
      }
    };

    setTimeout(typeNext, 200);
  }
}

const notebook = new NotebookManager(() => {
  showDefconAlert();
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

let lastTickTime = 0;

// Frequency controls
function updateFrequency(freq: number): void {
  const clamped = Math.max(80.0, Math.min(520.0, parseFloat(freq.toFixed(1))));
  const changed = Math.abs(radio.getParams().frequencyMHz - clamped) > 0.04;
  radio.setFrequency(clamped);
  freqSlider.value = clamped.toString();
  freqText.textContent = `${clamped.toFixed(2)} MHz`;
  sliderVal.textContent = `${clamped.toFixed(1)} MHz`;

  if (changed) {
    const now = performance.now();
    if (now - lastTickTime > 35) {
      radio.playDialTick();
      lastTickTime = now;
    }
  }
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

btnMorseRef.addEventListener('click', () => {
  modalMorse.classList.remove('hidden');
});

btnCloseMorse.addEventListener('click', () => {
  modalMorse.classList.add('hidden');
});

function restartDossierGame(): void {
  modalVictory.classList.add('hidden');
  modalDefconAlert?.classList.add('hidden');
  notebook.resetNotebook();
  missionStartTime = Date.now();
  updateUnresolvedBadge();
  updateFrequency(100.0);
}

btnRestartDossier.addEventListener('click', restartDossierGame);
btnRestartDefcon?.addEventListener('click', restartDossierGame);
btnReviewEvidence?.addEventListener('click', () => {
  modalDefconAlert?.classList.add('hidden');
  openEvidenceBoard();
});

// Options / Settings modal events
function openSettingsModal(): void {
  modalSettings?.classList.remove('hidden');
}

function closeSettingsModal(): void {
  modalSettings?.classList.add('hidden');
}

btnSettings?.addEventListener('click', openSettingsModal);
btnCloseSettings?.addEventListener('click', closeSettingsModal);

// Handbook modal events
function openHandbookModal(): void {
  modalHandbook?.classList.remove('hidden');
}

function closeHandbookModal(): void {
  modalHandbook?.classList.add('hidden');
}

btnHandbook?.addEventListener('click', openHandbookModal);
btnCloseHandbook?.addEventListener('click', closeHandbookModal);

// Settings Sliders & Toggles
if (optMasterVol) {
  optMasterVol.addEventListener('input', () => {
    activeSettings.masterVol = parseInt(optMasterVol.value, 10);
    applyAndSaveSettings();
  });
}

if (optStaticVol) {
  optStaticVol.addEventListener('input', () => {
    activeSettings.staticVol = parseInt(optStaticVol.value, 10);
    applyAndSaveSettings();
  });
}

if (optScanlines) {
  optScanlines.addEventListener('input', () => {
    activeSettings.scanlines = parseInt(optScanlines.value, 10);
    applyAndSaveSettings();
  });
}

if (btnToggleCurvature) {
  btnToggleCurvature.addEventListener('click', () => {
    activeSettings.curvature = !activeSettings.curvature;
    applyAndSaveSettings();
  });
}

document.querySelectorAll('.btn-theme-choice').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.getAttribute('data-theme') as PhosphorTheme;
    if (theme) {
      activeSettings.theme = theme;
      applyAndSaveSettings();
    }
  });
});

if (btnToggleFullscreen) {
  btnToggleFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}

// Global Keyboard Navigation
window.addEventListener('keydown', (e) => {
  // Toggle Settings [O]
  if (e.key === 'o' || e.key === 'O') {
    const isInputActive = ['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase());
    if (!isInputActive) {
      e.preventDefault();
      if (modalSettings?.classList.contains('hidden')) {
        openSettingsModal();
      } else {
        closeSettingsModal();
      }
      return;
    }
  }

  // Toggle Handbook [H]
  if (e.key === 'h' || e.key === 'H') {
    const isInputActive = ['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase());
    if (!isInputActive) {
      e.preventDefault();
      if (modalHandbook?.classList.contains('hidden')) {
        openHandbookModal();
      } else {
        closeHandbookModal();
      }
      return;
    }
  }

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
    activeSettings.theme = oscRenderer.getTheme();
    applyAndSaveSettings();
    return;
  }

  // Close modals on Escape in hierarchical order
  if (e.key === 'Escape') {
    if (!modalSettings?.classList.contains('hidden')) {
      modalSettings?.classList.add('hidden');
    } else if (!modalHandbook?.classList.contains('hidden')) {
      modalHandbook?.classList.add('hidden');
    } else if (!modalDefconAlert?.classList.contains('hidden')) {
      modalDefconAlert?.classList.add('hidden');
    } else if (!modalEvidenceBoard?.classList.contains('hidden')) {
      modalEvidenceBoard?.classList.add('hidden');
    } else if (!modalStationLogs?.classList.contains('hidden')) {
      modalStationLogs?.classList.add('hidden');
    } else if (!modalDossier?.classList.contains('hidden')) {
      modalDossier?.classList.add('hidden');
    } else if (!modalMorse?.classList.contains('hidden')) {
      modalMorse?.classList.add('hidden');
    } else if (!modalPause?.classList.contains('hidden')) {
      modalPause?.classList.add('hidden');
    }
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

let prevLockedSignalId: string | null = null;

// Render loop at 60fps
function renderLoop(): void {
  if (!isPaused) {
    const analyser = radio.getAnalyser();
    const metrics = radio.getReceptionMetrics();
    const powerOn = radio.getParams().powerOn;
    const tapeStatus = radio.getTapeStatus();

    // Carrier lock resonance audio stinger
    if (powerOn && metrics.tunedSignal && metrics.signalStrength > 0.8 && Math.abs(metrics.heterodynePitchHz) < 150) {
      if (prevLockedSignalId !== metrics.tunedSignal.id) {
        radio.playCarrierLockChime();
        prevLockedSignalId = metrics.tunedSignal.id;
      }
    } else if (!metrics.tunedSignal || metrics.signalStrength < 0.4) {
      prevLockedSignalId = null;
    }

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

