/**
 * Selection capture / restore.
 *
 * We snapshot the selection at `contextmenu` time (before our menu DOM is
 * mounted, so capturing is dead simple) and restore it just before invoking
 * copy / cut. Three flavours:
 *
 *   - `<input>` / `<textarea>` — selectionStart / selectionEnd / direction.
 *   - DOM ranges (document selection or contenteditable).
 *   - "none" — the user right-clicked without any selection.
 *
 * The whole module avoids touching `window` / `document` until called, so the
 * package stays static-export-safe.
 */

import type { SelectionSnapshot } from "./types";
import { getDocument, getWindow } from "../env/browser";

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "email",
  "password",
  "number",
]);

export function isTextInput(
  el: Element | null,
): el is HTMLInputElement | HTMLTextAreaElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has(el.type);
  }
  return false;
}

export function isContentEditable(el: Element | null): boolean {
  if (!el) return false;
  // `isContentEditable` walks ancestors so this handles nested cases.
  return (
    el instanceof HTMLElement && (el.isContentEditable || el.contentEditable === "true")
  );
}

export function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (isTextInput(el)) {
    const input = el as HTMLInputElement;
    return !input.readOnly && !input.disabled;
  }
  return isContentEditable(el);
}

export function isPasswordField(el: Element | null): boolean {
  return el instanceof HTMLInputElement && el.type === "password";
}

export function captureSelection(target: Element | null): SelectionSnapshot {
  if (isTextInput(target)) {
    const input = target;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const direction = (input.selectionDirection ?? "none") as
      | "forward"
      | "backward"
      | "none";
    return { kind: "input", target: input, start, end, direction };
  }

  const win = getWindow();
  const sel = win?.getSelection?.() ?? null;
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0).cloneRange();
    return {
      kind: "range",
      range,
      anchorNode: sel.anchorNode,
      anchorOffset: sel.anchorOffset,
      focusNode: sel.focusNode,
      focusOffset: sel.focusOffset,
    };
  }

  return { kind: "none" };
}

export function hasNonEmptySelection(snapshot: SelectionSnapshot): boolean {
  if (snapshot.kind === "input") return snapshot.end > snapshot.start;
  if (snapshot.kind === "range") return !snapshot.range.collapsed;
  return false;
}

export function restoreSelection(snapshot: SelectionSnapshot): void {
  if (snapshot.kind === "input") {
    const input = snapshot.target;
    input.focus({ preventScroll: true });
    try {
      input.setSelectionRange(
        snapshot.start,
        snapshot.end,
        snapshot.direction,
      );
    } catch {
      // Some <input type="number"> impls reject setSelectionRange. Best-effort.
    }
    return;
  }

  if (snapshot.kind === "range") {
    const win = getWindow();
    const sel = win?.getSelection?.();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(snapshot.range);
  }
}

export function getSelectedText(snapshot: SelectionSnapshot): string {
  if (snapshot.kind === "input") {
    return snapshot.target.value.slice(snapshot.start, snapshot.end);
  }
  if (snapshot.kind === "range") {
    return snapshot.range.toString();
  }
  return "";
}

export function spliceFromInput(snapshot: SelectionSnapshot): void {
  if (snapshot.kind !== "input") return;
  const input = snapshot.target;
  const value = input.value;
  input.value = value.slice(0, snapshot.start) + value.slice(snapshot.end);
  // Place caret where the deleted text started.
  try {
    input.setSelectionRange(snapshot.start, snapshot.start);
  } catch {
    // ignore
  }
  // Fire `input` so frameworks (React, Vue) pick the change up.
  const doc = getDocument();
  if (doc) {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
