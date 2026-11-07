import { describe, expect, it } from 'vitest';
import { Intel } from '../src/engine/intel';

describe('external information simulation', () => {
  it('keeps the incident summary unchanged while update time and reloads advance', () => {
    const intel = new Intel();
    intel.changeScene('INCIDENT', 0);
    const status = intel.cloud[0].status;
    intel.tick(1999);
    expect(intel.reloads).toBe(0);
    intel.tick(1);
    expect(intel.reloads).toBe(1);
    expect(intel.cloud[0].updated).toBe(0);
    intel.tick(3000);
    expect(intel.reloads).toBe(2);
    expect(intel.cloud[0]).toMatchObject({ updated: 5000, status });
    expect(status).toContain('調査中');
    expect(intel.cloud[1].status).toBe('正常');
    intel.changeScene('RECOVERY', 5000);
    expect(intel.cloud[0].status).toBe('復旧');
    intel.tick(10000);
    expect(intel.reloads).toBe(2);
    intel.changeScene('END', 15000);
    expect(intel.reloads).toBe(2);
  });

  it('bounds both feeds across long stays and repeated scene navigation', () => {
    const intel = new Intel();
    intel.changeScene('INCIDENT', 0);
    for (let i = 0; i < 2000; i++) intel.tick(5000);
    expect(intel.cloud).toHaveLength(30);
    expect(intel.reloads).toBe(5000);
    for (let i = 0; i < 100; i++) {
      intel.changeScene('COUNTER', i);
      intel.changeScene('INCIDENT', i);
    }
    expect(intel.advisory).toHaveLength(30);
    expect(intel.cloud).toHaveLength(30);
    for (const scene of ['NORMAL', 'BOOT'] as const) {
      intel.changeScene(scene, 0);
      expect(intel.reloads).toBe(0);
      expect(intel.advisory).toHaveLength(1);
      expect(intel.cloud).toHaveLength(2);
    }
  });
});
