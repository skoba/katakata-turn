import { panel, element } from './dom';
import { ui } from '../scenario/messages';
export function createHexdump() {
  const { root, body } = panel(ui.panel.hex);
  body.append(
    element('div', 'eyebrow', ui.packetHeader),
    element('pre', 'hex-data', ui.packets.join('\n')),
    element('div', 'packet-footer', ui.packetFooter),
  );
  return { root };
}
