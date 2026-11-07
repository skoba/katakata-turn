import { STAGE_START, STAGE_DURATION, type Scene } from '../scenario/scenes';

export function topologyPhase(scene: Scene, turn: number | null) {
  const restored = scene === 'RECOVERY' || scene === 'END';
  return {
    shield: restored || (turn !== null && turn >= STAGE_START + STAGE_DURATION),
    failover:
      restored || (turn !== null && turn >= STAGE_START + STAGE_DURATION * 2),
    attacking: ['DETECT', 'INCIDENT', 'COUNTER'].includes(scene),
  };
}
