import { Events } from './events';
import { sceneOrder, TURN_DURATION, type Scene } from '../scenario/scenes';

export class Scenario {
  scene: Scene = 'BOOT';
  autoplay = false;
  private autoElapsed = 0;
  elapsed = 0;
  turnElapsed: number | null = null;
  readonly turned = new Events<void>();
  readonly changed = new Events<Scene>();

  get busy(): boolean {
    return this.turnElapsed !== null;
  }

  go(scene: Scene): boolean {
    if (this.busy || this.scene === scene) return false;
    this.scene = scene;
    this.elapsed = this.autoElapsed = 0;
    this.changed.emit(scene);
    return true;
  }

  move(direction: -1 | 1): boolean {
    const index = Math.max(
      0,
      Math.min(
        sceneOrder.length - 1,
        sceneOrder.indexOf(this.scene) + direction,
      ),
    );
    return this.go(sceneOrder[index]);
  }

  anyKey(): boolean {
    return this.scene === 'BOOT' && this.go('NORMAL');
  }

  enter(): 'turn' | 'accepted' | 'ignored' {
    if (this.busy) return 'ignored';
    if (this.scene === 'COUNTER') {
      this.turnElapsed = 0;
      this.turned.emit();
      return 'turn';
    }
    return 'accepted';
  }

  toggleAutoplay(): void {
    this.autoplay = !this.autoplay;
    this.autoElapsed = 0;
  }

  tick(delta: number): void {
    const dt = Math.max(0, Number.isFinite(delta) ? delta : 0);
    this.elapsed += dt;
    if (this.turnElapsed !== null) {
      this.turnElapsed += dt;
      if (this.turnElapsed >= TURN_DURATION) {
        this.turnElapsed = null;
        this.go('RECOVERY');
      }
      return;
    }
    if (!this.autoplay || this.scene === 'BOOT') return;
    this.autoElapsed += dt;
    if (this.autoElapsed >= 20_000) {
      this.autoElapsed = 0;
      if (this.scene === 'COUNTER') this.enter();
      else if (this.scene === 'END') this.go('NORMAL');
      else this.move(1);
    }
  }

  reset(): boolean {
    if (this.busy) return false;
    this.autoplay = false;
    this.scene = 'BOOT';
    this.elapsed = this.autoElapsed = 0;
    this.changed.emit('BOOT');
    return true;
  }
}
