// Web Audio API sound generator for scanner feedback

class SoundEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Single beep for standard barcode scan
  beep(freq = 1760, duration = 0.08, type: OscillatorType = 'sine') {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked by browser policy until interaction
    }
  }

  // Double beep when quantity was incremented on an existing line
  beepAggregated() {
    this.beep(1760, 0.06);
    setTimeout(() => {
      this.beep(2200, 0.08);
    }, 80);
  }

  // Triumphant chime for successful action confirmation
  chimeSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.beep(freq, 0.12, 'triangle');
        }, idx * 90);
      });
    } catch (e) {}
  }

  // Low buzz for errors or not found
  buzzError() {
    this.beep(220, 0.18, 'sawtooth');
  }
}

export const sound = new SoundEffects();
