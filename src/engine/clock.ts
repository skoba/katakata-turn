/** A single animation loop. Hidden-tab time is paused to preserve the live turn. */
export function startClock(
  update: (delta: number, now: number) => void,
): () => void {
  let previous = performance.now();
  let elapsed = 0;
  let frame = 0;
  let stopped = false;
  function step(now: number) {
    const delta = document.hidden
      ? 0
      : Math.min(100, Math.max(0, now - previous));
    previous = now;
    elapsed += delta;
    update(delta, elapsed);
    if (!stopped) frame = requestAnimationFrame(step);
  }
  frame = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
  };
}
