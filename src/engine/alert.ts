import { scenes, type Scene } from '../scenario/scenes';

export function alertLevel(scene: Scene, elapsed: number): string {
  if (scene === 'DETECT') return elapsed >= 3000 ? '3' : '4';
  if (scene === 'INCIDENT') return elapsed >= 3000 ? '1' : '2';
  if (scene === 'RECOVERY')
    return String(Math.min(5, 1 + Math.floor(elapsed / 2125)));
  return scenes[scene].alert;
}
