import { element } from './dom';
import { backstage } from '../scenario/backstage';
import { ui } from '../scenario/messages';
export function createBackstage() {
  const root = element('aside', 'overlay backstage'); root.hidden = true;
  root.append(element('div', 'eyebrow', backstage.intro), element('h2', '', backstage.title), element('p', '', backstage.description), element('p', 'muted', backstage.placeholder), element('p', 'close-hint', ui.close));
  return { root };
}
