import type { Scene } from '../scenario/scenes';
import { systemState } from './systems';
import type { Random } from './rng';

export const SAMPLE_LIMIT = 36;
export function latency(
  scene: Scene,
  elapsed: number,
  index: number,
): number | null {
  const state = systemState(scene, elapsed, index);
  if (state === 'down') return null;
  if (state === 'degraded')
    return index === 0
      ? Math.round(45 + Math.min(1, elapsed / 2500) * 335)
      : 185 + index * 7;
  return state === 'recovering' ? 120 : 12 + index * 3;
}

export class Telemetry {
  readonly samples: (number | null)[][];
  private elapsed = 0;
  constructor(
    count: number,
    private readonly random: Random,
  ) {
    this.samples = Array.from({ length: count }, () => []);
  }
  reset() {
    this.samples.forEach((row) => {
      row.length = 0;
    });
    this.elapsed = 0;
  }
  tick(delta: number, scene: Scene, elapsed: number) {
    this.elapsed += Math.max(0, Number.isFinite(delta) ? delta : 0);
    if (this.elapsed < 500) return;
    this.elapsed %= 500;
    this.samples.forEach((row, index) => {
      const value = latency(scene, elapsed, index);
      row.push(
        value === null
          ? null
          : Math.round(value * (0.92 + this.random() * 0.16)),
      );
      if (row.length > SAMPLE_LIMIT) row.shift();
    });
  }
}
