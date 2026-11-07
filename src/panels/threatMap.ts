import { panel, element } from './dom';
import { ui } from '../scenario/messages';
import { landPath, mapWidth, mapHeight } from '../assets/world';
import { origins, destinations } from '../scenario/geography';
import { createRng, integer } from '../engine/rng';
import type { Scene } from '../scenario/scenes';

type Arc = {
  origin: number;
  target: number;
  life: number;
  speed: number;
  bend: number;
  label: number;
};
type Spark = { x: number; y: number; vx: number; vy: number; life: number };
const project = ([lng, lat]: [number, number]) => ({
  x: ((lng + 180) / 360) * mapWidth,
  y: ((90 - lat) / 180) * mapHeight,
});

export function createThreatMap() {
  const { root, body } = panel(ui.panel.map, ui.subtitles.map);
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', ui.panel.map);
  body.append(canvas, element('span', 'map-caption', ui.mapCaption));
  const context = canvas.getContext('2d')!;
  const land = new Path2D(landPath);
  const random = createRng(0x4d4150);
  const arcs: Arc[] = [];
  const sparks: Spark[] = [];
  let spawn = 0;
  let sparkCooldown = 0;
  let previous: Scene = 'BOOT';
  let width = 0,
    height = 0;

  function addSpark(x: number, y: number) {
    if (sparkCooldown > 0) return;
    sparkCooldown = 550;
    for (let i = 0; i < 6 && sparks.length < 96; i++) {
      const angle = random() * Math.PI * 2;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * 25,
        vy: Math.sin(angle) * 25,
        life: 1,
      });
    }
  }

  function render(
    scene: Scene,
    elapsed: number,
    turn: number | null,
    delta: number,
  ) {
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
      if (scene === 'BOOT' || scene === 'NORMAL' || scene === 'END') {
        arcs.length = sparks.length = 0;
      }
      spawn = 0;
      previous = scene;
    }
    const active = ['DETECT', 'INCIDENT', 'COUNTER'].includes(scene);
    const shield = (turn !== null && turn >= 4900) || scene === 'RECOVERY';
    spawn -= delta;
    if (active && spawn <= 0 && arcs.length < 40) {
      arcs.push({
        origin: integer(random, 0, origins.length - 1),
        target: integer(random, 0, 1),
        life: 0,
        speed: 0.00018 + random() * 0.0001,
        bend: 40 + random() * 75,
        label: integer(random, 0, ui.sourceLabels.length - 1),
      });
      spawn = scene === 'DETECT' ? 1100 : 220;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#08131f';
    context.fillRect(0, 0, width, height);
    // Equirectangular projection uses one uniform scale; no stretched geography.
    const scale = Math.min(width / mapWidth, height / mapHeight);
    const ox = (width - mapWidth * scale) / 2;
    const oy = (height - mapHeight * scale) / 2;
    context.translate(ox, oy);
    context.scale(scale, scale);
    context.lineWidth = 0.7;
    context.strokeStyle = '#193244';
    for (let x = 0; x <= 1000; x += 1000 / 12) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 500);
      context.stroke();
    }
    for (let y = 0; y <= 500; y += 500 / 6) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1000, y);
      context.stroke();
    }
    context.fillStyle = '#113341';
    context.fill(land);
    context.strokeStyle = '#286071';
    context.lineWidth = 0.8;
    context.stroke(land);
    const fontSize = Math.max(13, ((width / 1000) * 14) / scale);
    context.font = `${fontSize}px ui-monospace, monospace`;
    // Faint normal traffic remains visible in the quiet scenes.
    for (let i = 0; i < 3; i++) {
      const from = project(origins[i + 3]);
      const to = project(destinations[i % 2]);
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.quadraticCurveTo(
        (from.x + to.x) / 2,
        Math.min(from.y, to.y) - 70,
        to.x,
        to.y,
      );
      context.strokeStyle = '#297e713d';
      context.lineWidth = 1;
      context.stroke();
    }
    const center = project([137, 36]);
    if (shield) {
      context.strokeStyle = '#38f2ff';
      context.lineWidth = 2;
      context.beginPath();
      context.ellipse(center.x, center.y, 55, 48, -0.25, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = '#38f2ff0d';
      context.fill();
      context.fillStyle = '#38f2ff';
      context.fillText(ui.shield, center.x - 90, center.y + 86);
    }
    const labeled = new Set<number>();
    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i];
      arc.life += delta * arc.speed;
      const from = project(origins[arc.origin]);
      const destination = project(destinations[arc.target]);
      // End the actual curve at the shield ring, so no attack crosses it.
      const angle = Math.atan2(from.y - center.y, from.x - center.x);
      const to = shield
        ? {
            x: center.x + Math.cos(angle) * 55,
            y: center.y + Math.sin(angle) * 48,
          }
        : destination;
      const cp = {
        x: (from.x + to.x) / 2,
        y: Math.min(from.y, to.y) - arc.bend,
      };
      const t = Math.min(1, arc.life);
      const point = (p: number) => ({
        x: (1 - p) ** 2 * from.x + 2 * (1 - p) * p * cp.x + p ** 2 * to.x,
        y: (1 - p) ** 2 * from.y + 2 * (1 - p) * p * cp.y + p ** 2 * to.y,
      });
      context.globalAlpha =
        scene === 'RECOVERY' ? Math.max(0, 1 - elapsed / 3200) : 0.8;
      context.strokeStyle = shield
        ? '#38f2ff'
        : scene === 'DETECT'
          ? '#ffb020'
          : '#ff3b5c';
      context.lineWidth = 1.5;
      context.beginPath();
      for (let j = 0; j <= 30; j++) {
        const p = point((t * j) / 30);
        if (!j) context.moveTo(p.x, p.y);
        else context.lineTo(p.x, p.y);
      }
      context.stroke();
      const head = point(t);
      context.fillStyle = shield ? '#9ff5e8' : '#ffb020';
      context.beginPath();
      context.arc(head.x, head.y, 2.6, 0, Math.PI * 2);
      context.fill();
      if ([0, 3, 7].includes(arc.origin) && !labeled.has(arc.origin)) {
        labeled.add(arc.origin);
        context.fillStyle = '#cf9d76';
        context.fillText(ui.sourceLabels[arc.label], from.x + 6, from.y - 7);
      }
      if (arc.life >= 1) {
        if (shield) addSpark(to.x, to.y);
        arcs.splice(i, 1);
      }
    }
    context.globalAlpha = 1;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.life -= delta / 500;
      if (spark.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      spark.x += (spark.vx * delta) / 1000;
      spark.y += (spark.vy * delta) / 1000;
      context.fillStyle = `rgba(255,176,32,${spark.life})`;
      context.fillRect(spark.x, spark.y, 2.5, 2.5);
    }
    destinations.forEach((coordinates, i) => {
      const p = project(coordinates);
      context.strokeStyle = '#39ff88';
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(p.x, p.y, 5, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = '#39ff88';
      context.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      const tx = p.x - 155,
        ty = p.y + (i ? 28 : -25);
      context.fillStyle = '#08131fe8';
      context.fillRect(tx - 4, ty - fontSize, 160, fontSize + 6);
      context.fillStyle = '#9ff5e8';
      context.fillText(ui.targets[i], tx, ty);
    });
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `${Math.max(12, width * 0.017)}px ui-monospace, monospace`;
    context.fillStyle = active ? '#ffb020' : '#8fb6b3';
    context.fillText(
      active
        ? `${ui.counter} ${scene === 'DETECT' ? 17 : 284}${ui.perMinute}`
        : ui.nominal,
      18 * scale,
      29 * scale,
    );
  }
  return { root, canvas, render };
}
