/**
 * Procedural sound effects (PLAN M5: chomp SFX), synthesized with WebAudio so
 * there are no audio files to load. Every sound is short, soft and silly
 * (game design §2: silly, never scary). The context unlocks on the first user
 * gesture (mobile autoplay rules); before that, calls are silent no-ops.
 */
export type SfxName = 'chomp' | 'gulp' | 'burp' | 'squeak' | 'chime' | 'pop';

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  volume = 0.6;

  /** Call from a user gesture (pointerdown / keydown). */
  unlock(): void {
    if (this.ctx || typeof AudioContext === 'undefined') {
      void this.ctx?.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);
    // A short buffer of hashed noise (deterministic, no Math.random).
    const n = ctx.sampleRate * 0.5;
    this.noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let x = 12345;
    for (let i = 0; i < n; i++) {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      d[i] = (x / 0x7fffffff) * 2 - 1;
    }
  }

  /** `size` scales the sound (a bigger belly, a bigger burp), 0–1. */
  play(name: SfxName, size = 0.5): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'chomp':
        // A crunchy bite: a filtered noise crunch over a soft low "nom".
        this.burst(t, 0.09, 1800, 2.5, 0.5);
        this.burst(t + 0.05, 0.07, 1200, 2, 0.35);
        this.tone(t, 'sine', 220, 140, 0.12, 0.35);
        break;
      case 'gulp':
        this.tone(t, 'sine', 520, 160, 0.18, 0.4);
        break;
      case 'burp': {
        // A long wobbly "buuurp": a low, buzzy voice with vibrato, bigger with the belly.
        const dur = 0.45 + 0.6 * size;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140 - 50 * size, t);
        osc.frequency.linearRampToValueAtTime(110 - 40 * size, t + dur);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 22;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 18;
        lfo.connect(lfoGain).connect(osc.frequency);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 700;
        const g = this.envelope(t, 0.04, dur, 0.5);
        osc.connect(lp).connect(g).connect(out);
        osc.start(t);
        lfo.start(t);
        osc.stop(t + dur + 0.05);
        lfo.stop(t + dur + 0.05);
        break;
      }
      case 'squeak':
        // Boing: a squeaky-toy landing (game design §4).
        this.tone(t, 'square', 900, 1500, 0.08, 0.12);
        this.tone(t + 0.07, 'square', 1500, 1100, 0.08, 0.1);
        break;
      case 'chime':
        // Power up: a little rising arpeggio.
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(t + i * 0.07, 'triangle', f, f, 0.25, 0.22),
        );
        break;
      case 'pop':
        this.tone(t, 'sine', 700, 1200, 0.06, 0.25);
        break;
    }
  }

  private envelope(t: number, attack: number, dur: number, peak: number): GainNode {
    const ctx = this.ctx as AudioContext;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return g;
  }

  private tone(
    t: number,
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    peak: number,
  ): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    osc.connect(this.envelope(t, 0.01, dur, peak)).connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(t: number, dur: number, freq: number, q: number, peak: number): void {
    const ctx = this.ctx;
    const out = this.master;
    if (!ctx || !out || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    src
      .connect(bp)
      .connect(this.envelope(t, 0.005, dur, peak))
      .connect(out);
    src.start(t, (freq % 7) * 0.05);
    src.stop(t + dur + 0.02);
  }
}
