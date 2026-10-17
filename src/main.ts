import { RadioEngine } from './audio/radioEngine';
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

const btnMorseRef = document.getElementById('btnMorseRef') as HTMLButtonElement;
const modalMorse = document.getElementById('modalMorse') as HTMLElement;
const btnCloseMorse = document.getElementById('btnCloseMorse') as HTMLButtonElement;

const modalVictory = document.getElementById('modalVictory') as HTMLElement;
const btnRestartDossier = document.getElementById('btnRestartDossier') as HTMLButtonElement;

// Engine & Renderers
const radio = new RadioEngine();
const oscRenderer = new OscilloscopeRenderer(crtCanvas);
new NotebookManager(() => {
  modalVictory.classList.remove('hidden');
});

// Power Button
btnPower.addEventListener('click', () => {
  const currentPower = radio.getParams().powerOn;
  const newPower = !currentPower;
  radio.setPower(newPower);

  if (newPower) {
    btnPower.classList.add('active');
    btnPower.textContent = 'SYSTEM POWER: ONLINE';
  } else {
    btnPower.classList.remove('active');
    btnPower.textContent = 'SYSTEM POWER: OFF';
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

// Modal listeners
btnMorseRef.addEventListener('click', () => {
  modalMorse.classList.remove('hidden');
});

btnCloseMorse.addEventListener('click', () => {
  modalMorse.classList.add('hidden');
});

btnRestartDossier.addEventListener('click', () => {
  modalVictory.classList.add('hidden');
});

// Render loop at 60fps
function renderLoop(): void {
  const analyser = radio.getAnalyser();
  const metrics = radio.getReceptionMetrics();
  const powerOn = radio.getParams().powerOn;

  oscRenderer.render(analyser, metrics, powerOn);
  requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);
