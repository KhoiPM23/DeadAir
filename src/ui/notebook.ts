import { MYSTERY_SIGNALS } from '../audio/signals';

export class NotebookManager {
  private solvedSignals: Set<string> = new Set();
  private onAllSolvedCallback: (() => void) | null = null;

  constructor(onAllSolved?: () => void) {
    if (onAllSolved) this.onAllSolvedCallback = onAllSolved;
    this.renderNotebookDOM();
  }

  public checkSolution(signalId: string, userInput: string): boolean {
    const signal = MYSTERY_SIGNALS.find(s => s.id === signalId);
    if (!signal) return false;

    const normalizedInput = userInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const normalizedExpected = signal.expectedInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Allow partial match for "BASE ECHO" or "ECHO"
    const isCorrect = normalizedInput === normalizedExpected ||
      (signalId === 'signal-echo' && normalizedInput === 'ECHO');

    if (isCorrect) {
      this.solvedSignals.add(signalId);
      this.updateEntryUI(signalId, true);

      if (this.solvedSignals.size === MYSTERY_SIGNALS.length && this.onAllSolvedCallback) {
        this.onAllSolvedCallback();
      }
      return true;
    }
    return false;
  }

  public isAllSolved(): boolean {
    return this.solvedSignals.size === MYSTERY_SIGNALS.length;
  }

  private renderNotebookDOM(): void {
    if (typeof document === 'undefined') return;
    const listContainer = document.getElementById('signalsList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    MYSTERY_SIGNALS.forEach((sig) => {
      const card = document.createElement('div');
      card.className = 'signal-card';
      card.id = `card-${sig.id}`;

      card.innerHTML = `
        <div class="sig-header">
          <span class="sig-freq">${sig.frequencyMHz.toFixed(1)} MHz</span>
          <span class="sig-name">${sig.name}</span>
          <span id="badge-${sig.id}" class="sig-status">ENCRYPTED</span>
        </div>
        <div class="sig-hint">${sig.clueHint}</div>
        <div class="sig-input-group" id="input-group-${sig.id}">
          <input type="text" id="input-${sig.id}" class="sig-input" placeholder="Enter deduced answer..." />
          <button class="btn btn-verify" data-id="${sig.id}">VERIFY</button>
        </div>
      `;

      listContainer.appendChild(card);
    });

    // Attach listeners
    listContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('btn-verify')) {
        const sigId = target.getAttribute('data-id');
        if (sigId) {
          const inputEl = document.getElementById(`input-${sigId}`) as HTMLInputElement;
          if (inputEl) {
            const success = this.checkSolution(sigId, inputEl.value);
            if (!success) {
              inputEl.style.borderColor = '#ff4444';
              inputEl.animate([
                { transform: 'translateX(-4px)' },
                { transform: 'translateX(4px)' },
                { transform: 'translateX(0)' }
              ], { duration: 200, iterations: 2 });
            }
          }
        }
      }
    });
  }

  private updateEntryUI(sigId: string, solved: boolean): void {
    if (typeof document === 'undefined') return;
    const badge = document.getElementById(`badge-${sigId}`);
    const inputGroup = document.getElementById(`input-group-${sigId}`);
    const card = document.getElementById(`card-${sigId}`);

    if (badge && inputGroup && card) {
      if (solved) {
        badge.textContent = 'DECRYPTED';
        badge.classList.add('badge-decrypted');
        card.classList.add('card-solved');
        inputGroup.innerHTML = '<span class="solved-label">VERIFIED & CONFIRMED</span>';
      }
    }
  }
}
