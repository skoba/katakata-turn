import type { Scene } from '../scenario/scenes';
import type { statuses } from '../scenario/systems';

export type SystemState = keyof typeof statuses;

// Both the status table and topology use the same scene clock and state rules.
export function systemState(
  scene: Scene,
  elapsed: number,
  index: number,
): SystemState {
  if (scene === 'DETECT' && index === 0) return 'degraded';
  if (scene === 'INCIDENT' || scene === 'COUNTER')
    return index === 0
      ? 'down'
      : [1, 4, 8].includes(index)
        ? 'degraded'
        : 'nominal';
  if (scene === 'RECOVERY')
    return elapsed >= (index + 1) * 850 ? 'nominal' : 'recovering';
  return 'nominal';
}
