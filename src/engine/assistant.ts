import type { Random } from './rng';
import { STAGE_DURATION, STAGE_START, type Scene } from '../scenario/scenes';
import {
  assistantCopy,
  assistantCues,
  backstageConfession,
  sceneReports,
  situationReports,
} from '../scenario/assistant';

export const SPEECH_LIMIT = 20;
export const SPEECH_RATE = 35;
export type Speech = Readonly<{
  id: number;
  text: string;
  visible: string;
  complete: boolean;
}>;

/** Bounded FIFO, measured in Unicode code points; no DOM or wall clock. */
export class SpeechQueue {
  private history: Speech[] = [];
  private pending: string[] = [];
  private characters: string[] = [];
  private active: Speech | null = null;
  private elapsed = 0;
  private sequence = 0;

  get entries(): readonly Speech[] {
    return this.history;
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  get typing(): boolean {
    return this.active !== null;
  }

  clear(): void {
    this.history = [];
    this.pending = [];
    this.active = null;
    this.characters = [];
    this.elapsed = 0;
  }

  enqueue(text: string, interrupt = false): void {
    if (!text) return;
    if (interrupt) {
      this.pending = [];
      if (this.active) this.history.pop();
      this.active = null;
    }
    this.pending.push(text);
    if (this.pending.length > SPEECH_LIMIT) this.pending.shift();
    this.startNext();
  }

  private startNext(): void {
    if (this.active || !this.pending.length) return;
    const text = this.pending.shift()!;
    this.characters = Array.from(text);
    this.elapsed = 0;
    this.active = { id: ++this.sequence, text, visible: '', complete: false };
    this.history.push(this.active);
    if (this.history.length > SPEECH_LIMIT) this.history.shift();
  }

  tick(delta: number): void {
    let remaining = Number.isFinite(delta) ? Math.max(0, delta) : 0;
    while (this.active) {
      const duration = (this.characters.length * 1000) / SPEECH_RATE;
      const step = Math.min(remaining, duration - this.elapsed);
      this.elapsed += step;
      remaining -= step;
      const complete = this.elapsed >= duration;
      const count = complete
        ? this.characters.length
        : Math.floor((this.elapsed * SPEECH_RATE) / 1000);
      this.active = {
        ...this.active,
        visible: this.characters.slice(0, count).join(''),
        complete,
      };
      this.history[this.history.length - 1] = this.active;
      if (!complete) break;
      this.active = null;
      this.startNext();
      if (remaining <= 0) break;
    }
  }
}

/** Scripted assistant cues share the existing scenario / turn clocks. */
export class Assistant {
  readonly speech = new SpeechQueue();
  autonomy = true;
  confidence = 0;
  private scene: Scene = 'BOOT';
  private directorAnnounced = false;
  private inputAnnounced = false;
  private recoveryAnnounced = false;
  private confessionAnnounced = false;
  private completedStages = 0;

  constructor(private readonly random: Random) {}

  private say(text: string, interrupt = false): void {
    if (!this.autonomy) return;
    this.confidence = 0.75 + this.random() * 0.24;
    this.speech.enqueue(text, interrupt);
  }

  changeScene(scene: Scene): void {
    this.scene = scene;
    this.directorAnnounced = false;
    this.inputAnnounced = false;
    this.recoveryAnnounced = false;
    this.confessionAnnounced = false;
    this.completedStages = 0;
    if (scene === 'BOOT') {
      this.autonomy = true;
      this.speech.clear();
    }
    this.say(sceneReports[scene], true);
  }

  report(): void {
    this.say(situationReports[this.scene], true);
  }

  toggleAutonomy(): void {
    this.autonomy = !this.autonomy;
    if (this.autonomy) this.report();
    else {
      this.speech.clear();
      this.speech.enqueue(assistantCopy.silence);
    }
  }

  commandInput(): void {
    if (this.scene !== 'COUNTER' || this.inputAnnounced || !this.autonomy)
      return;
    this.inputAnnounced = true;
    this.say(assistantCues.typing, true);
  }

  showBackstage(): void {
    if (this.scene !== 'END' || this.confessionAnnounced || !this.autonomy)
      return;
    this.confessionAnnounced = true;
    this.say(backstageConfession, true);
  }

  tick(delta: number, elapsed: number, turn: number | null): void {
    // Advance existing text first: a new cue starts at this frame's boundary.
    this.speech.tick(delta);
    if (
      this.scene === 'INCIDENT' &&
      elapsed >= 2500 &&
      !this.directorAnnounced
    ) {
      this.directorAnnounced = true;
      this.say(assistantCues.director);
    }
    if (
      this.scene === 'RECOVERY' &&
      elapsed >= 8500 &&
      !this.recoveryAnnounced
    ) {
      this.recoveryAnnounced = true;
      this.say(assistantCues.recovered, true);
    }
    if (this.scene === 'COUNTER' && turn !== null) {
      while (
        this.completedStages < assistantCues.turn.length &&
        turn >= STAGE_START + (this.completedStages + 1) * STAGE_DURATION
      ) {
        this.say(assistantCues.turn[this.completedStages++], true);
      }
    }
  }
}
