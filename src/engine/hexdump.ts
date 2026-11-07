import { packetFragments } from '../scenario/packets';
import type { Scene } from '../scenario/scenes';
import { integer, type Random } from './rng';

export const HEX_LIMIT = 24;
export class Hexdump {
  readonly lines: string[] = [];
  private elapsed = 0;
  private offset = 0;
  private fragment = 0;
  private position = 0;

  constructor(private readonly random: Random) {}

  reset() {
    this.lines.length = 0;
    this.offset = this.elapsed = this.fragment = this.position = 0;
  }

  tick(delta: number, scene: Scene) {
    this.elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    const interval = scene === 'INCIDENT' || scene === 'COUNTER' ? 120 : 650;
    // At most one window of retained lines per frame, even after a large delta.
    const count = Math.min(HEX_LIMIT, Math.floor(this.elapsed / interval));
    if (!count) return;
    this.elapsed %= interval;
    for (let i = 0; i < count; i++) {
      const text = packetFragments[this.fragment]
        .slice(this.position, this.position + 4)
        .padEnd(4, ' ');
      const hex = Array.from(text, (char) =>
        char.charCodeAt(0).toString(16).padStart(2, '0'),
      ).join(' ');
      this.lines.push(
        `${this.offset.toString(16).padStart(4, '0')}  ${hex}  ${text}`,
      );
      this.lines.splice(0, Math.max(0, this.lines.length - HEX_LIMIT));
      this.offset = (this.offset + 4) % 0x10000;
      this.position += 4;
      if (this.position >= packetFragments[this.fragment].length) {
        this.fragment = integer(this.random, 0, packetFragments.length - 1);
        this.position = 0;
      }
    }
  }
}
