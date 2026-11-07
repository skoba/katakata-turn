export type Random = () => number;

export function createRng(seed = 0x4b415441): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let x = Math.imul(state ^ (state >>> 15), state | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export const integer = (random: Random, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

/** Independent streams keep audio / display sampling from changing typing. */
export function randomStreams(query: string) {
  const value = new URLSearchParams(query).get('seed');
  const parsed = value?.trim() ? Number(value) : NaN;
  const seed = Number.isFinite(parsed) ? parsed >>> 0 : 0x4b415441;
  return (stream: number): Random => createRng(seed ^ stream);
}
