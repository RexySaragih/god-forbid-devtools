/**
 * Cached `console` references.
 *
 * Some checkers (`performanceChecker`) drive DevTools by calling
 * `console.table` / `console.clear`. Holding native references protects us
 * against host code that monkey-patches `console` after import.
 *
 * All getters lazily resolve at call time so that nothing is touched during
 * module evaluation under static export.
 */

import { inBrowser } from "./browser";

type ConsoleLogFn = (...data: unknown[]) => void;
type ConsoleTableFn = (...data: unknown[]) => void;
type ConsoleClearFn = () => void;

interface ConsoleRef {
  log: ConsoleLogFn;
  table: ConsoleTableFn;
  clear: ConsoleClearFn;
}

const noopLog: ConsoleLogFn = () => undefined;
const noopTable: ConsoleTableFn = () => undefined;
const noopClear: ConsoleClearFn = () => undefined;

let cached: ConsoleRef | null = null;

export function getConsole(): ConsoleRef {
  if (cached) return cached;
  if (!inBrowser() || typeof console === "undefined") {
    return { log: noopLog, table: noopTable, clear: noopClear };
  }
  const tableFn =
    typeof console.table === "function"
      ? (console.table.bind(console) as ConsoleTableFn)
      : noopTable;
  const clearFn =
    typeof console.clear === "function"
      ? console.clear.bind(console)
      : noopClear;
  const ref: ConsoleRef = {
    log: console.log.bind(console) as ConsoleLogFn,
    table: tableFn,
    clear: clearFn,
  };
  cached = ref;
  return ref;
}

/** Test seam — drop the cached references. Not exported from the package. */
export function __resetConsoleCache(): void {
  cached = null;
}
