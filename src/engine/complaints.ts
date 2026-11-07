import { incidentCounts } from '../scenario/complaints';
import type { Scene } from '../scenario/scenes';

/** Outstanding and handled counts share one incident snapshot with BACKSTAGE. */
export class Complaints {
  counts = incidentCounts.map(() => 0);
  handled = 0;
  private received = incidentCounts.map(() => 0);

  update(scene: Scene, elapsed: number) {
    if (scene === 'BOOT' || scene === 'NORMAL') {
      this.received.fill(0);
      this.handled = 0;
    }
    this.counts = incidentCounts.map((maximum, i) => {
      let value = scene === 'DETECT' && i === 0 ? 1 : 0;
      if (scene === 'INCIDENT')
        value = Math.min(
          maximum,
          Math.max(i === 4 ? 1 : 0, Math.ceil(elapsed / 500) + 1),
        );
      if (scene === 'COUNTER') value = maximum;
      // A direct recovery jump uses the scripted incident, too.
      if (scene === 'RECOVERY' || scene === 'END') {
        this.received[i] = Math.max(this.received[i], maximum);
        value =
          scene === 'END'
            ? 0
            : Math.ceil(this.received[i] * Math.max(0, 1 - elapsed / 8500));
      }
      this.received[i] = Math.max(this.received[i], value);
      return value;
    });
    if (scene === 'RECOVERY' || scene === 'END')
      this.handled = this.received.reduce(
        (sum, value, i) => sum + value - this.counts[i],
        0,
      );
  }
}
