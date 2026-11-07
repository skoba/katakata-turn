import { panel, element } from './dom';
import { ui } from '../scenario/messages';
export function createThreatMap() {
  const { root, body } = panel(ui.panel.map, ui.subtitles.map);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', ui.panel.map);
  body.append(canvas, element('span', 'map-caption', ui.mapCaption));
  return { root, canvas };
}
