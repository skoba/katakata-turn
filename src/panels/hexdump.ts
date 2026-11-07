import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import { Hexdump } from '../engine/hexdump';
import type { Random } from '../engine/rng';
import type { Scene } from '../scenario/scenes';

export function createHexdump(random: Random) {
  const { root, body } = panel(ui.panel.hex);
  const data = element('pre', 'hex-data');
  body.append(
    element('div', 'eyebrow', ui.packetHeader),
    data,
    element('div', 'packet-footer', ui.packetFooter),
  );
  const model = new Hexdump(random);
  let signature = '';
  return {
    root,
    reset() {
      model.reset();
      data.textContent = '';
      signature = '';
    },
    render(delta: number, scene: Scene) {
      model.tick(delta, scene);
      const next = model.lines.join('\n');
      if (next !== signature) {
        data.textContent = next;
        data.scrollTop = data.scrollHeight;
        signature = next;
      }
    },
  };
}
