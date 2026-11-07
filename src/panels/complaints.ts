import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import { complaintLabels, incidentCounts } from '../scenario/complaints';
import type { Scene } from '../scenario/scenes';

export function createComplaints() {
  const { root, body } = panel(ui.panel.complaints, ui.subtitles.complaints);
  const total = element('strong', 'complaint-total', '0');
  const metric = element('div', 'complaint-metric');
  metric.append(total, element('span', '', ui.complaintsUnit));
  const list = element('div', 'complaint-list');
  const items = complaintLabels.map((label, i) => {
    const row = element('div', i === 4 ? 'complaint-row director' : 'complaint-row');
    const count = element('strong');
    row.append(element('span', '', label), count); list.append(row);
    return { row, count };
  });
  const empty = element('div', 'complaint-empty', ui.noComplaints);
  body.append(metric, list, empty);
  return { root, render(scene: Scene, elapsed: number) {
    let sum = 0;
    items.forEach(({ row, count }, i) => {
      let value = scene === 'DETECT' && i === 0 ? 1 : ['INCIDENT', 'COUNTER', 'RECOVERY'].includes(scene) ? incidentCounts[i] : 0;
      if (scene === 'INCIDENT') value = Math.min(value, Math.max(i === 4 ? 1 : 0, Math.ceil(elapsed / 500) + 1));
      if (scene === 'RECOVERY') value = Math.ceil(value * Math.max(0, 1 - elapsed / 8500));
      sum += value;
      row.hidden = value === 0 && scene !== 'RECOVERY';
      row.classList.toggle('resolved', value === 0);
      count.textContent = value ? `×${value}` : ui.resolved;
    });
    total.textContent = String(sum);
    empty.hidden = sum > 0 || scene === 'RECOVERY';
  } };
}
