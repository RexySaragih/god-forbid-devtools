/**
 * Window-size checker.
 *
 * If the difference between `outer*` and `inner*` viewport dimensions exceeds
 * a threshold, DevTools is most likely docked. Cheap, sync, no console
 * pollution.
 *
 * Known false-positive sources:
 * - Multi-monitor / split-screen setups → use `confirmationPolls` to debounce.
 * - macOS native fullscreen transitions briefly mis-report outer/inner deltas
 *   while the OS animates → we suppress the checker for a short cooldown
 *   after every `resize` and `fullscreenchange` event.
 */

import type { Checker } from "../types";
import { getDocument, getWindow } from "../../env/browser";

const DEFAULT_THRESHOLD_PX = 160;
const DEFAULT_RESIZE_COOLDOWN_MS = 800;

export interface WindowSizeOptions {
  thresholdPx?: number;
  /**
   * After a `resize` or `fullscreenchange` event, the checker reports `false`
   * for this many ms to avoid false positives during browser/OS animations
   * (notably macOS green-button fullscreen). Default 800.
   */
  resizeCooldownMs?: number;
}

export function createWindowSizeChecker(
  opts: WindowSizeOptions = {},
): Checker {
  const threshold = opts.thresholdPx ?? DEFAULT_THRESHOLD_PX;
  const cooldownMs = opts.resizeCooldownMs ?? DEFAULT_RESIZE_COOLDOWN_MS;

  let lastResizeAt = 0;
  let listenersAttached = false;

  function markResized(): void {
    lastResizeAt = Date.now();
  }

  function ensureListeners(): void {
    if (listenersAttached) return;
    const win = getWindow();
    const doc = getDocument();
    if (!win) return;
    win.addEventListener("resize", markResized);
    doc?.addEventListener("fullscreenchange", markResized);
    listenersAttached = true;
  }

  return {
    name: "window-size",
    category: "cheap",
    isEnabled: () => {
      const enabled = Boolean(getWindow());
      if (enabled) ensureListeners();
      return enabled;
    },
    isOpen: () => {
      const w = getWindow();
      if (!w) return false;

      // Suppress during resize / fullscreen animation cooldown — the OS
      // animates outer/inner dimensions independently for a few hundred ms,
      // producing transient deltas that look like docked DevTools.
      if (lastResizeAt > 0 && Date.now() - lastResizeAt < cooldownMs) {
        return false;
      }

      const widthDelta = Math.abs(w.outerWidth - w.innerWidth);
      const heightDelta = Math.abs(w.outerHeight - w.innerHeight);
      return widthDelta > threshold || heightDelta > threshold;
    },
  };
}

export const windowSizeChecker: Checker = createWindowSizeChecker();
