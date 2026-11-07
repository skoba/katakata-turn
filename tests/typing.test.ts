import { describe, expect, it } from 'vitest';
import { createRng } from '../src/engine/rng';
import { TypingBuffer } from '../src/input/typing';
import { commands } from '../src/scenario/commands';

describe('typing buffer', () => {
  it('emits 3–6 seeded characters per key, with a final partial chunk', () => {
    const a = new TypingBuffer(createRng(123));
    const b = new TypingBuffer(createRng(123));
    while (a.pendingAt === null) {
      const remaining = commands[0].command.length - a.position;
      const n = a.press(0);
      b.press(0);
      expect(n).toBeGreaterThanOrEqual(Math.min(3, remaining));
      expect(n).toBeLessThanOrEqual(6);
      expect(a.current).toBe(b.current);
    }
    expect(a.current).toBe(commands[0].command);
    expect(a.pendingAt).toBeGreaterThanOrEqual(80);
    expect(a.pendingAt).toBeLessThanOrEqual(200);
  });
  it('delays output, ignores excess keys, then outputs a whole response exactly once', () => {
    const buffer = new TypingBuffer(createRng());
    buffer.complete(1000);
    const due = buffer.pendingAt!;
    buffer.press(1001); buffer.complete(1002);
    expect(buffer.pendingAt).toBe(due);
    buffer.tick(due - 1);
    expect(buffer.lines).toHaveLength(0);
    buffer.tick(due);
    expect(buffer.lines).toEqual([commands[0].command, ...commands[0].output]);
    buffer.tick(due + 1000);
    expect(buffer.index).toBe(1);
    expect(buffer.current).toBe('');
  });
  it('cycles commands and caps history through prolonged input; reset cancels pending output', () => {
    const buffer = new TypingBuffer(createRng());
    for (let i = 0; i < 500; i++) { buffer.complete(i * 300); buffer.tick(i * 300 + 200); }
    expect(buffer.lines.length).toBeLessThanOrEqual(100);
    expect(buffer.index).toBe(500 % commands.length);
    buffer.complete(200_000); buffer.reset(); buffer.tick(300_000);
    expect(buffer.lines).toHaveLength(0);
    expect(buffer.current).toBe('');
    expect(buffer.pendingAt).toBe(null);
  });
});
