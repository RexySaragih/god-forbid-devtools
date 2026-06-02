/**
 * Console log trap checker.
 *
 * Logs an object whose property is defined as a getter. The getter only fires
 * when DevTools deserialises the object for display. Passive cross-check that
 * doesn't depend on `console.table` of a 25k-key payload.
 *
 * Like the formatters checker, this is Chromium-flavoured but the worst case
 * on other engines is "always returns false," not a crash.
 */

import type { Checker } from "../types";
import { getConsole } from "../../env/console";
import { getWindow } from "../../env/browser";

export function createConsoleLogTrapChecker(): Checker {
  let triggered = false;

  // Build the trap eagerly per checker instance, but don't actually log
  // anything until isOpen() is invoked.
  const trap: Record<string, unknown> = {};
  Object.defineProperty(trap, "id", {
    get: () => {
      triggered = true;
      return "gfd-trap";
    },
  });

  return {
    name: "console-log-trap",
    category: "cheap",
    isEnabled: () => Boolean(getWindow()),
    isOpen: () => {
      const consoleRef = getConsole();
      consoleRef.log(trap);
      return triggered;
    },
  };
}

export const consoleLogTrapChecker: Checker = createConsoleLogTrapChecker();
