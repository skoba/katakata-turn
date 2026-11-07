import { ui, recoveryLog } from './scenario/messages';
import { systems as systemNames } from './scenario/systems';
import { scenes, type Scene } from './scenario/scenes';
import { Scenario } from './engine/scenario';
import { startClock } from './engine/clock';
import { element } from './panels/dom';
import { createHeader } from './panels/header';
import { createTopology } from './panels/topology';
import { createIntel } from './panels/intel';
import { Complaints } from './engine/complaints';
import { Intel } from './engine/intel';
import { createSystemStatus } from './panels/systemStatus';
import { createEventLog } from './panels/eventLog';
import { createTerminal } from './panels/terminal';
import { createHexdump } from './panels/hexdump';
import { createComplaints } from './panels/complaints';
import { createBackstage } from './panels/backstage';
import { createBanner } from './panels/banner';
import { createHelp } from './panels/help';
import { createAssistant } from './panels/assistant';
import { Assistant } from './engine/assistant';
import { TypingBuffer } from './input/typing';
import { randomStreams } from './engine/rng';
import { mapKey } from './input/keymap';
import { sceneOrder } from './scenario/scenes';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/panels.css';
import './styles/effects.css';

const random = randomStreams(location.search);
const complaintModel = new Complaints();
const frame = element('main', 'console');
document.title = ui.documentTitle;
frame.dataset.scene = 'BOOT';
const header = createHeader();
const topology = createTopology(random(0x544f504f));
const intelPanel = createIntel();
const intel = new Intel();
const systems = createSystemStatus();
const log = createEventLog();
const terminal = createTerminal();
const hex = createHexdump();
const complaints = createComplaints();
const backstage = createBackstage();
const banner = createBanner();
const help = createHelp();
const assistantPanel = createAssistant();
const dashboard = element('div', 'dashboard');
const rightColumn = element('div', 'right-column');
for (const [widget, className] of [
  [topology, 'topology-panel'],
  [intelPanel, 'intel-panel'],
  [systems, 'status-panel'],
  [log, 'log-panel'],
  [terminal, 'terminal-panel'],
  [hex, 'hex-panel'],
  [assistantPanel, 'assistant-panel'],
  [complaints, 'complaint-panel'],
] as const) {
  widget.root.classList.add(className);
  if (
    ['status-panel', 'assistant-panel', 'complaint-panel'].includes(className)
  )
    rightColumn.append(widget.root);
  else dashboard.append(widget.root);
}
dashboard.append(rightColumn);
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
const typing = new TypingBuffer(random(0x54595045));
const scenario = new Scenario();
const assistant = new Assistant(random(0x48415941));
let muted = true;
let now = 0;
let lastPaint = -Infinity;
let lastLog = 0;
let recovered = 0;
let lastAutoType = 0;

scenario.turned.subscribe(() => {
  typing.complete(now);
  backstage.root.hidden = help.root.hidden = true;
  frame.classList.add('is-turn-start');
});

function performEnter() {
  const result = scenario.enter();
  if (result === 'ignored') return;
  if (result === 'accepted') typing.complete(now);
  if (result === 'accepted') banner.notice(ui.accepted, now);
  lastPaint = -Infinity;
}

function typeCommand() {
  if (scenario.busy) return;
  typing.press(now);
  assistant.commandInput();
  lastPaint = -Infinity;
}

function changeScene(scene: Scene) {
  assistant.changeScene(scene);
  intel.changeScene(scene, Date.now());
  banner.clearNotice();
  frame.dataset.scene = scene;
  frame.dataset.tone = scenes[scene].tone;
  boot.hidden = scene !== 'BOOT';
  backstage.root.hidden = help.root.hidden = true;
  lastLog = 0;
  recovered = 0;
  complaintModel.update(scene, 0);
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
      if (!backstage.root.hidden) assistant.showBackstage();
      break;
    case 'report':
      assistant.report();
      break;
    case 'autonomy':
      assistant.toggleAutonomy();
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
      scenario.toggleAutoplay();
      banner.notice(scenario.autoplay ? ui.autoOn : ui.autoOff, now, 3000);
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
  intel.tick(delta);
  scenario.tick(delta);
  assistant.tick(delta, scenario.elapsed, scenario.turnElapsed);
  typing.tick(time);
  if (
    scenario.autoplay &&
    scenario.scene === 'COUNTER' &&
    !scenario.busy &&
    time - lastAutoType >= 120
  ) {
    typeCommand();
    lastAutoType = time;
  }
  complaintModel.update(scenario.scene, scenario.elapsed);
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
  topology.render(scene, elapsed, scenario.turnElapsed, delta);
  assistantPanel.render(assistant, time);
  if (time - lastPaint >= 80) {
    intelPanel.render(intel);
    backstage.render(intel.reloads, complaintModel.handled);
    header.render(scene, elapsed, muted, new Date(), scenario.autoplay);
    systems.render(scene, elapsed);
    terminal.render(typing, scene === 'COUNTER');
    complaints.render(scene, complaintModel);
    banner.render(scene, elapsed, scenario.turnElapsed, time);
    lastPaint = time;
  }
});
