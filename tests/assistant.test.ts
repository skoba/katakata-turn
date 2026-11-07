import { describe, expect, it } from 'vitest';
import { Assistant, SPEECH_LIMIT, SpeechQueue } from '../src/engine/assistant';
import { createRng } from '../src/engine/rng';
import {
  STAGE_DURATION,
  STAGE_START,
  sceneOrder,
} from '../src/scenario/scenes';
import {
  assistantCopy,
  assistantCues,
  backstageConfession,
  sceneReports,
  situationReports,
} from '../src/scenario/assistant';

describe('bounded speech queue and typewriter', () => {
  it('reveals 35 Unicode characters per second without splitting a symbol', () => {
    const queue = new SpeechQueue();
    const text = 'あ🛡'.repeat(40);
    queue.enqueue(text);
    expect(queue.entries[0].visible).toBe('');
    queue.tick(1000);
    expect(queue.entries[0].visible).toBe(
      Array.from(text).slice(0, 35).join(''),
    );
    expect(queue.typing).toBe(true);
    queue.tick(2000);
    expect(queue.entries[0]).toMatchObject({
      text,
      visible: text,
      complete: true,
    });
    expect(queue.typing).toBe(false);
  });

  it('preserves FIFO order and carries unused time into the next utterance', () => {
    const queue = new SpeechQueue();
    queue.enqueue('あ'.repeat(35));
    queue.enqueue('い'.repeat(35));
    queue.tick(1200);
    expect(queue.entries.map((entry) => entry.visible)).toEqual([
      'あ'.repeat(35),
      'い'.repeat(7),
    ]);
    queue.tick(800);
    expect(queue.entries.every((entry) => entry.complete)).toBe(true);
  });

  it('bounds queued and retained speech even after a long burst of reports', () => {
    const queue = new SpeechQueue();
    for (let i = 0; i < 1000; i++) queue.enqueue(`発話${i}`);
    expect(queue.pendingCount).toBe(SPEECH_LIMIT);
    queue.tick(1_000_000);
    expect(queue.pendingCount).toBe(0);
    expect(queue.entries).toHaveLength(SPEECH_LIMIT);
    expect(queue.entries.at(-1)?.text).toBe('発話999');
    expect(queue.typing).toBe(false);
  });

  it('replaces unfinished / queued speech for a timely cue and retains completed history', () => {
    const queue = new SpeechQueue();
    queue.enqueue('完了');
    queue.tick(1000);
    queue.enqueue('あ'.repeat(100));
    queue.tick(100);
    queue.enqueue('古い待機発話');
    queue.enqueue('割込報告', true);
    expect(queue.entries.map((entry) => entry.text)).toEqual([
      '完了',
      '割込報告',
    ]);
    expect(queue.pendingCount).toBe(0);
    queue.tick(1000);
    expect(queue.entries.at(-1)?.visible).toBe('割込報告');
    queue.clear();
    expect(queue.entries).toEqual([]);
    expect(queue.typing).toBe(false);
  });

  it('ignores invalid time and empty speech', () => {
    const queue = new SpeechQueue();
    queue.enqueue('');
    expect(queue.entries).toHaveLength(0);
    queue.enqueue('発話');
    for (const delta of [-100, NaN, Infinity]) queue.tick(delta);
    expect(queue.entries[0].visible).toBe('');
  });
});

