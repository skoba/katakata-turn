import { panel, element } from './dom';
import { ui, logMessages, logLevels, logSources } from '../scenario/messages';
import { scenes, type Scene } from '../scenario/scenes';

export function createEventLog() {
  const { root, body } = panel(ui.panel.log, ui.subtitles.log);
  body.classList.add('event-list');
  let sequence = 0;
  function scrollToLatest() {
    body.scrollTop = body.scrollHeight;
    body.classList.toggle('log-overflow', body.scrollTop > 0);
  }
  new ResizeObserver(scrollToLatest).observe(body);
  function append(message: string, scene: Scene, date: Date) {
    const line = element('div', 'log-row');
    line.dataset.tone = scenes[scene].tone;
    const time = `${date.toLocaleTimeString('ja-JP', { hour12: false })}.${String(date.getMilliseconds()).padStart(3, '0')}`;
    line.append(
      element('span', 'log-time', time),
      element(
        'span',
        'log-level',
        logLevels[scenes[scene].tone as keyof typeof logLevels],
      ),
      element('span', 'log-source', logSources[sequence % logSources.length]),
      element('span', 'log-message', message),
    );
    sequence++;
    body.append(line);
    while (body.childElementCount > 200) body.firstElementChild!.remove();
    scrollToLatest();
  }
  return {
    root,
    append,
    ambient(scene: Scene, date: Date) {
      const pool = logMessages[scene];
      append(pool[sequence % pool.length], scene, date);
    },
    reset() {
      body.replaceChildren();
      sequence = 0;
      scrollToLatest();
    },
  };
}
