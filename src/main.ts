import { ui, recoveryLog } from './scenario/messages';
import { systems as systemNames } from './scenario/systems';
import { scenes, type Scene } from './scenario/scenes';
import { Scenario } from './engine/scenario';
import { startClock } from './engine/clock';
import { element } from './panels/dom';
import { createHeader } from './panels/header';
import { createThreatMap } from './panels/threatMap';
import { createSystemStatus } from './panels/systemStatus';
import { createEventLog } from './panels/eventLog';
import { createTerminal } from './panels/terminal';
import { createHexdump } from './panels/hexdump';
import { createComplaints } from './panels/complaints';
import { createBackstage } from './panels/backstage';
import { createBanner } from './panels/banner';
import { createHelp } from './panels/help';
import { TypingBuffer } from './input/typing';
import { createRng } from './engine/rng';
import { mapKey } from './input/keymap';
import { sceneOrder } from './scenario/scenes';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/panels.css';
import './styles/effects.css';

const frame = element('main', 'console');
document.title = ui.documentTitle;
frame.dataset.scene = 'BOOT';
const header = createHeader();
const map = createThreatMap();
const systems = createSystemStatus();
const log = createEventLog();
const terminal = createTerminal();
const hex = createHexdump();
const complaints = createComplaints();
const backstage = createBackstage();
const banner = createBanner();
const help = createHelp();
const dashboard = element('div', 'dashboard');
for (const [widget, className] of [
  [map, 'map-panel'],
  [systems, 'status-panel'],
  [log, 'log-panel'],
  [terminal, 'terminal-panel'],
  [hex, 'hex-panel'],
  [complaints, 'complaint-panel'],
] as const) {
  widget.root.classList.add(className);
  dashboard.append(widget.root);
}
const footer = element('footer', 'footer');
const hints = element('div', 'footer-hints');
hints.append(
  element('span', '', ui.nextHint),
  element('span', '', ui.helpHint),
);
footer.append(hints, element('span', '', ui.disclaimer));
const boot = element('section', 'boot');
boot.hidden = true;
const bootText = element('pre');
const bootReady = element('div', 'boot-ready', ui.ready);
boot.append(
  element('div', 'eyebrow', ui.section),
  element('h2', '', ui.bootTitle),
  element('div', 'boot-subtitle', ui.bootSubtitle),
  bootText,
  bootReady,
  element('div', 'boot-hint', ui.bootHint),
  element('span', 'boot-disclaimer', ui.disclaimer),
);
frame.append(
  header.root,
  banner.root,
  dashboard,
  footer,
  banner.overlay,
  backstage.root,
  help.root,
  boot,
  element('div', 'flash'),
);
document.querySelector('#app')!.append(frame);
const typing = new TypingBuffer(createRng());
const scenario = new Scenario();
let muted = true;
let now = 0;
let lastPaint = -Infinity;
let lastLog = 0;
let recovered = 0;

function performEnter() {
  const result = scenario.enter();
  if (result === 'ignored') return;
  typing.complete(now);
  if (result === 'turn') {
    backstage.root.hidden = help.root.hidden = true;
    frame.classList.add('is-turn-start');
  } else banner.notice(ui.accepted, now);
  lastPaint = -Infinity;
}

function typeCommand() {
  if (scenario.busy) return;
  typing.press(now);
  lastPaint = -Infinity;
}

function changeScene(scene: Scene) {
  banner.clearNotice();
  frame.dataset.scene = scene;
  frame.dataset.tone = scenes[scene].tone;
  boot.hidden = scene !== 'BOOT';
  backstage.root.hidden = help.root.hidden = true;
  lastLog = 0;
  recovered = 0;
  if (scene === 'BOOT') {
    typing.reset();
    log.reset();
  }
  log.ambient(scene, new Date());
  lastPaint = -Infinity;
}
scenario.changed.subscribe(changeScene);
changeScene('BOOT');

document.addEventListener('keydown', (event) => {
  const binding = mapKey(event, scenario.scene);
  if (binding.prevent || scenario.busy) event.preventDefault();
  const action = binding.action;
  if (
    action === 'blocked' ||
    scenario.busy ||
    (event.repeat && action !== 'type')
  )
    return;
  if (event.isComposing) return;
  if (scenario.anyKey()) {
    event.preventDefault();
    return;
  }
  if (!action) return;
  if (action.startsWith('jump-')) {
    scenario.go(sceneOrder[Number(action.slice(5))]);
    return;
  }
  switch (action) {
    case 'next':
      scenario.move(1);
      break;
    case 'previous':
      scenario.move(-1);
      break;
    case 'enter':
      performEnter();
      break;
    case 'type':
      typeCommand();
      break;
    case 'backstage':
      backstage.root.hidden = !backstage.root.hidden;
      help.root.hidden = true;
      break;
    case 'help':
      help.root.hidden = !help.root.hidden;
      backstage.root.hidden = true;
      break;
    case 'close':
      backstage.root.hidden = help.root.hidden = true;
      break;
    case 'mute':
      muted = !muted;
      break;
    case 'auto':
      banner.notice(ui.autoReserved, now, 4000);
      break;
    case 'reset':
      scenario.reset();
      break;
    case 'fullscreen': {
      const operation = document.fullscreenElement
        ? document.exitFullscreen()
        : frame.requestFullscreen();
      operation.catch(() => banner.notice(ui.fullscreenFailed, now, 5000));
      break;
    }
  }
  lastPaint = -Infinity;
});

if (!new URLSearchParams(location.search).has('nobeforeunload')) {
  window.addEventListener('beforeunload', (event) => {
    event.preventDefault();
    event.returnValue = '';
  });
}

startClock((delta, time) => {
  now = time;
  scenario.tick(delta);
  typing.tick(time);
  if (scenario.turnElapsed === null || scenario.turnElapsed >= 300)
    frame.classList.remove('is-turn-start');
  const scene = scenario.scene;
  const elapsed = scenario.elapsed;
  if (scene === 'BOOT') {
    const length = Math.min(
      ui.bootLines.join('\n').length,
      Math.floor(elapsed / 19),
    );
    bootText.textContent = ui.bootLines.join('\n').slice(0, length);
    bootReady.hidden = elapsed < 3600;
  }
  if (elapsed - lastLog >= (scene === 'INCIDENT' ? 320 : 2100)) {
    log.ambient(scene, new Date());
    lastLog = elapsed;
  }
  if (scene === 'RECOVERY') {
    const count = Math.min(systemNames.length, Math.floor(elapsed / 850));
    while (recovered < count)
      log.append(recoveryLog(systemNames[recovered++]), scene, new Date());
  }
  map.render(scene, elapsed, scenario.turnElapsed, delta);
  if (time - lastPaint >= 80) {
    header.render(scene, elapsed, muted, new Date());
    systems.render(scene, elapsed);
    terminal.render(typing, scene === 'COUNTER');
    complaints.render(scene, elapsed);
    banner.render(scene, elapsed, scenario.turnElapsed, time);
    lastPaint = time;
  }
});
