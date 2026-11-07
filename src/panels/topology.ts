import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import {
  nodes,
  links,
  topologyCopy,
  topologySize,
  attackPath,
  type TopologyNode,
} from '../scenario/topology';
import { systemState, type SystemState } from '../engine/systems';
import { topologyPhase } from '../engine/topology';
import type { Random } from '../engine/rng';
import type { Scene } from '../scenario/scenes';

type Point = { x: number; y: number };
type Attack = { distance: number; speed: number };
type Spark = Point & { vx: number; vy: number; life: number };
const colors: Record<SystemState, string> = {
  nominal: '#39ff88',
  degraded: '#ffb020',
  down: '#ff3b5c',
  recovering: '#38f2ff',
};
const byId = new Map(nodes.map((node) => [node.id, node]));
const edge = byId.get('edge')!;
const cloud = byId.get('cloud')!;
const lengths = attackPath
  .slice(1)
  .map((point, i) =>
    Math.hypot(point.x - attackPath[i].x, point.y - attackPath[i].y),
  );
const attackLength = lengths.reduce((sum, length) => sum + length, 0);
const shieldDistance = lengths[0] + lengths[1];

function attackPoint(distance: number): Point {
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const t = distance / lengths[i];
      return {
        x: attackPath[i].x + (attackPath[i + 1].x - attackPath[i].x) * t,
        y: attackPath[i].y + (attackPath[i + 1].y - attackPath[i].y) * t,
      };
    }
    distance -= lengths[i];
  }
  return attackPath.at(-1)!;
}

