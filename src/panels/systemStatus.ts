import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import { systems, statuses, responseTime } from '../scenario/systems';
import type { Scene } from '../scenario/scenes';

export function createSystemStatus() {
  const { root, body } = panel(ui.panel.systems, ui.subtitles.systems);
  const rows = systems.map((name) => {
    const row = element('div', 'system-row');
    const status = element('span', 'system-state');
    const rtt = element('span', 'system-rtt');
    row.append(element('span', 'system-name', name), status, rtt);
    body.append(row);
    return { row, status, rtt };
  });
  return {
    root,
    render(scene: Scene, elapsed: number) {
      rows.forEach(({ row, status, rtt }, i) => {
        let state: keyof typeof statuses = 'nominal';
        if (scene === 'DETECT' && i === 0) state = 'degraded';
        if (scene === 'INCIDENT' || scene === 'COUNTER')
          state =
            i === 0 ? 'down' : [1, 4, 8].includes(i) ? 'degraded' : 'nominal';
        if (scene === 'RECOVERY')
          state = elapsed >= (i + 1) * 850 ? 'nominal' : 'recovering';
        row.dataset.status = state;
        status.textContent = statuses[state];
        rtt.textContent = responseTime(
          state === 'down'
            ? null
            : state === 'degraded'
              ? i === 0
                ? Math.round(45 + Math.min(1, elapsed / 2500) * 335)
                : 185 + i * 7
              : state === 'recovering'
                ? 120
                : 12 + i * 3,
        );
      });
    },
  };
}
