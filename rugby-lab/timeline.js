// Чистые функции таймлайна: одинаковый результат при проигрывании и перемотке.
export function isLocalModelPath(file) {
  return typeof file === 'string' && /^assets\/models\/[a-z0-9_-]+\.glb$/i.test(file);
}
export function phaseAt(role, t) {
  const phases = role === 'carrier' ? [[0, 'run'], [3.8, 'tackle'], [5.6, 'ground']]
    : role === 'tackler' ? [[0, 'run'], [3.1, 'tackle'], [5.6, 'release']]
    : [[0, 'idle'], [6.4, 'run'], [8.4, 'contest']];
  const [start, name] = phases.filter(([start]) => start <= t).at(-1) || phases[0];
  return {start, name};
}
export function clipTimeAt(phase, time, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const elapsed = Math.max(0, time - phase.start);
  return ['run', 'idle'].includes(phase.name) ? elapsed % duration
    : Math.min(elapsed, Math.max(0, duration - 0.00001));
}
