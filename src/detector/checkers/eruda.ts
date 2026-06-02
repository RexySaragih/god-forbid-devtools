/**
 * Eruda checker.
 *
 * Eruda is the most popular in-page mobile console. If `window.eruda` exists,
 * something is actively introspecting the page. Cheap global lookup, no perf
 * cost.
 */

import type { Checker } from "../types";
import { getWindow } from "../../env/browser";

export function createErudaChecker(): Checker {
  return {
    name: "eruda",
    category: "cheap",
    isEnabled: () => Boolean(getWindow()),
    isOpen: () => {
      const w = getWindow();
      if (!w) return false;
      return Boolean(
        (w as Window & { eruda?: unknown }).eruda,
      );
    },
  };
}

export const erudaChecker: Checker = createErudaChecker();
