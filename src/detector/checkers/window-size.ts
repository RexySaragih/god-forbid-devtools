/**
 * Window-size checker.
 *
 * If the difference between `outer*` and `inner*` viewport dimensions exceeds
 * a threshold, DevTools is most likely docked. Cheap, sync, no console
 * pollution. Known false positives on multi-monitor and split-screen setups —
 * the detector debounces with `confirmationPolls` to compensate.
 */

import type { Checker } from "../types";
import { getWindow } from "../../env/browser";

const DEFAULT_THRESHOLD_PX = 160;

export interface WindowSizeOptions {
  thresholdPx?: number;
}

export function createWindowSizeChecker(
  opts: WindowSizeOptions = {},
): Checker {
  const threshold = opts.thresholdPx ?? DEFAULT_THRESHOLD_PX;

  return {
    name: "window-size",
    category: "cheap",
    isEnabled: () => Boolean(getWindow()),
    isOpen: () => {
      const w = getWindow();
      if (!w) return false;
      const widthDelta = Math.abs(w.outerWidth - w.innerWidth);
      const heightDelta = Math.abs(w.outerHeight - w.innerHeight);
      return widthDelta > threshold || heightDelta > threshold;
    },
  };
}

export const windowSizeChecker: Checker = createWindowSizeChecker();
