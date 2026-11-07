import { describe, expect, it } from 'vitest';
import { Hexdump, HEX_LIMIT } from '../src/engine/hexdump';
import { latency, Telemetry, SAMPLE_LIMIT } from '../src/engine/telemetry';
import { createRng } from '../src/engine/rng';
import { packetFragments } from '../src/scenario/packets';

describe('bounded protocol and service telemetry', () => {
  it('encodes only safe protocol bytes, accelerates during incidents, and stays bounded', () => {
    const normal = new Hexdump(createRng(1));
    const incident = new Hexdump(createRng(1));
    normal.tick(1300, 'NORMAL');
    incident.tick(1300, 'INCIDENT');
    expect(normal.lines).toHaveLength(2);
    expect(incident.lines).toHaveLength(10);
    for (let i = 0; i < 5000; i++) incident.tick(650, 'INCIDENT');
    expect(incident.lines).toHaveLength(HEX_LIMIT);
    for (const line of incident.lines) {
      const [, hex, ascii] = line.match(
        /^[0-9a-f]{4}  ((?:[0-9a-f]{2} ){3}[0-9a-f]{2})  (.{4})$/,
      )!;
      const decoded = hex
        .split(' ')
        .map((byte) => String.fromCharCode(parseInt(byte, 16)))
        .join('');
      expect(decoded).toBe(ascii);
      expect(
        packetFragments.some((fragment) => fragment.includes(ascii.trim())),
      ).toBe(true);
    }
    incident.reset();
    expect(incident.lines).toEqual([]);
    incident.tick(650, 'NORMAL');
    expect(incident.lines[0]).toBe(normal.lines[0]);
  });

  it('reflects shared degradation, downtime gaps and recovery in bounded sparkline samples', () => {
    const model = new Telemetry(10, createRng());
    expect(latency('NORMAL', 0, 0)).toBe(12);
    expect(latency('DETECT', 2500, 0)).toBe(380);
    expect(latency('INCIDENT', 0, 0)).toBeNull();
    model.tick(500, 'NORMAL', 0);
    model.tick(500, 'INCIDENT', 0);
    expect(model.samples[0][0]).toBeTypeOf('number');
    expect(model.samples[0][1]).toBeNull();
    model.tick(500, 'RECOVERY', 0);
    expect(model.samples[0][2]).toBeGreaterThan(100);
    for (let i = 0; i < 10_000; i++) model.tick(500, 'END', 0);
    expect(model.samples.every((row) => row.length === SAMPLE_LIMIT)).toBe(
      true,
    );
    expect(model.samples[0].at(-1)).toBeLessThan(20);
    model.reset();
    expect(model.samples.every((row) => row.length === 0)).toBe(true);
  });
});
