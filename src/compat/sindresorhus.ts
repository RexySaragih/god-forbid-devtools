/**
 * Drop-in compatibility surface that mirrors `devtools-detect`.
 *
 * The package's default export is a singleton detector with the same
 * behaviour as `import devtoolsDetect from 'devtools-detect'`:
 *
 *   - `detector.isOpen` reflects current state.
 *   - A `devtoolschange` `CustomEvent` is dispatched on `window` when the
 *     state flips.
 *
 * Unlike the original, callers must explicitly `start()` the detector.
 * That's intentional — see plan.md §2 (no side effects on import) for why.
 */

import { createDetector } from "../detector";
import type { Detector } from "../detector/types";

let singleton: Detector | null = null;

function getSingleton(): Detector {
  if (singleton) return singleton;
  singleton = createDetector();
  return singleton;
}

/**
 * The default detector. `isOpen` is a live getter, `start()` / `stop()` are
 * idempotent, and `addListener` is the preferred long-term hook.
 */
export const defaultDetector: Detector = new Proxy({} as Detector, {
  get(_target, prop) {
    const det = getSingleton();
    const value = (det as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(det);
    }
    return value;
  },
});

/** Test seam. Not exported from the package. */
export function __resetDefaultDetector(): void {
  singleton?.stop();
  singleton = null;
}
