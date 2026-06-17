/**
 * Custom formatters checker (Chromium only).
 *
 * Chrome / Edge / Brave with the "Custom formatters" DevTools setting enabled
 * call `header()` on objects in `window.devtoolsFormatters` when DevTools
 * deserialises them for display. Logging an object that hosts such a formatter
 * gives us a passive signal at zero perf cost.
 *
 * Off in Firefox / Safari (no equivalent API).
 */

import type { Checker } from "../types";
import { getConsole } from "../../env/console";
import { getWindow, isFirefox, isSafari } from "../../env/browser";

interface DevtoolsFormatter {
  header: (obj: unknown) => unknown;
  hasBody: () => boolean;
  body?: (obj: unknown) => unknown;
}

declare global {
  interface Window {
    devtoolsFormatters?: DevtoolsFormatter[];
  }
}

export function createDevtoolsFormattersChecker(): Checker {
  let triggered = false;
  let installed = false;

  function install(w: Window): void {
    if (installed) return;
    installed = true;

    const probe = {};
    const formatter: DevtoolsFormatter = {
      header: (target) => {
        if (target === probe) {
          triggered = true;
        }
        return null;
      },
      hasBody: () => false,
    };

    const existing = w.devtoolsFormatters ?? [];
    w.devtoolsFormatters = [...existing, formatter];

    // Stash the probe on the window so the formatter can be poked once.
    (w as Window & { __gfdFormatterProbe?: object }).__gfdFormatterProbe =
      probe;
  }

  return {
    name: "devtools-formatters",
    category: "cheap",
    isEnabled: () => {
      if (!getWindow()) return false;
      // Only Chromium ships this hook. Firefox/Safari simply don't call it.
      return !isFirefox() && !isSafari();
    },
    isOpen: () => {
      const w = getWindow();
      if (!w) return false;
      install(w);

      // Reset before each probe — only a synchronous trigger (DevTools
      // actually rendering the formatter) counts. Prevents permanent
      // false-positives from transient browser behaviour (e.g. right-click
      // "Open link in new tab" briefly serialising console objects).
      triggered = false;

      const probe = (w as Window & { __gfdFormatterProbe?: object })
        .__gfdFormatterProbe;
      if (probe) {
        // Logging via a no-op formatter doesn't show up unless DevTools is
        // open and its custom-formatter setting is on.
        getConsole().log(probe);
      }

      return triggered;
    },
  };
}

export const devtoolsFormattersChecker: Checker =
  createDevtoolsFormattersChecker();
