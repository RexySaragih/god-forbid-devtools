/**
 * Public API surface.
 *
 * Both features are opt-in via `start()`. Importing this module performs zero
 * DOM / console / window access — safe to evaluate during a Next.js static
 * export pass.
 */

// --- WindowEventMap augmentation (type-only, no runtime cost) ---

export type { DevtoolsChangeEventDetail } from "./types/window-events";

// --- Detector ---

export { createDetector } from "./detector";
export type {
  Checker,
  CheckerCategory,
  CheckerContext,
  Detector,
  DetectorOptions,
  DevtoolsDetail,
  DevtoolsListener,
  DevToolsEvent,
} from "./detector/types";

export {
  windowSizeChecker,
  createWindowSizeChecker,
  type WindowSizeOptions,
  devtoolsFormattersChecker,
  createDevtoolsFormattersChecker,
  performanceChecker,
  createPerformanceChecker,
  type PerformanceOptions,
  erudaChecker,
  createErudaChecker,
  consoleLogTrapChecker,
  createConsoleLogTrapChecker,
  debuggerChecker,
  createDebuggerChecker,
  type DebuggerOptions,
} from "./detector/checkers";

// --- Context-menu guard ---

export { createContextMenuGuard } from "./context-menu";
export type {
  ContextMenuGuard,
  ContextMenuGuardOptions,
  ContextMenuItemId,
  ContextMenuTheme,
} from "./context-menu/types";

// --- Keyboard shortcut guard ---

export { createKeyboardGuard } from "./keyboard-guard";
export type {
  KeyboardGuard,
  KeyboardGuardOptions,
  KeyboardBlockDetail,
} from "./keyboard-guard";

// --- Protection orchestrator ---

export { createProtection } from "./protection";
export type {
  Protection,
  ProtectionOptions,
  ViolationDetail,
  ViolationType,
} from "./protection";

// --- No-JS fallback ---

export { createNoJsOverlay, noscriptRedirectSnippet } from "./noscript";
export type {
  NoJsOverlay,
  NoJsOverlayOptions,
  NoscriptRedirectOptions,
} from "./noscript";

// --- Source-map stripping ---

export { SourceMapStripPlugin, withSourceMapStrip } from "./sourcemap-strip";
export type { SourceMapStripOptions } from "./sourcemap-strip";

// --- Default export: sindresorhus-compat singleton detector ---

import { defaultDetector } from "./compat/sindresorhus";
export default defaultDetector;
