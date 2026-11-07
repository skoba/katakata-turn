import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import { systems, statuses, responseTime } from '../scenario/systems';
import { Telemetry, latency, SAMPLE_LIMIT } from '../engine/telemetry';
import type { Random } from '../engine/rng';
import { systemState } from '../engine/systems';
import type { Scene } from '../scenario/scenes';

export function createSystemStatus(random: Random) {
  const { root, body } = panel(ui.panel.systems, ui.subtitles.systems);
  const model = new Telemetry(systems.length, random);
  const rows = systems.map((name) => {
    const row = element('div', 'system-row');
    const status = element('span', 'system-state');
    const rtt = element('span', 'system-rtt');
    const spark = element('canvas', 'system-spark');
    spark.setAttribute('aria-hidden', 'true');
    row.append(element('span', 'system-name', name), status, rtt, spark);
    body.append(row);
    return { row, status, rtt, spark };
  });
  return {
    root,
    reset() {
      model.reset();
    },
    render(scene: Scene, elapsed: number, delta: number) {
      model.tick(delta, scene, elapsed);
      rows.forEach(({ row, status, rtt, spark }, i) => {
        const state = systemState(scene, elapsed, i);
        row.dataset.status = state;
        status.textContent = statuses[state];
        rtt.textContent = responseTime(latency(scene, elapsed, i));
        const ctx = spark.getContext('2d');
        if (!ctx) return;
        const width = spark.clientWidth;
        const height = spark.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        if (
          spark.width !== Math.round(width * dpr) ||
          spark.height !== Math.round(height * dpr)
        ) {
          spark.width = Math.round(width * dpr);
          spark.height = Math.round(height * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = getComputedStyle(status).color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        let previous = false;
        model.samples[i].forEach((value, index) => {
          if (value === null) {
            previous = false;
            return;
          }
          const x = 1 + (index * (width - 2)) / (SAMPLE_LIMIT - 1);
          const y = height - 2 - Math.min(1, value / 420) * (height - 4);
          if (previous) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          previous = true;
        });
        ctx.stroke();
      });
    },
  };
}
