export const clamp = (value: number) => Math.max(0, Math.min(value, 1));

export const damp = (current: number, target: number, elapsedMs: number) =>
  current + (target - current) * (1 - Math.exp(-Math.min(elapsedMs, 64) / 140));
