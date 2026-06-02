/**
 * Keyboard shortcut guard.
 *
 * Blocks F12, Ctrl+Shift+I/J/C (Windows/Linux), and Cmd+Option+I/J/C (macOS)
 * from reaching the browser's default "open DevTools" binding. Fires an
 * `onBlock` callback so consumers can log, redirect, or show a warning.
 *
 * Safe to call in non-browser environments (SSR/static export) — `start()`
 * becomes a no-op.
 */

import { getWindow, inBrowser } from "../env/browser";

export interface KeyboardGuardOptions {
  /** Default true. Setting false makes start() a no-op (handy for feature flags). */
  enabled?: boolean;
  /** Fired each time a shortcut is intercepted. */
  onBlock?: (detail: KeyboardBlockDetail) => void;
}

export interface KeyboardBlockDetail {
  /** The shortcut that was blocked, e.g. "F12" or "Ctrl+Shift+I". */
  combo: string;
  /** The original KeyboardEvent. */
  event: KeyboardEvent;
}

export interface KeyboardGuard {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * Returns true if the event matches a DevTools-opening shortcut.
 */
function matchesDevToolsShortcut(e: KeyboardEvent): string | null {
  // F12
  if (e.key === "F12") return "F12";

  // Ctrl+Shift+I / Cmd+Option+I
  if (
    (e.ctrlKey && e.shiftKey && e.key === "I") ||
    (e.metaKey && e.altKey && e.key === "I")
  ) {
    return e.metaKey ? "Cmd+Option+I" : "Ctrl+Shift+I";
  }

  // Ctrl+Shift+J / Cmd+Option+J
  if (
    (e.ctrlKey && e.shiftKey && e.key === "J") ||
    (e.metaKey && e.altKey && e.key === "J")
  ) {
    return e.metaKey ? "Cmd+Option+J" : "Ctrl+Shift+J";
  }

  // Ctrl+Shift+C / Cmd+Option+C
  if (
    (e.ctrlKey && e.shiftKey && e.key === "C") ||
    (e.metaKey && e.altKey && e.key === "C")
  ) {
    return e.metaKey ? "Cmd+Option+C" : "Ctrl+Shift+C";
  }

  return null;
}

export function createKeyboardGuard(
  options: KeyboardGuardOptions = {},
): KeyboardGuard {
  const enabled = options.enabled ?? true;
  const onBlock = options.onBlock;

  let running = false;

  function onKeyDown(event: KeyboardEvent): void {
    const combo = matchesDevToolsShortcut(event);
    if (!combo) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      onBlock?.({ combo, event });
    } catch {
      // Consumer callback failure shouldn't break the guard.
    }
  }

  return {
    start(): void {
      if (!inBrowser()) return;
      if (!enabled) return;
      if (running) return;
      const win = getWindow();
      if (!win) return;
      win.addEventListener("keydown", onKeyDown, true);
      running = true;
    },
    stop(): void {
      const win = getWindow();
      if (win) {
        win.removeEventListener("keydown", onKeyDown, true);
      }
      running = false;
    },
    isRunning(): boolean {
      return running;
    },
  };
}
