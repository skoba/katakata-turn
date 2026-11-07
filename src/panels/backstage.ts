import { element } from './dom';
import { backstage, backstageTimeline } from '../scenario/backstage';
import { intelCopy } from '../scenario/intel';
import { ui } from '../scenario/messages';
export function createBackstage() {
  const root = element('aside', 'overlay backstage');
  root.hidden = true;
  const reloads = element('p', 'backstage-reloads');
  const handled = element('p', 'backstage-handled');
  const timeline = element('ol', 'backstage-timeline');
  for (const [time, text] of backstageTimeline) {
    const row = element('li');
    row.append(element('time', '', time), element('span', '', text));
    timeline.append(row);
  }
  root.append(
    element('div', 'eyebrow', backstage.intro),
    element('h2', '', backstage.title),
    element('p', '', backstage.description),
    timeline,
    element('h3', '', backstage.hospital),
    reloads,
    handled,
    element('p', 'close-hint', ui.close),
  );
  return {
    root,
    render(count: number, handledCount: number) {
      reloads.textContent = intelCopy.reloads(count);
      handled.textContent = backstage.handled(handledCount);
    },
  };
}
