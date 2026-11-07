import { panel, element } from './dom';
import { intelCopy, intelTime } from '../scenario/intel';
import type { Intel } from '../engine/intel';

export function createIntel() {
  const { root, body } = panel(intelCopy.title, intelCopy.subtitle);
  root
    .querySelector('.panel-heading')!
    .append(element('span', 'intel-disclaimer', intelCopy.disclaimer));
  const advisory = element('div', 'intel-feed');
  const cloud = element('div', 'intel-feed');
  const reloads = element('div', 'intel-reloads');
  const advisoryList = element('div', 'intel-list advisory-list');
  const cloudList = element('div', 'intel-list cloud-list');
  advisory.append(element('h3', '', intelCopy.advisory), advisoryList);
  cloud.append(element('h3', '', intelCopy.cloud), cloudList);
  body.append(advisory, cloud, reloads);
  let revision = -1;
  return {
    root,
    render(intel: Intel) {
      if (revision === intel.revision) return;
      revision = intel.revision;
      advisoryList.replaceChildren(
        ...intel.advisory.map((entry) => {
          const row = element('div', 'intel-entry');
          row.append(
            element('span', 'intel-source', entry.source),
            element('p', '', entry.summary),
          );
          return row;
        }),
      );
      cloudList.replaceChildren(
        ...intel.cloud.map((entry) => {
          const row = element('div', 'intel-entry');
          row.append(
            element('span', 'intel-source', entry.provider),
            element('p', '', `${entry.region}: ${entry.status}`),
            element(
              'div',
              'intel-updated',
              `${intelCopy.updated} ${intelTime(entry.updated)}`,
            ),
          );
          return row;
        }),
      );
      reloads.textContent = intelCopy.reloads(intel.reloads);
    },
  };
}
