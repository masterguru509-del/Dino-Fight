class SoundSystem {
  private ctx: AudioContext | null = null;
  public isMuted = false;
  private isMusicPlaying = false;
  private bgmTimeoutId: number | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  public init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.isMusicPlaying && !this.isMuted) {
        this.startBgm();
      }
      return;
    }
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.18;
      this.bgmGain.connect(this.ctx.destination);

      if (!this.isMuted) {
        this.startBgm();
      }
    } catch {
      // ignore audio errors
    }
  }

  public toggleMute(): boolean {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.85;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.18;
    }
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.init();
    if (this.isMusicPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  public startBgm() {
    if (this.isMusicPlaying) return;
    if (!this.ctx || !this.bgmGain) return;
    this.isMusicPlaying = true;
    this.playNextMelodyLoop();
  }

  public stopBgm() {
    this.isMusicPlaying = false;
    if (this.bgmTimeoutId !== null) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
  }

  private playNextMelodyLoop() {
    if (!this.isMusicPlaying || !this.ctx || !this.bgmGain) return;
    const now = this.ctx.currentTime;
    const tempo = 0.28;

    const melody = [
      { f: 523.25, d: 0.25, b: 1 }, // C5
      { f: 659.25, d: 0.25, b: 1 }, // E5
      { f: 783.99, d: 0.45, b: 2 }, // G5
      { f: 659.25, d: 0.25, b: 1 }, // E5
      { f: 880.0, d: 0.5, b: 2 },   // A5
      { f: 783.99, d: 0.4, b: 1 },  // G5
      { f: 587.33, d: 0.25, b: 1 }, // D5
      { f: 698.46, d: 0.25, b: 1 }, // F5
      { f: 783.99, d: 0.45, b: 2 }, // G5
      { f: 659.25, d: 0.25, b: 1 }, // E5
      { f: 587.33, d: 0.25, b: 1 }, // D5
      { f: 523.25, d: 0.65, b: 2 }, // C5
    ];

    let cursor = now + 0.05;
    let totalBeats = 0;

    melody.forEach((note) => {
      const beatLen = note.b * tempo;
      totalBeats += note.b;
      if (note.f > 0 && !this.isMuted && this.ctx && this.bgmGain) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, cursor);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(note.f * 0.5, cursor);

        gain.gain.setValueAtTime(0, cursor);
        gain.gain.linearRampToValueAtTime(0.14, cursor + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, cursor + note.d * 1.5);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(cursor);
        osc2.start(cursor);
        osc.stop(cursor + note.d * 1.6);
        osc2.stop(cursor + note.d * 1.6);
      }
      cursor += beatLen;
    });

    const loopMs = totalBeats * tempo * 1000;
    this.bgmTimeoutId = window.setTimeout(() => {
      if (this.isMusicPlaying) {
        this.playNextMelodyLoop();
      }
    }, loopMs - 80);
  }

  public tone(f: number, d: number, t: OscillatorType = 'sine', v = 0.15) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = t;
      o.frequency.value = f;
      g.gain.setValueAtTime(v, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
      o.connect(g);
      g.connect(this.masterGain);
      o.start();
      o.stop(this.ctx.currentTime + d);
    } catch {
      // ignore
    }
  }

  public shoot() {
    this.tone(880, 0.08, 'triangle', 0.12);
    this.tone(440, 0.12, 'sine', 0.09);
  }

  public shootDual() {
    this.tone(990, 0.08, 'triangle', 0.13);
    this.tone(880, 0.1, 'triangle', 0.11);
  }

  public jump() {
    this.tone(340, 0.07, 'sine', 0.12);
    setTimeout(() => this.tone(540, 0.11, 'sine', 0.1), 40);
  }

  public hit() {
    this.tone(180, 0.18, 'sawtooth', 0.18);
    this.tone(90, 0.22, 'sine', 0.12);
  }

  public poison() {
    this.tone(300, 0.1, 'sine', 0.12);
    setTimeout(() => this.tone(450, 0.15, 'sine', 0.1), 60);
  }

  public coin() {
    const notes = [987.77, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.tone(freq, 0.22, 'sine', 0.15), idx * 65);
    });
  }

  public powerup() {
    this.tone(523, 0.1, 'sine', 0.12);
    setTimeout(() => this.tone(659, 0.1, 'sine', 0.12), 80);
    setTimeout(() => this.tone(784, 0.15, 'sine', 0.12), 160);
  }

  public chestOpen() {
    this.powerup();
  }

  public star() {
    [784, 988, 1319, 1568].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.15, 'sine', 0.18), i * 90)
    );
  }

  public merge() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.12, 'triangle', 0.15), i * 70)
    );
  }

  public armor() {
    this.tone(320, 0.1, 'square', 0.12);
    setTimeout(() => this.tone(480, 0.15, 'square', 0.12), 60);
  }

  public block() {
    this.tone(1500, 0.06, 'square', 0.09);
  }

  public fireball() {
    this.tone(200, 0.15, 'sawtooth', 0.15);
    this.tone(150, 0.25, 'triangle', 0.12);
  }

  public drop() {
    this.tone(120, 0.4, 'sawtooth', 0.15);
    this.tone(80, 0.6, 'sine', 0.12);
  }

  public pickup() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.15, 'sine', 0.15), i * 80)
    );
  }

  public dropGet() {
    this.pickup();
  }

  public evolve() {
    [392, 523, 659, 784, 1047, 1319].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.2, 'triangle', 0.2), i * 100)
    );
  }

  public evoUp() {
    this.evolve();
  }

  public victory() {
    [440, 554.37, 659.25, 880].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.25, 'triangle', 0.18), i * 120)
    );
  }

  public win() {
    this.victory();
  }

  public defeat() {
    [392, 349, 311, 262].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.3, 'sawtooth', 0.15), i * 150)
    );
  }

  public lose() {
    this.defeat();
  }
}

export const AudioEngine = new SoundSystem();
