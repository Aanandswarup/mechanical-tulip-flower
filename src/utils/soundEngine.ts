/**
 * 100% procedural Web Audio API sound synthesizer for the Valkenburg No. IV
 * Horological Tulip Automaton. Generates Swiss lever escapement impulses,
 * gear-train ratchet clicks, and full-anthesis crystal resonance.
 */

class HorologicalSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private lastTickTime = 0;
  private tickPhase = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      this.ensureContext();
      this.playClick(920, 0.04);
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Subtle mechanical detent click for UI interactions and camera/finish switches.
   */
  public playClick(freq = 840, volume = 0.045): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.35, now + 0.025);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  /**
   * Called inside the animation loop; emits delicate horological escapement
   * tick-tock impulses paced to the tourbillon rotation.
   */
  public updateEscapementTick(elapsedSeconds: number, bloom: number, speedMultiplier: number): void {
    if (!this.enabled || speedMultiplier <= 0.01) return;
    // Interval between ticks: faster as bloom increases (from ~0.35s to ~0.22s)
    const interval = Math.max(0.14, (0.34 - bloom * 0.1) / Math.max(0.35, speedMultiplier));
    if (elapsedSeconds - this.lastTickTime < interval) return;

    this.lastTickTime = elapsedSeconds;
    this.tickPhase = (this.tickPhase + 1) % 2;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Alternate between pallet fork entry ("tick", higher pitch) and exit ("tock", slightly lower)
    const baseFreq = this.tickPhase === 0 ? 2450 : 2120;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.014);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, now);
    filter.Q.setValueAtTime(4.5, now);

    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.018);
  }

  /**
   * Soft harmonic bell chime when the flower reaches full bloom or resets.
   */
  public playBloomChime(): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const partials = [587.33, 880.0, 1174.66]; // D5, A5, D6 horological repeater chord

    partials.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.025 / (idx + 1), now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75 + idx * 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + 0.9);
    });
  }
}

export const soundEngine = new HorologicalSoundEngine();
