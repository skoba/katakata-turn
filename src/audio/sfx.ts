export type Sound = 'key' | 'beep' | 'warning' | 'turn' | 'chime';
const VOLUME = 0.18;
const VOICE_LIMIT = 24;

/** Synthesized locally; context creation / resume is called only by keydown. */
export class Sfx {
  muted = false;
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices = new Set<OscillatorNode>();
  private resuming: Promise<void> | null = null;
  private paused = false;
  private lastKey = -Infinity;

  async unlock(): Promise<void> {
    try {
      if (!this.context) {
        if (typeof AudioContext === 'undefined') return;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.applyVolume();
      }
      if (this.context.state === 'suspended') {
        if (!this.resuming) {
          this.resuming = this.context.resume().finally(() => {
            this.resuming = null;
          });
        }
        await this.resuming;
      }
    } catch {
      // Audio availability must never interrupt the presentation.
    }
  }

  setMuted(value: boolean) {
    this.muted = value;
    this.applyVolume();
  }

  setPaused(value: boolean) {
    this.paused = value;
    this.applyVolume();
  }

  private applyVolume() {
    if (this.master && this.context)
      this.master.gain.setValueAtTime(
        this.muted || this.paused ? 0 : VOLUME,
        this.context.currentTime,
      );
  }

  reset() {
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
    this.lastKey = -Infinity;
  }

  play(sound: Sound) {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || this.muted || this.paused) return;
    const now = ctx.currentTime;
    const tone = (
      frequency: number,
      duration: number,
      delay = 0,
      end = frequency,
      amplitude = 0.3,
    ) => {
      if (this.voices.size >= VOICE_LIMIT) return;
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      const start = now + delay;
      oscillator.type = sound === 'key' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(amplitude, start + 0.005);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
      oscillator.connect(envelope);
      envelope.connect(this.master!);
      this.voices.add(oscillator);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        this.voices.delete(oscillator);
      };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.01);
    };
    switch (sound) {
      case 'key':
        if (now - this.lastKey < 0.025) return;
        this.lastKey = now;
        tone(1100, 0.025, 0, 650, 0.12);
        break;
      case 'beep':
        tone(880, 0.07);
        break;
      case 'warning':
        tone(440, 0.15);
        tone(660, 0.18, 0.22);
        break;
      case 'turn':
        tone(110, 0.8, 0, 880, 0.5);
        tone(220, 0.65, 0.08, 1320);
        tone(55, 0.9, 0, 40, 0.4);
        break;
      case 'chime':
        [523.25, 659.25, 783.99].forEach((frequency, index) =>
          tone(frequency, 0.55, index * 0.16),
        );
        break;
    }
  }
}
