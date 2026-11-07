import { element } from './dom';
import { help } from '../scenario/help';
import { ui } from '../scenario/messages';
export function createHelp() {
  const root = element('aside', 'overlay help');
  root.hidden = true;
  root.append(
    element('h2', '', help.title),
    element('p', 'help-rule', help.rule),
  );
  const list = element('dl', 'help-list');
  for (const [key, action] of help.rows)
    list.append(element('dt', '', key), element('dd', '', action));
  root.append(
    list,
    element('p', 'help-rule', help.lock),
    element('p', 'close-hint', ui.close),
  );
  return { root };
}
