/**
 * Heavy object the `performanceChecker` feeds into `console.table`. Building
 * it once and re-using the reference keeps each poll cheap; the cost we care
 * about is the deserialisation DevTools performs when it's open.
 */

const PAYLOAD_KEYS = 25_000;

let cached: Record<string, number> | null = null;

export function getLargePayload(): Record<string, number> {
  if (cached) return cached;
  const obj: Record<string, number> = {};
  for (let i = 0; i < PAYLOAD_KEYS; i++) {
    obj[`k${i}`] = i;
  }
  cached = obj;
  return obj;
}

/** Test seam. */
export function __resetLargePayload(): void {
  cached = null;
}
