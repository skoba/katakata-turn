import { element } from './dom';
import { ui } from '../scenario/messages';
import {
  scenes,
  turnStages,
  STAGE_START,
  STAGE_DURATION,
  type Scene,
} from '../scenario/scenes';

export function createBanner() {
  const root = element('div', 'banner');
  const message = element('span');
  root.append(message);
  const overlay = element('div', 'turn-overlay');
  overlay.hidden = true;
  overlay.append(
    element('div', 'turn-eyebrow', ui.deploying),
    element('h2', '', ui.deployed),
  );
  const bars = turnStages.map((label) => {
    const row = element('div', 'progress-row');
    const progress = element('progress');
    progress.max = 1;
    row.append(element('span', '', label), progress);
    overlay.append(row);
    return progress;
  });
  const stamp = element('div', 'denied-stamp', ui.denied);
  overlay.append(stamp);
  let notice = '';
  let noticeUntil = 0;
  return {
    root,
    overlay,
    clearNotice() {
      noticeUntil = 0;
    },
    notice(text: string, now: number, duration = 1600) {
      notice = text;
      noticeUntil = now + duration;
    },
    render(scene: Scene, elapsed: number, turn: number | null, now: number) {
      message.textContent =
        turn !== null
          ? ui.deployed
          : now < noticeUntil
            ? notice
            : scene === 'RECOVERY' && elapsed >= 8500
              ? scenes.END.banner
              : scenes[scene].banner;
      overlay.hidden = turn === null;
      bars.forEach((bar, i) => {
        bar.value =
          turn === null
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  (turn - STAGE_START - i * STAGE_DURATION) / STAGE_DURATION,
                ),
              );
      });
      stamp.hidden = turn === null || turn < 7100;
    },
  };
}
