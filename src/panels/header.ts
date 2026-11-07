import { alertLevel } from '../engine/alert';
import { element } from './dom';
import { ui } from '../scenario/messages';
import { scenes, type Scene } from '../scenario/scenes';

export function createHeader() {
  const root = element('header', 'header');
  const branding = element('div', 'branding');
  branding.append(
    element('div', 'eyebrow', ui.section),
    element('h1', '', ui.title),
    element('div', 'hospital', ui.hospital),
  );
  const scene = element('div', 'scene-name');
  const alert = element('strong', 'alert-number');
  const clock = element('time', 'clock-value');
  const mute = element('span', 'mute-state', ui.mute);
  const sceneBox = element('div', 'header-stat');
  sceneBox.append(element('span', 'eyebrow', ui.sceneLabel), scene, mute);
  const alertBox = element('div', 'header-stat alert-box');
  alertBox.append(element('span', 'eyebrow', ui.alert), alert);
  const timeBox = element('div', 'header-stat');
  timeBox.append(element('span', 'eyebrow', ui.clock), clock);
  root.append(branding, sceneBox, alertBox, timeBox);
  return {
    root,
    render(
      current: Scene,
      elapsed: number,
      muted: boolean,
      date: Date,
      autoplay: boolean,
    ) {
      scene.textContent = `${current} / ${scenes[current].name}${autoplay ? ui.autoLabel : ''}`;
      alert.textContent = alertLevel(current, elapsed);
      clock.textContent = date.toLocaleTimeString('ja-JP', { hour12: false });
      mute.textContent = muted ? ui.mute : ui.unmute;
    },
  };
}
