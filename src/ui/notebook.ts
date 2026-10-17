import { MYSTERY_SIGNALS } from '../audio/signals';

export class NotebookManager {
  private solvedSignals: Set<string> = new Set();
  private hintsRevealed: Map<string, number> = new Map();
  private onAllSolvedCallback: (() => void) | null = null;

  constructor(onAllSolved?: () => void) {
    if (onAllSolved) this.onAllSolvedCallback = onAllSolved;
    MYSTERY_SIGNALS.forEach(s => this.hintsRevealed.set(s.id, 0));
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

  public revealHint(signalId: string): number {
    const current = this.hintsRevealed.get(signalId) || 0;
    const signal = MYSTERY_SIGNALS.find(s => s.id === signalId);
    if (!signal) return current;

    if (current < signal.hints.length) {
      const nextLevel = current + 1;
      this.hintsRevealed.set(signalId, nextLevel);
      this.updateHintsUI(signalId);
      return nextLevel;
    }
    return current;
  }

  public getRevealedHintLevel(signalId: string): number {
    return this.hintsRevealed.get(signalId) || 0;
  }

  public isAllSolved(): boolean {
    return this.solvedSignals.size === MYSTERY_SIGNALS.length;
  }

  public getSolvedCount(): number {
    return this.solvedSignals.size;
  }

  public getTotalCount(): number {
    return MYSTERY_SIGNALS.length;
  }

  public resetNotebook(): void {
    this.solvedSignals.clear();
    MYSTERY_SIGNALS.forEach(s => this.hintsRevealed.set(s.id, 0));
    this.renderNotebookDOM();
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

        <!-- Graduated Hints Container -->
        <div id="hints-container-${sig.id}" class="hints-box hidden"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <button class="btn-hint" data-hint-id="${sig.id}">REQUEST HINT (0/3)</button>
          <span style="font-size: 10px; color: #64748b;">TARGET: ${sig.solutionKey}</span>
        </div>

        <div class="sig-input-group" id="input-group-${sig.id}">
          <input type="text" id="input-${sig.id}" class="sig-input" placeholder="Enter deduced answer..." />
          <button class="btn-verify" data-id="${sig.id}">VERIFY</button>
        </div>
      `;

      listContainer.appendChild(card);
    });

    // Attach listeners
    listContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Handle Verify
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

      // Handle Graduated Hint
      if (target.classList.contains('btn-hint')) {
        const sigId = target.getAttribute('data-hint-id');
        if (sigId) {
          this.revealHint(sigId);
        }
      }
    });
  }

  private updateHintsUI(sigId: string): void {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(`hints-container-${sigId}`);
    const btn = document.querySelector(`button[data-hint-id="${sigId}"]`) as HTMLButtonElement;
    const signal = MYSTERY_SIGNALS.find(s => s.id === sigId);
    if (!container || !btn || !signal) return;

    const level = this.hintsRevealed.get(sigId) || 0;
    btn.textContent = level >= signal.hints.length
      ? 'ALL HINTS UNLOCKED'
      : `REQUEST HINT (${level}/${signal.hints.length})`;

    if (level > 0) {
      container.classList.remove('hidden');
      container.innerHTML = '';
      for (let i = 0; i < level; i++) {
        const item = document.createElement('div');
        item.className = 'hint-entry';
        item.innerHTML = `<span class="hint-level">HINT ${i + 1}:</span> ${signal.hints[i]}`;
        container.appendChild(item);
      }
    }
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
        inputGroup.innerHTML = '<span class="solved-label">✓ INTEL VERIFIED & ARCHIVED</span>';
      }
    }
  }
}
