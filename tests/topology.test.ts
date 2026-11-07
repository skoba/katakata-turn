import { describe, expect, it } from 'vitest';
import { systemState } from '../src/engine/systems';
import { topologyPhase } from '../src/engine/topology';
import { nodes, links } from '../src/scenario/topology';
import { systems } from '../src/scenario/systems';
import { STAGE_START, STAGE_DURATION } from '../src/scenario/scenes';

describe('topology scene integration', () => {
  it('changes shield and route at the corresponding turn stage completions', () => {
    const isolated = STAGE_START + STAGE_DURATION;
    const switched = isolated + STAGE_DURATION;
    expect(topologyPhase('COUNTER', null)).toMatchObject({
      shield: false,
      failover: false,
    });
    expect(topologyPhase('COUNTER', isolated - 1).shield).toBe(false);
    expect(topologyPhase('COUNTER', isolated)).toMatchObject({
      shield: true,
      failover: false,
    });
    expect(topologyPhase('COUNTER', switched - 1).failover).toBe(false);
    expect(topologyPhase('COUNTER', switched).failover).toBe(true);
    for (const scene of ['RECOVERY', 'END'] as const)
      expect(topologyPhase(scene, null)).toEqual({
        shield: true,
        failover: true,
        attacking: false,
      });
  });

  it('preserves system degradation and staggered recovery for both views', () => {
    expect(systemState('NORMAL', 0, 0)).toBe('nominal');
    expect(systemState('DETECT', 3000, 0)).toBe('degraded');
    expect(systemState('INCIDENT', 0, 0)).toBe('down');
    expect(systemState('INCIDENT', 0, 1)).toBe('degraded');
    expect(systemState('INCIDENT', 0, 2)).toBe('nominal');
    expect(systemState('RECOVERY', 849, 0)).toBe('recovering');
    expect(systemState('RECOVERY', 850, 0)).toBe('nominal');
    expect(systemState('RECOVERY', 850, 1)).toBe('recovering');
    expect(systemState('RECOVERY', 8500, 9)).toBe('nominal');
  });

  it('has valid system mappings, unique nodes and connected failover path', () => {
    const ids = nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const node of nodes) expect(systems[node.system]).toBeDefined();
    for (const link of links) {
      expect(ids).toContain(link.from);
      expect(ids).toContain(link.to);
    }
    expect(links).toContainEqual({ from: 'dr', to: 'vpn', route: 'dr' });
    expect(links).toContainEqual({ from: 'vpn', to: 'core' });
  });
});
