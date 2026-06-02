import type { Checker, Detector } from "../../src/detector/types";
import { createDetector } from "../../src/detector";

export interface StubCheckerOptions {
  name?: string;
  category?: "cheap" | "heavy";
  enabled?: boolean;
  isOpen?: boolean;
}

export interface StubChecker extends Checker {
  setOpen(open: boolean): void;
  setEnabled(enabled: boolean): void;
  callCount: () => number;
}

export function createStubChecker(opts: StubCheckerOptions = {}): StubChecker {
  let open = opts.isOpen ?? false;
  let enabled = opts.enabled ?? true;
  let calls = 0;

  return {
    name: opts.name ?? "stub",
    category: opts.category ?? "cheap",
    isEnabled: () => enabled,
    isOpen: () => {
      calls += 1;
      return open;
    },
    setOpen: (next) => {
      open = next;
    },
    setEnabled: (next) => {
      enabled = next;
    },
    callCount: () => calls,
  };
}

export interface SetupDetectorResult {
  detector: Detector;
  flush(times?: number): Promise<void>;
}

/**
 * Build a detector that doesn't auto-tick. We drive the loop manually via
 * `flush()` to keep tests deterministic.
 *
 * vitest fake timers are used to advance the internal `setTimeout` recursion;
 * `flush(n)` runs n ticks.
 */
export function setupDetector(
  checkers: Checker[],
  options: { confirmationPolls?: number; pollIntervalMs?: number } = {},
): SetupDetectorResult {
  const detector = createDetector({
    checkers,
    pollIntervalMs: options.pollIntervalMs ?? 100,
    confirmationPolls: options.confirmationPolls,
    emitWindowEvent: true,
  });

  async function flush(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await Promise.resolve();
      await Promise.resolve();
      // Advance the scheduled timeout.
      const { vi } = await import("vitest");
      vi.advanceTimersByTime(options.pollIntervalMs ?? 100);
      await Promise.resolve();
      await Promise.resolve();
    }
  }

  return { detector, flush };
}
