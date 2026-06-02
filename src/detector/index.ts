/**
 * DevTools detector core.
 *
 * Single `setTimeout` recursion (not `setInterval`) so an overrunning checker
 * doesn't pile up calls. Each iteration runs checkers in declared order and
 * short-circuits on the first positive. Heavy checkers are gated on a cheap
 * positive from the previous poll — see `CheckerCategory`.
 */

import type {
  Checker,
  CheckerContext,
  Detector,
  DetectorOptions,
  DevtoolsDetail,
  DevtoolsListener,
} from "./types";
import { getWindow, inBrowser } from "../env/browser";
import {
  windowSizeChecker,
  devtoolsFormattersChecker,
  performanceChecker,
  erudaChecker,
  consoleLogTrapChecker,
} from "./checkers";

const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_CONFIRMATION_POLLS = 1;

function defaultCheckers(): Checker[] {
  return [
    windowSizeChecker,
    devtoolsFormattersChecker,
    erudaChecker,
    consoleLogTrapChecker,
    performanceChecker,
  ];
}

export function createDetector(options: DetectorOptions = {}): Detector {
  const checkers = options.checkers ?? defaultCheckers();
  let pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const emitWindowEvent = options.emitWindowEvent ?? true;
  const confirmationPolls = Math.max(
    1,
    options.confirmationPolls ?? DEFAULT_CONFIRMATION_POLLS,
  );
  const onDetected = options.onDetected;

  let currentlyOpen = false;
  let lastCheckerName: string | null = null;
  let pendingPositivePolls = 0;
  let pendingNegativePolls = 0;
  let pollCount = 0;
  let cheapHintedOnPreviousPoll = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let onDetectedFired = false;

  const listeners = new Set<DevtoolsListener>();

  function dispatchChange(detail: DevtoolsDetail): void {
    // Fire onDetected exactly once on first positive.
    if (detail.isOpen && !onDetectedFired && onDetected) {
      onDetectedFired = true;
      try {
        onDetected(detail);
      } catch {
        // Consumer callback failure shouldn't kill the detector loop.
      }
    }

    for (const listener of listeners) {
      try {
        listener(detail.isOpen, detail);
      } catch {
        // Listener throws shouldn't kill the detector loop.
      }
    }

    if (!emitWindowEvent) return;
    const w = getWindow();
    if (!w) return;
    const event = new CustomEvent<{ isOpen: boolean }>("devtoolschange", {
      detail: { isOpen: detail.isOpen },
    });
    w.dispatchEvent(event);
  }

  function buildContext(): CheckerContext {
    return {
      pollCount,
      previouslyOpen: currentlyOpen,
      cheapHintedOnPreviousPoll,
    };
  }

  async function runOnce(): Promise<{
    isOpen: boolean;
    checkerName: string | null;
    cheapHinted: boolean;
  }> {
    const ctx = buildContext();
    let cheapHinted = false;
    let firstPositive: string | null = null;

    for (const checker of checkers) {
      const isHeavy = checker.category === "heavy";
      // Heavy checkers are only invoked when a cheap one hinted last poll, OR
      // when a heavy one already triggered last poll (so we keep watching).
      if (isHeavy && !cheapHintedOnPreviousPoll && !currentlyOpen) {
        continue;
      }

      let enabled = false;
      try {
        enabled = await checker.isEnabled(ctx);
      } catch {
        enabled = false;
      }
      if (!enabled) continue;

      let open = false;
      try {
        open = await checker.isOpen(ctx);
      } catch {
        open = false;
      }

      if (open) {
        firstPositive = checker.name;
        if (!isHeavy) cheapHinted = true;
        // Short-circuit: first positive wins.
        return { isOpen: true, checkerName: firstPositive, cheapHinted: true };
      }
    }

    return { isOpen: false, checkerName: null, cheapHinted };
  }

  function scheduleNext(): void {
    if (!running) return;
    timer = setTimeout(() => {
      void tick();
    }, pollIntervalMs);
  }

  async function tick(): Promise<void> {
    if (!running) return;
    pollCount += 1;

    const result = await runOnce();
    cheapHintedOnPreviousPoll = result.cheapHinted;

    if (result.isOpen) {
      pendingNegativePolls = 0;
      if (!currentlyOpen) {
        pendingPositivePolls += 1;
        if (pendingPositivePolls >= confirmationPolls) {
          currentlyOpen = true;
          lastCheckerName = result.checkerName;
          pendingPositivePolls = 0;
          dispatchChange({ isOpen: true, checkerName: lastCheckerName });
        }
      } else {
        pendingPositivePolls = 0;
      }
    } else {
      pendingPositivePolls = 0;
      if (currentlyOpen) {
        pendingNegativePolls += 1;
        if (pendingNegativePolls >= confirmationPolls) {
          currentlyOpen = false;
          lastCheckerName = null;
          pendingNegativePolls = 0;
          dispatchChange({ isOpen: false, checkerName: null });
        }
      } else {
        pendingNegativePolls = 0;
      }
    }

    scheduleNext();
  }

  return {
    get isOpen(): boolean {
      return currentlyOpen;
    },
    start(): void {
      if (!inBrowser()) return;
      if (running) return;
      running = true;
      pollCount = 0;
      pendingPositivePolls = 0;
      pendingNegativePolls = 0;
      cheapHintedOnPreviousPoll = false;
      // Schedule first tick on the next interval. Keeps timer-mocked tests
      // deterministic (advance by N intervals → exactly N polls observed).
      scheduleNext();
    },
    stop(): void {
      running = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
    isRunning(): boolean {
      return running;
    },
    setPollInterval(ms: number): void {
      pollIntervalMs = Math.max(50, ms | 0);
    },
    addListener(listener: DevtoolsListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    removeListener(listener: DevtoolsListener): void {
      listeners.delete(listener);
    },
  };
}
