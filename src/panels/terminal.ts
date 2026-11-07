import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import type { TypingBuffer } from '../input/typing';

export function createTerminal() {
  const { root, body } = panel(ui.panel.terminal, ui.subtitles.terminal);
  const session = element('div', 'terminal-session', ui.terminalSession);
  const history = element('pre', 'terminal-history', ui.terminalReady);
  const current = element('span', 'terminal-current', ui.terminalPrompt);
  const line = element('div', 'terminal-input');
  line.append(current, element('span', 'cursor', '▌'));
  const hint = element('div', 'terminal-hint', ui.terminalIdle);
  body.append(session, history, line, hint);
  return {
    root,
    render(buffer: TypingBuffer, counter: boolean) {
      history.textContent = buffer.lines.length
        ? buffer.lines.join('\n')
        : ui.terminalReady;
      history.scrollTop = history.scrollHeight;
      current.textContent = buffer.current || ui.terminalPrompt;
      hint.textContent = counter ? ui.counterHint : ui.terminalIdle;
    },
  };
}
