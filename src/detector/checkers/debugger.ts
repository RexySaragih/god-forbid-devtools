/**
 * Debugger checker — opt-in only.
 *
 * Wraps a `debugger` statement in an anonymous function and measures elapsed
 * time. With DevTools closed the statement is a no-op; with DevTools open and
 * "Pause on debugger" active, the runtime stalls — that delta gives us a hard
 * positive signal.
 *
 * UX-hostile: actually freezes the tab when DevTools is open. Only enable as
 * an escape hatch when other strategies aren't enough. Requires `'unsafe-eval'`
 * in CSP because we construct the function via `new Function`.
 */

import type { Checker } from "../types";
import { getWindow } from "../../env/browser";
import { now } from "../../env/time";

const DEFAULT_THRESHOLD_MS = 100;

export interface DebuggerOptions {
  thresholdMs?: number;
}

export function createDebuggerChecker(opts: DebuggerOptions = {}): Checker {
  const threshold = opts.thresholdMs ?? DEFAULT_THRESHOLD_MS;

  // Build the probe lazily — `new Function` is the bit a strict CSP blocks,
  // and we don't want to pay that cost or trip CSP on import.
  let probe: (() => void) | null = null;
  let probeBlocked = false;

  function getProbe(): (() => void) | null {
    if (probe || probeBlocked) return probe;
    try {
      probe = new Function("debugger;") as () => void;
    } catch {
      // CSP without 'unsafe-eval'. Disable for the rest of the run.
      probeBlocked = true;
      probe = null;
    }
    return probe;
  }

  return {
    name: "debugger",
    category: "heavy",
    isEnabled: () => {
      if (!getWindow()) return false;
      return getProbe() !== null;
    },
    isOpen: () => {
      const fn = getProbe();
      if (!fn) return false;
      const start = now();
      fn();
      return now() - start > threshold;
    },
  };
}

export const debuggerChecker: Checker = createDebuggerChecker();