export function createTopology(random: Random) {
  const { root, body } = panel(topologyCopy.title, topologyCopy.subtitle);
  const canvas = document.createElement('canvas');
  canvas.setAttribute(
    'aria-label',
    `${topologyCopy.title}: ${nodes.map((node) => node.label).join(' / ')}`,
  );
  const caption = element('span', 'topology-caption', topologyCopy.caption);
  body.append(canvas, caption);
  const context = canvas.getContext('2d')!;
  const attacks: Attack[] = [];
  const sparks: Spark[] = [];
  let spawn = 0;
  let sparkCooldown = 0;
  let previous: Scene | null = null;
  let width = 0;
  let height = 0;
  let clock = 0;

  function addSparks(point: Point) {
    if (sparkCooldown > 0) return;
    sparkCooldown = 600;
    for (let i = 0; i < 8 && sparks.length < 96; i++) {
      const angle = random() * Math.PI * 2;
      sparks.push({
        ...point,
        vx: Math.cos(angle) * 45,
        vy: Math.sin(angle) * 45,
        life: 1,
      });
    }
  }

  function shape(node: TopologyNode) {
    const { x, y, width: w, height: h } = node;
    context.beginPath();
    if (node.shape === 'cloud')
      context.roundRect(x - w / 2, y - h / 2, w, h, 16);
    else if (node.shape === 'ap') {
      context.moveTo(x, y + h / 2);
      context.arc(x, y + h / 2, h, -Math.PI * 0.8, -Math.PI * 0.2);
      context.closePath();
    } else context.rect(x - w / 2, y - h / 2, w, h);
    context.fill();
    context.stroke();
    if (node.shape === 'terminal') {
      context.beginPath();
      context.moveTo(x, y + h / 2);
      context.lineTo(x, y + h / 2 + 5);
      context.moveTo(x - w / 3, y + h / 2 + 5);
      context.lineTo(x + w / 3, y + h / 2 + 5);
      context.stroke();
    }
  }

  function render(
    scene: Scene,
    elapsed: number,
    turn: number | null,
    delta: number,
  ) {
    clock += delta;
    sparkCooldown = Math.max(0, sparkCooldown - delta);
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (width !== rect.width || height !== rect.height) {
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    if (!width || !height) return;
    if (scene !== previous) {
      if (scene !== 'RECOVERY') attacks.length = sparks.length = 0;
      spawn = 0;
      previous = scene;
    }
    const phase = topologyPhase(scene, turn);
    const nodeState = (node: TopologyNode): SystemState =>
      node.system === undefined
        ? 'nominal'
        : systemState(scene, elapsed, node.system);
    root.dataset.shield = String(phase.shield);
    root.dataset.route = phase.failover ? 'dr' : 'primary';
    spawn -= delta;
    if (phase.attacking && spawn <= 0 && attacks.length < 80) {
      attacks.push({ distance: 0, speed: 0.22 + random() * 0.08 });
      spawn = scene === 'DETECT' ? 1000 : 180;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#08131f';
    context.fillRect(0, 0, width, height);
    // Uniform scaling retains the geometric symbols; text stays >= 13 CSS px.
    const scale = Math.min(
      width / topologySize.width,
      height / topologySize.height,
    );
    const ox = (width - topologySize.width * scale) / 2;
    const oy = (height - topologySize.height * scale) / 2;
    context.translate(ox, oy);
    context.scale(scale, scale);
    const fontPx = Math.max(13, Math.min(18, width / 70));
    const font = fontPx / scale;
    context.font = `${font}px ui-monospace, system-ui, monospace`;
    context.textBaseline = 'middle';
    context.lineWidth = 1 / scale;
    context.strokeStyle = '#163041';
    for (let x = 0; x <= topologySize.width; x += 60) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, topologySize.height);
      context.stroke();
    }
    // Links are behind nodes and labels. The DR branch becomes the active route.
    links.forEach((link, i) => {
      const from = byId.get(link.from)!;
      const to = byId.get(link.to)!;
      const state = nodeState(link.route === 'primary' ? cloud : to);
      const selectedDR =
        phase.failover && (link.route === 'dr' || link.from === 'vpn');
      const inactive =
        link.route === 'dr'
          ? !phase.failover
          : link.route === 'primary' && phase.failover;
      context.strokeStyle = selectedDR
        ? colors.nominal
        : inactive
          ? '#24404a'
          : state === 'nominal'
            ? scene === 'RECOVERY'
              ? colors.nominal
              : '#38f2ff40'
            : colors[state];
      context.lineWidth = (selectedDR ? 2.5 : 1) / scale;
      context.setLineDash(inactive ? [5, 6] : []);
      context.beginPath();
      context.moveTo(from.x, from.y);
      if (link.from === 'core') {
        context.lineTo(870, from.y);
        context.lineTo(870, to.y);
      }
      context.lineTo(to.x, to.y);
      context.stroke();
      context.setLineDash([]);
      if (!inactive) {
        for (let j = 0; j < 2; j++) {
          const t = (clock / 3600 + i * 0.137 + j / 2) % 1;
          let point: Point;
          if (link.from === 'core') {
            const segments = [100, Math.abs(to.y - from.y), to.x - 870];
            let distance = t * segments.reduce((a, b) => a + b, 0);
            if (distance < 100) point = { x: from.x + distance, y: from.y };
            else if ((distance -= 100) < segments[1])
              point = {
                x: 870,
                y: from.y + Math.sign(to.y - from.y) * distance,
              };
            else point = { x: 870 + distance - segments[1], y: to.y };
          } else
            point = {
              x: from.x + (to.x - from.x) * t,
              y: from.y + (to.y - from.y) * t,
            };
          context.fillStyle = selectedDR ? colors.nominal : '#9ff5e8';
          context.beginPath();
          context.arc(point.x, point.y, 1.7 / scale, 0, Math.PI * 2);
          context.fill();
        }
      }
    });
    if (phase.shield) {
      context.strokeStyle = '#38f2ff';
      context.fillStyle = '#38f2ff0c';
      context.lineWidth = 2 / scale;
      context.beginPath();
      context.roundRect(edge.x - 120, edge.y - 50, 240, 100, 20);
      context.fill();
      context.stroke();
    }
    context.globalAlpha =
      scene === 'RECOVERY' ? Math.max(0, 1 - elapsed / 3200) : 1;
    for (let i = attacks.length - 1; i >= 0; i--) {
      const attack = attacks[i];
      attack.distance += delta * attack.speed;
      const end = phase.shield ? shieldDistance : attackLength;
      if (attack.distance >= end) {
        if (phase.shield) addSparks(attackPoint(shieldDistance));
        attacks.splice(i, 1);
        continue;
      }
      const point = attackPoint(attack.distance);
      const tail = attackPoint(Math.max(0, attack.distance - 35));
      context.strokeStyle = '#ff3b5c';
      context.lineWidth = 2 / scale;
      context.beginPath();
      context.moveTo(tail.x, tail.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      context.fillStyle = '#ff3b5c';
      context.beginPath();
      context.arc(point.x, point.y, 2.5 / scale, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.life -= delta / 550;
      if (spark.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      spark.x += (spark.vx * delta) / 1000;
      spark.y += (spark.vy * delta) / 1000;
      context.fillStyle = `rgba(255,176,32,${spark.life})`;
      context.fillRect(spark.x, spark.y, 2 / scale, 2 / scale);
    }
    // Record measured text bounds so the capture check also detects Canvas label collisions.
    const labels: {
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];
    function label(
      text: string,
      x: number,
      y: number,
      align: CanvasTextAlign = 'center',
      color = '#9ff5e8',
    ) {
      context.textAlign = align;
      context.fillStyle = color;
      const w = context.measureText(text).width;
      const left =
        align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      context.fillStyle = '#08131fe8';
      context.fillRect(left - 2, y - font / 2, w + 4, font);
      context.fillStyle = color;
      context.fillText(text, x, y);
      labels.push({
        text,
        x: ox + left * scale,
        y: oy + y * scale - fontPx / 2,
        width: w * scale,
        height: fontPx,
      });
    }
    nodes.forEach((node) => {
      const state = nodeState(node);
      context.fillStyle = '#0b1b29';
      context.strokeStyle = colors[state];
      context.lineWidth = 1.3 / scale;
      shape(node);
      context.fillStyle = colors[state];
      context.beginPath();
      context.arc(
        node.x - node.width / 2 + 5,
        node.y - node.height / 2 + 5,
        2 / scale,
        0,
        Math.PI * 2,
      );
      context.fill();
      if (node.labelSide) label(node.label, node.x - 45, node.y, 'right');
      else if (node.width > 100) {
        label(node.label, node.x, node.y - (node.detail ? 13 : 0));
        if (node.detail)
          label(node.detail, node.x, node.y + 17, 'center', '#87aeb9');
      }
    });
    label(topologyCopy.sources[0], 130, 161, 'center', '#c58890');
    label(topologyCopy.sources[1], 130, 201, 'center', '#c58890');
    if (phase.shield) label(topologyCopy.shield, 400, 16, 'center', '#38f2ff');
    if (phase.failover)
      label(topologyCopy.failover, 485, 303, 'center', '#39ff88');
    label(
      phase.attacking
        ? `${ui.counter} ${scene === 'DETECT' ? 17 : 284}${ui.perMinute}`
        : ui.nominal,
      340,
      338,
      'left',
      phase.attacking ? '#ffb020' : '#87aeb9',
    );
    root.dataset.labels = JSON.stringify(labels);
    root.dataset.fontSize = String(fontPx);
    root.dataset.attacks = String(attacks.length);
    root.dataset.sparks = String(sparks.length);
  }
  return { root, canvas, render };
}
