export function interleaveByRatio<T>(buckets: T[][], pattern: number[]): T[] {
  const queues = buckets.map((bucket) => [...bucket]);
  const result: T[] = [];
  let patternIdx = 0;

  while (queues.some((queue) => queue.length > 0)) {
    const preferred = pattern[patternIdx % pattern.length];
    patternIdx++;
    const order = [preferred, ...queues.map((_, i) => i).filter((i) => i !== preferred)];
    for (const i of order) {
      if (queues[i].length > 0) {
        result.push(queues[i].shift() as T);
        break;
      }
    }
  }

  return result;
}
