/**
 * Protection orchestrator.
 *
 * Ties the DevTools detector, context-menu guard, keyboard shortcut guard,
 * and automatic redirect into a single `createProtection()` call.
 *
 * Accepts a simple options bag and internally handles:
 * - Double-fire prevention (redirect only once)
 * - Current-path check (don't redirect if already on the violation page)
 * - Full cleanup via `.stop()`
 *
 * Safe for SSR / static exports — `start()` is a no-op outside a browser.
 */

import { createDetector } from "../detector";
import { createContextMenuGuard } from "../context-menu";
import { createKeyboardGuard } from "../keyboard-guard";
import { getWindow, inBrowser } from "../env/browser";
import type { Detector } from "../detector/types";
import type { ContextMenuGuard, ContextMenuGuardOptions } from "../context-menu/types";
import type { KeyboardGuard, KeyboardGuardOptions } from "../keyboard-guard";
import type { DetectorOptions } from "../detector/types";

export interface ProtectionOptions {
  /** Master kill-switch. Default true. */
  enabled?: boolean;

  /**
   * Path to redirect to when DevTools are detected or a keyboard shortcut is
   * blocked. Pass `null` to disable redirect entirely (useful if you only want
   * the `onViolation` callback). Default: `null`.
   */
  redirectPath?: string | null;

  /**
   * Fires on any violation: devtools detected, keyboard shortcut blocked,
   * or context-menu suppressed. Useful for telemetry / Slack pings.
   */
  onViolation?: (detail: ViolationDetail) => void;

  /** Options forwarded to the detector. */
  detector?: Omit<DetectorOptions, "onDetected">;

  /** Options forwarded to the context-menu guard. */
  contextMenu?: ContextMenuGuardOptions;

  /** Options forwarded to the keyboard guard. */
  keyboard?: Omit<KeyboardGuardOptions, "onBlock" | "enabled">;

  /**
   * Individually disable sub-guards. All default to `true`.
   */
  features?: {
    detector?: boolean;
    contextMenu?: boolean;
    keyboard?: boolean;
  };
}

export type ViolationType = "devtools" | "keyboard";

export interface ViolationDetail {
  type: ViolationType;
  /** Additional info depending on type (checker name, key combo, etc.) */
  info?: string;
}

export interface Protection {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  /** Direct access to the underlying detector for advanced use. */
  readonly detector: Detector;
}

export function createProtection(options: ProtectionOptions = {}): Protection {
  const enabled = options.enabled ?? true;
  const redirectPath = options.redirectPath ?? null;
  const onViolation = options.onViolation;
  const features = {
    detector: options.features?.detector ?? true,
    contextMenu: options.features?.contextMenu ?? true,
    keyboard: options.features?.keyboard ?? true,
  };

  let running = false;
  let hasRedirected = false;

  function isAlreadyOnViolationPage(): boolean {
    if (!redirectPath) return false;
    const win = getWindow();
    if (!win) return false;
    return win.location.pathname === redirectPath;
  }

  function performRedirect(): void {
    if (!redirectPath) return;
    if (hasRedirected) return;
    if (isAlreadyOnViolationPage()) return;

    hasRedirected = true;
    const win = getWindow();
    if (win) {
      win.location.href = redirectPath;
    }
  }

  function handleViolation(detail: ViolationDetail): void {
    try {
      onViolation?.(detail);
    } catch {
      // Consumer callback failure shouldn't break the guard.
    }
    performRedirect();
  }

  // --- Sub-guards ---

  const detector = createDetector({
    ...options.detector,
    onDetected: (det) => {
      handleViolation({
        type: "devtools",
        info: det.checkerName ?? undefined,
      });
    },
  });

  const contextMenuGuard = createContextMenuGuard({
    ...options.contextMenu,
    enabled: features.contextMenu && enabled,
    onOpen: (detail) => {
      // The context menu guard replaces the native menu with a safe one —
      // that's not a violation. Just forward to the consumer's hook.
      options.contextMenu?.onOpen?.(detail);
    },
  });

  const keyboardGuard = createKeyboardGuard({
    ...options.keyboard,
    enabled: features.keyboard && enabled,
    onBlock: (detail) => {
      handleViolation({ type: "keyboard", info: detail.combo });
    },
  });

  return {
    get detector(): Detector {
      return detector;
    },
    start(): void {
      if (!inBrowser()) return;
      if (!enabled) return;
      if (running) return;
      running = true;
      hasRedirected = false;

      if (features.detector) detector.start();
      if (features.contextMenu) contextMenuGuard.start();
      if (features.keyboard) keyboardGuard.start();
    },
    stop(): void {
      detector.stop();
      contextMenuGuard.stop();
      keyboardGuard.stop();
      running = false;
    },
    isRunning(): boolean {
      return running;
    },
  };
}
