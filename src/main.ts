import { RadioEngine } from './audio/radioEngine';
import { MYSTERY_SIGNALS } from './audio/signals';
import { FilterType } from './audio/types';
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
  const clamped = Math.max(80.0, Math.min(500.0, parseFloat(freq.toFixed(1))));
  radio.setFrequency(clamped);
  freqSlider.value = clamped.toString();
  freqText.textContent = `${clamped.toFixed(2)} MHz`;
  sliderVal.textContent = `${clamped.toFixed(1)} MHz`;
}

freqSlider.addEventListener('input', () => {
  updateFrequency(parseFloat(freqSlider.value));
});

document.querySelectorAll('.btn-step').forEach((btn) => {
  btn.addEventListener('click', () => {
    const delta = btn.getAttribute('data-delta');
    if (delta) {
      updateFrequency(radio.getParams().frequencyMHz + parseFloat(delta));
    }
  });
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
  // Pause
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
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

// Render loop at 60fps
function renderLoop(): void {
  if (!isPaused) {
    const analyser = radio.getAnalyser();
    const metrics = radio.getReceptionMetrics();
    const powerOn = radio.getParams().powerOn;

    oscRenderer.render(analyser, metrics, powerOn);
    updateUnresolvedBadge();
  }
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
