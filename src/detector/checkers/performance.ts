/**
 * Performance checker.
 *
 * `console.table` of a large object is essentially free when DevTools is
 * closed (the runtime discards the message) but fans out into a meaningful
 * amount of work when DevTools is open and rendering the table. We measure
 * the elapsed time and flip when it crosses a threshold.
 *
 * The threshold is calibrated higher on Brave to absorb its fingerprint
 * randomisation noise.
 *
 * `category: "heavy"` — the detector only invokes this checker when a cheap
 * checker has hinted positive on the previous poll, so we don't spam logs in
 * legitimate dev sessions.
 */

import type { Checker } from "../types";
import { getConsole } from "../../env/console";
import { getWindow, isBrave } from "../../env/browser";
import { now } from "../../env/time";
import { getLargePayload } from "../shared/large-payload";

const DEFAULT_THRESHOLD_MS = 100;
const BRAVE_THRESHOLD_MS = 250;

export interface PerformanceOptions {
  thresholdMs?: number;
}

export function createPerformanceChecker(
  opts: PerformanceOptions = {},
): Checker {
  const baseThreshold = opts.thresholdMs;

  return {
    name: "performance",
    category: "heavy",
    isEnabled: () => Boolean(getWindow()),
    isOpen: () => {
      const consoleRef = getConsole();
      const payload = getLargePayload();

      const start = now();
      consoleRef.table(payload);
      const elapsed = now() - start;

      // Clean up to keep the user's panel from filling with our probe.
      consoleRef.clear();

      const threshold =
        baseThreshold ?? (isBrave() ? BRAVE_THRESHOLD_MS : DEFAULT_THRESHOLD_MS);
      return elapsed > threshold;
    },
  };
}

export const performanceChecker: Checker = createPerformanceChecker();
