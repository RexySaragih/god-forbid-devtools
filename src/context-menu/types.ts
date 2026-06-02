/**
 * Public + internal types for the context-menu guard.
 */

export type ContextMenuItemId = "refresh" | "copy" | "cut";

export type ContextMenuTheme = "system" | "light" | "dark" | "coffee";

export interface ContextMenuGuardOptions {
  /** Default true. Setting false makes start() a no-op (handy for feature flags). */
  enabled?: boolean;
  /** Subset and order of items. Default ["refresh", "copy", "cut"]. */
  items?: ContextMenuItemId[];
  /** Override labels (i18n). */
  labels?: Partial<Record<ContextMenuItemId, string>>;
  /**
   * Visual theme for the menu.
   * - "system" — Adapts to OS light/dark preference with subtle translucency (default)
   * - "light"  — Clean opaque white, works on any background
   * - "dark"   — Solid dark surface, high contrast
   * - "coffee" — Warm cream/brown tones, cozy and grounded
   */
  theme?: ContextMenuTheme;
  /** Stacking. Default 2_147_483_000. */
  zIndex?: number;
  /** CSP nonce for the injected <style> tag. */
  styleNonce?: string;
  /** Optional predicate; return false to let the native menu through. */
  shouldHandle?: (event: MouseEvent) => boolean;
  /** Hook for telemetry (e.g. Slack ping when blocked). Called once per open. */
  onOpen?: (detail: { x: number; y: number; targetTag: string }) => void;
  /** Hook fired after each successful action. */
  onAction?: (action: ContextMenuItemId) => void;
}

export interface ContextMenuGuard {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * Snapshot of a selection captured at `contextmenu` time. We restore it on
 * the original target before invoking copy / cut so that browsers see a
 * "real" selection at the time of the clipboard operation.
 */
export type SelectionSnapshot =
  | {
      kind: "input";
      target: HTMLInputElement | HTMLTextAreaElement;
      start: number;
      end: number;
      direction: "forward" | "backward" | "none";
    }
  | {
      kind: "range";
      range: Range;
      anchorNode: Node | null;
      anchorOffset: number;
      focusNode: Node | null;
      focusOffset: number;
    }
  | { kind: "none" };

export interface ContextDetails {
  x: number;
  y: number;
  target: Element;
  targetTag: string;
  isEditable: boolean;
  isPasswordField: boolean;
  selection: SelectionSnapshot;
  hasNonEmptySelection: boolean;
}
