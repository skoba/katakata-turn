import {
  reloadInterval,
  advisories,
  advisoryByScene,
  cloudRegions,
  cloudStatus,
} from '../scenario/intel';
import type { Scene } from '../scenario/scenes';

type Advisory = { source: string; summary: string };
type CloudEntry = {
  provider: string;
  region: string;
  status: string;
  updated: number;
};
export const FEED_LIMIT = 30;
export const RELOAD_INTERVAL = reloadInterval;
const UPDATE_INTERVAL = 5000;

export class Intel {
  readonly advisory: Advisory[] = [];
  readonly cloud: CloudEntry[] = [];
  reloads = 0;
  revision = 0;
  private scene: Scene = 'BOOT';
  private clock = 0;
  private refreshElapsed = 0;
  private reloadElapsed = 0;

  changeScene(scene: Scene, timestamp: number) {
    this.scene = scene;
    this.clock = timestamp;
    this.refreshElapsed = this.reloadElapsed = 0;
    if (scene === 'BOOT' || scene === 'NORMAL') {
      this.reloads = 0;
      this.advisory.length = this.cloud.length = 0;
    }
    this.advisory.unshift(advisories[advisoryByScene[scene]]);
    this.advisory.length = Math.min(this.advisory.length, FEED_LIMIT);
    this.updateCloud();
  }

  tick(delta: number) {
    const dt = Math.max(0, Number.isFinite(delta) ? delta : 0);
    this.clock += dt;
    if (this.scene !== 'INCIDENT') return;
    this.reloadElapsed += dt;
    const count = Math.floor(this.reloadElapsed / RELOAD_INTERVAL);
    if (count) {
      this.reloads += count;
      this.reloadElapsed %= RELOAD_INTERVAL;
      this.revision++;
    }
    this.refreshElapsed += dt;
    if (this.refreshElapsed >= UPDATE_INTERVAL) {
      this.refreshElapsed %= UPDATE_INTERVAL;
      this.updateCloud();
    }
  }

  private updateCloud() {
    this.cloud.unshift(
      ...cloudRegions.map((region) => ({
        provider: region.provider,
        region: region.region,
        status: cloudStatus(this.scene, region.affected),
        updated: this.clock,
      })),
    );
    this.cloud.length = Math.min(this.cloud.length, FEED_LIMIT);
    this.revision++;
  }
}
