import { describe, expect, it } from 'vitest';
import { Scenario } from '../src/engine/scenario';
import { sceneOrder, TURN_DURATION } from '../src/scenario/scenes';

describe('manual scenario', () => {
  it('only leaves boot on input, visits every scene, and clamps navigation', () => {
    const state = new Scenario();
    state.tick(30_000);
    expect(state.scene).toBe('BOOT');
    expect(state.anyKey()).toBe(true);
    for (const scene of sceneOrder.slice(2)) {
      state.move(1);
      expect(state.scene).toBe(scene);
    }
    expect(state.move(1)).toBe(false);
    state.move(-1);
    expect(state.scene).toBe('RECOVERY');
    state.tick(90_000);
    expect(state.scene).toBe('RECOVERY');
  });
  it('locks all scene changes during a single eight-second turn', () => {
    const state = new Scenario();
    state.go('COUNTER');
    expect(state.enter()).toBe('turn');
    for (let i = 0; i < 100; i++) {
      expect(state.enter()).toBe('ignored');
      expect(state.go('END')).toBe(false);
      expect(state.reset()).toBe(false);
      state.move(-1);
    }
    state.tick(TURN_DURATION - 1);
    expect(state.scene).toBe('COUNTER');
    state.tick(1);
    expect(state.scene).toBe('RECOVERY');
    expect(state.busy).toBe(false);
    expect(state.elapsed).toBe(0);
  });
  it('accepts Enter elsewhere without advancing and resets state', () => {
    const state = new Scenario();
    state.go('INCIDENT');
    expect(state.enter()).toBe('accepted');
    expect(state.scene).toBe('INCIDENT');
    state.reset();
    expect(state.scene).toBe('BOOT');
    expect(state.elapsed).toBe(0);
  });
  it('notifies only on actual transitions and supports unsubscribe', () => {
    const state = new Scenario();
    const seen: string[] = [];
    const unsubscribe = state.changed.subscribe((scene) => seen.push(scene));
    state.go('NORMAL');
    state.go('NORMAL');
    unsubscribe();
    state.go('DETECT');
    expect(seen).toEqual(['NORMAL']);
  });
});
