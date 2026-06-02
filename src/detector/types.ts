/**
 * Public + internal types for the DevTools detector.
 *
 * A `Checker` is a self-contained module that answers: "Right now, do my
 * heuristics suggest DevTools is open?" Cheap checkers run every poll; heavy
 * checkers (like `performanceChecker`) only run after a cheap checker has
 * hinted positive in the previous poll — see the two-tier strategy in
 * `detector/index.ts`.
 */

export type CheckerCategory = "cheap" | "heavy";

export interface CheckerContext {
  /** Polls counted from the moment `start()` was called. Useful for backoff. */
  readonly pollCount: number;
  /** Last reported open state. Lets a checker react to transitions. */
  readonly previouslyOpen: boolean;
  /**
   * `true` if any cheap checker hinted positive on the previous poll. The
   * detector uses this to gate `heavy` checkers.
   */
  readonly cheapHintedOnPreviousPoll: boolean;
}

export interface Checker {
  /** Stable identifier used in `DevtoolsDetail.checkerName` and logs. */
  readonly name: string;
  /**
   * Categorisation. `heavy` checkers may pollute the console (e.g.
   * `console.table`/`console.clear`) — the detector only invokes them when
   * gated by a cheap positive hint to avoid spamming legit dev sessions.
   */
  readonly category: CheckerCategory;
  /** Env / capability gate. Skipped checkers never run `isOpen()`. */
  isEnabled(ctx: CheckerContext): boolean | Promise<boolean>;
  /** The actual detection probe. */
  isOpen(ctx: CheckerContext): boolean | Promise<boolean>;
}

export interface DevtoolsDetail {
  isOpen: boolean;
  checkerName: string | null;
}

export type DevtoolsListener = (
  isOpen: boolean,
  detail: DevtoolsDetail,
) => void;

export interface DetectorOptions {
  /** Defaults to recommended set: window-size, formatters, performance, eruda, console-trap. */
  checkers?: Checker[];
  /** Default 500. */
  pollIntervalMs?: number;
  /** Default true → dispatches `devtoolschange` `CustomEvent` on `window`. */
  emitWindowEvent?: boolean;
  /**
   * Number of consecutive positive polls required before reporting `isOpen=true`.
   * Default 1. Raise to cushion window-size false positives on multi-monitor setups.
   */
  confirmationPolls?: number;
  /**
   * Fires exactly once on the first positive detection (covers both "already open
   * at start" and "opened later"). After firing it is never called again for this
   * detector instance. Removes the need to wire addEventListener + check isOpen
   * separately.
   */
  onDetected?: (detail: DevtoolsDetail) => void;
}

export interface Detector {
  readonly isOpen: boolean;
  start(): void;
  stop(): void;
  isRunning(): boolean;
  setPollInterval(ms: number): void;
  addListener(listener: DevtoolsListener): () => void;
  removeListener(listener: DevtoolsListener): void;
}

/** Compat type matching the old `devtools-detect` window event payload. */
export type DevToolsEvent = CustomEvent<{
  isOpen: boolean;
  orientation?: "vertical" | "horizontal";
}>;
