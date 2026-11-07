import { element, panel } from './dom';
import type { Assistant } from '../engine/assistant';
import { assistantCopy } from '../scenario/assistant';

export function createAssistant() {
  const { root, body } = panel(assistantCopy.title);
  const mode = element('span', 'assistant-autonomy', assistantCopy.autonomyOn);
  const heading = root.querySelector('.panel-heading')!;
  heading.append(
    mode,
    element('span', 'assistant-subtitle', assistantCopy.subtitle),
  );
  const log = element('div', 'assistant-log');
  const bubbles = Array.from({ length: 4 }, () => {
    const row = element('p', 'assistant-speech');
    row.hidden = true;
    const text = element('span');
    const cursor = element('span', 'assistant-cursor');
    cursor.setAttribute('aria-hidden', 'true');
    row.append(text, cursor);
    log.append(row);
    return { row, text, cursor };
  });
  const indicator = element('div', 'assistant-indicator');
  const icon = element('canvas', 'assistant-icon');
  icon.setAttribute('aria-hidden', 'true');
  const status = element('span', 'assistant-status');
  const confidence = element('span', 'assistant-confidence');
  const analysis = element('div', 'assistant-analysis');
  analysis.append(status, confidence);
  indicator.append(icon, analysis);
  body.append(log, indicator);
  const ctx = icon.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lastLog = '';

  return {
    root,
    render(assistant: Assistant, now: number) {
      root.dataset.autonomy = String(assistant.autonomy);
      mode.textContent = assistant.autonomy
        ? assistantCopy.autonomyOn
        : assistantCopy.autonomyOff;
      status.textContent = assistant.autonomy
        ? assistantCopy.analyzing
        : assistantCopy.awaiting;
      confidence.textContent = assistantCopy.confidence(assistant.confidence);
      const entries = assistant.speech.entries.slice(-4);
      const signature = JSON.stringify(entries);
      if (signature !== lastLog) {
        bubbles.forEach(({ row, text, cursor }, index) => {
          const entry = entries[index];
          row.hidden = !entry;
          text.textContent = entry?.visible ?? '';
          row.title = entry?.text ?? '';
          row.classList.toggle('is-latest', index === entries.length - 1);
          cursor.hidden = index !== entries.length - 1;
        });
        log.scrollTop = log.scrollHeight;
        lastLog = signature;
      }
      if (!ctx) return;
      const size = icon.clientWidth;
      const pixels = Math.max(1, Math.round(size * devicePixelRatio));
      if (icon.width !== pixels) icon.width = icon.height = pixels;
      ctx.setTransform(pixels / size, 0, 0, pixels / size, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = getComputedStyle(icon).color;
      ctx.lineWidth = 1.2;
      const radius = size * 0.38;
      for (const scale of [0.35, 0.7, 1]) {
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      const angle =
        assistant.autonomy && !reducedMotion.matches ? now / 1800 : 0;
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, angle, angle + Math.PI * 0.8);
      ctx.stroke();
    },
  };
}
