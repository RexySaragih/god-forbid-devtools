/**
 * Barrel for individual checkers. Re-export only — never import this from the
 * detector core because we want each checker to be tree-shakable when a
 * consumer picks a custom set.
 */

export {
  windowSizeChecker,
  createWindowSizeChecker,
  type WindowSizeOptions,
} from "./window-size";
export {
  devtoolsFormattersChecker,
  createDevtoolsFormattersChecker,
} from "./devtools-formatters";
export {
  performanceChecker,
  createPerformanceChecker,
  type PerformanceOptions,
} from "./performance";
export { erudaChecker, createErudaChecker } from "./eruda";
export {
  consoleLogTrapChecker,
  createConsoleLogTrapChecker,
} from "./console-log-trap";
export {
  debuggerChecker,
  createDebuggerChecker,
  type DebuggerOptions,
} from "./debugger";
