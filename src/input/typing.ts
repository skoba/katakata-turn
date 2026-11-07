import { commands } from '../scenario/commands';
import { integer, type Random } from '../engine/rng';

export class TypingBuffer {
  readonly lines: string[] = [];
  index = 0;
  position = 0;
  pendingAt: number | null = null;

  constructor(private random: Random) {}
  get current(): string { return commands[this.index].command.slice(0, this.position); }

  private append(line: string): void {
    this.lines.push(line);
    if (this.lines.length > 100) this.lines.shift();
  }

  press(now: number): number {
    if (this.pendingAt !== null) return 0;
    const count = integer(this.random, 3, 6);
    const before = this.position;
    this.position = Math.min(commands[this.index].command.length, this.position + count);
    if (this.position === commands[this.index].command.length) this.pendingAt = now + integer(this.random, 80, 200);
    return this.position - before;
  }

  complete(now: number): void {
    this.position = commands[this.index].command.length;
    this.pendingAt ??= now + integer(this.random, 80, 200);
  }

  tick(now: number): void {
    if (this.pendingAt === null || now < this.pendingAt) return;
    const entry = commands[this.index];
    this.append(entry.command);
    for (const line of entry.output) this.append(line);
    this.index = (this.index + 1) % commands.length;
    this.position = 0;
    this.pendingAt = null;
  }

  reset(): void {
    this.lines.length = 0;
    this.index = this.position = 0;
    this.pendingAt = null;
  }
}