describe('scripted assistant', () => {
  it('automatically speaks in each scene and reports one sentence on demand', () => {
    const assistant = new Assistant(createRng(123));
    for (const scene of sceneOrder) {
      assistant.changeScene(scene);
      expect(assistant.speech.entries.at(-1)?.text).toBe(sceneReports[scene]);
      assistant.tick(2000, 2000, null);
      assistant.report();
      expect(assistant.speech.entries.at(-1)?.text).toBe(
        situationReports[scene],
      );
      expect(situationReports[scene].match(/。/g)).toHaveLength(1);
    }
  });

  it('announces growing complaints, command input and actual recovery once per visit', () => {
    const assistant = new Assistant(createRng());
    assistant.changeScene('INCIDENT');
    assistant.tick(2000, 2499, null);
    expect(assistant.speech.entries.at(-1)?.text).toBe(sceneReports.INCIDENT);
    assistant.tick(1, 2500, null);
    expect(assistant.speech.entries.at(-1)?.text).toBe(assistantCues.director);
    assistant.tick(2000, 4500, null);
    expect(assistant.speech.entries).toHaveLength(2);
    assistant.changeScene('COUNTER');
    for (let i = 0; i < 1000; i++) assistant.commandInput();
    expect(assistant.speech.entries.at(-1)?.text).toBe(assistantCues.typing);
    expect(assistant.speech.pendingCount).toBe(0);
    assistant.changeScene('RECOVERY');
    assistant.tick(2000, 8499, null);
    expect(assistant.speech.entries.at(-1)?.text).toBe(sceneReports.RECOVERY);
    assistant.tick(1, 8500, null);
    expect(assistant.speech.entries.at(-1)?.text).toBe(assistantCues.recovered);
    assistant.tick(2000, 10_500, null);
    expect(
      assistant.speech.entries.filter(
        (entry) => entry.text === assistantCues.recovered,
      ),
    ).toHaveLength(1);
  });

  it('starts each narration exactly when its progress bar completes, without a stale queue', () => {
    const assistant = new Assistant(createRng());
    assistant.changeScene('COUNTER');
    assistant.commandInput();
    assistantCues.turn.forEach((text, index) => {
      const end = STAGE_START + (index + 1) * STAGE_DURATION;
      assistant.tick(2200, end - 1, end - 1);
      expect(assistant.speech.entries.at(-1)?.text).not.toBe(text);
      assistant.tick(1, end, end);
      expect(assistant.speech.entries.at(-1)).toMatchObject({
        text,
        visible: '',
      });
      expect(assistant.speech.pendingCount).toBe(0);
    });
    assistant.tick(800, 7900, 7900);
    expect(assistant.speech.entries.at(-1)?.visible).toBe(
      assistantCues.turn[2],
    );
    expect(
      assistant.speech.entries.filter((entry) =>
        assistantCues.turn.includes(entry.text),
      ),
    ).toHaveLength(3);
  });

  it('speaks the replaceable confession only when BACKSTAGE opens in END', () => {
    const assistant = new Assistant(createRng());
    assistant.changeScene('NORMAL');
    assistant.showBackstage();
    expect(assistant.speech.entries.at(-1)?.text).toBe(sceneReports.NORMAL);
    assistant.changeScene('END');
    expect(assistant.speech.entries.at(-1)?.text).toBe(sceneReports.END);
    assistant.showBackstage();
    expect(assistant.speech.entries.at(-1)?.text).toBe(backstageConfession);
    assistant.tick(3000, 3000, null);
    assistant.showBackstage();
    expect(
      assistant.speech.entries.filter(
        (entry) => entry.text === backstageConfession,
      ),
    ).toHaveLength(1);
  });

  it('stays silent while OFF across reports, scene changes and automatic cues; reset restores ON', () => {
    const assistant = new Assistant(createRng());
    assistant.changeScene('NORMAL');
    assistant.toggleAutonomy();
    expect(assistant.autonomy).toBe(false);
    for (const scene of sceneOrder.slice(1)) {
      assistant.changeScene(scene);
      assistant.report();
      assistant.commandInput();
      assistant.showBackstage();
      assistant.tick(10_000, 10_000, 7100);
      expect(assistant.speech.entries.map((entry) => entry.visible)).toEqual([
        assistantCopy.silence,
      ]);
    }
    assistant.toggleAutonomy();
    expect(assistant.speech.entries.at(-1)?.text).toBe(situationReports.END);
    assistant.toggleAutonomy();
    assistant.changeScene('BOOT');
    expect(assistant.autonomy).toBe(true);
    expect(assistant.speech.entries).toHaveLength(1);
  });

  it('uses deterministic confidence from the shared seeded RNG', () => {
    const first = new Assistant(createRng(123));
    const second = new Assistant(createRng(123));
    for (const scene of sceneOrder) {
      first.changeScene(scene);
      second.changeScene(scene);
      expect(first.confidence).toBe(second.confidence);
      expect(first.confidence).toBeGreaterThanOrEqual(0.75);
      expect(first.confidence).toBeLessThan(0.99);
    }
  });
});
