/**
 * Monotonic clock helper. Falls back to `Date.now()` when `performance` is
 * unavailable (e.g. running in plain Node without the Performance API).
 */

export function now(): number {
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { performance?: { now?: () => number } })
      .performance?.now === "function"
  ) {
    return (
      globalThis as { performance: { now: () => number } }
    ).performance.now();
  }
  return Date.now();
}
