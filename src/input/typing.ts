import { commands } from '../scenario/commands';
import { integer, type Random } from '../engine/rng';

export class TypingBuffer {
  readonly lines: string[] = [];
  index = 0;
  position = 0;
  private pending: { at: number; output: readonly string[] }[] = [];

  constructor(private random: Random) {}
  get current(): string {
    return commands[this.index].command.slice(0, this.position);
  }
  get pendingAt(): number | null {
    return this.pending[0]?.at ?? null;
  }

  private append(line: string): void {
    this.lines.push(line);
    if (this.lines.length > 100) this.lines.shift();
  }

  press(now: number): number {
    const count = integer(this.random, 3, 6);
    const before = this.position;
    this.position = Math.min(
      commands[this.index].command.length,
      this.position + count,
    );
    const written = this.position - before;
    if (this.position === commands[this.index].command.length)
      this.complete(now);
    return written;
  }

  complete(now: number): void {
    const entry = commands[this.index];
    this.append(entry.command);
    this.pending.push({
      at: now + integer(this.random, 80, 200),
      output: entry.output,
    });
    if (this.pending.length > 100) this.pending.shift();
    this.index = (this.index + 1) % commands.length;
    this.position = 0;
  }

  tick(now: number): void {
    for (let i = 0; i < this.pending.length;) {
      if (now >= this.pending[i].at) {
        for (const line of this.pending[i].output) this.append(line);
        this.pending.splice(i, 1);
      } else i++;
    }
  }

  reset(): void {
    this.lines.length = 0;
    this.index = this.position = 0;
    this.pending.length = 0;
  }
}
