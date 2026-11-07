import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/engine/scenario';
import { Complaints } from '../src/engine/complaints';
import { alertLevel } from '../src/engine/alert';
import { randomStreams } from '../src/engine/rng';
import { TURN_DURATION } from '../src/scenario/scenes';

describe('Phase 2 scene coordination', () => {
  it('preserves alert entry levels and reaches nominal with the last system', () => {
    for (const [scene, first, last] of [
      ['DETECT', '4', '3'],
      ['INCIDENT', '2', '1'],
    ] as const) {
      expect(alertLevel(scene, 0)).toBe(first);
      expect(alertLevel(scene, 2999)).toBe(first);
      expect(alertLevel(scene, 3000)).toBe(last);
    }
    expect(
      [0, 2125, 4250, 6375, 8500].map((t) => alertLevel('RECOVERY', t)),
    ).toEqual(['1', '2', '3', '4', '5']);
  });

  it('autoplays real turns once, loops for exhibition, and resets to manual', () => {
    const state = new Scenario();
    state.anyKey();
    state.toggleAutoplay();
    for (const scene of ['DETECT', 'INCIDENT', 'COUNTER']) {
      state.tick(19999);
      expect(state.scene).not.toBe(scene);
      state.tick(1);
      expect(state.scene).toBe(scene);
    }
    let turns = 0;
    state.turned.subscribe(() => turns++);
    state.tick(20_000);
    expect(state.busy).toBe(true);
    expect(state.enter()).toBe('ignored');
    expect(turns).toBe(1);
    state.tick(TURN_DURATION);
    expect(state.scene).toBe('RECOVERY');
    state.tick(20_000);
    expect(state.scene).toBe('END');
    state.tick(20_000);
    expect(state.scene).toBe('NORMAL');
    state.reset();
    expect(state.autoplay).toBe(false);
    state.tick(20_000);
    expect(state.scene).toBe('BOOT');
  });

  it('starts a fresh autoplay interval on toggle and manual jumps', () => {
    const state = new Scenario();
    state.go('NORMAL');
    state.tick(90_000);
    state.toggleAutoplay();
    state.tick(19_999);
    expect(state.scene).toBe('NORMAL');
    state.go('INCIDENT');
    state.tick(19_999);
    expect(state.scene).toBe('INCIDENT');
    state.toggleAutoplay();
    state.tick(90_000);
    expect(state.scene).toBe('INCIDENT');
  });

  it('shares outstanding and resolved complaints without counting them twice', () => {
    const model = new Complaints();
    model.update('INCIDENT', 30_000);
    expect(model.counts.reduce((a, b) => a + b)).toBe(29);
    expect(model.handled).toBe(0);
    model.update('RECOVERY', 4250);
    expect(model.handled + model.counts.reduce((a, b) => a + b)).toBe(29);
    model.update('RECOVERY', 8500);
    expect(model.handled).toBe(29);
    expect(model.counts.every((n) => n === 0)).toBe(true);
    model.update('END', 0);
    expect(model.handled).toBe(29);
    model.update('NORMAL', 0);
    expect(model.handled).toBe(0);
  });

  it('applies the query seed to every independent random stream', () => {
    for (const id of [0x544f504f, 0x54595045, 0x48415941, 0x484558, 0x525454]) {
      const a = randomStreams('?seed=123')(id);
      const b = randomStreams('?seed=123')(id);
      const c = randomStreams('?seed=456')(id);
      const sequence = Array.from({ length: 10 }, a);
      expect(sequence).toEqual(Array.from({ length: 10 }, b));
      expect(sequence).not.toEqual(Array.from({ length: 10 }, c));
    }
    expect(randomStreams('?seed=invalid')(1)()).toBe(randomStreams('')(1)());
    expect(randomStreams('?seed=')(1)()).toBe(randomStreams('')(1)());
  });
});
