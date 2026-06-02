/**
 * Action handlers for the context menu items.
 *
 * Order of preference for copy / cut:
 *   1. `document.execCommand('copy' | 'cut')` after restoring selection. This
 *      keeps native browser semantics (correct line endings, contenteditable
 *      handling).
 *   2. `navigator.clipboard.writeText(selectedText)` fallback if execCommand
 *      reports failure or isn't available.
 *
 * For `cut` on `<input>` / `<textarea>`, the DOM mutation is performed
 * manually after a clipboard-API fallback so frameworks observe the change.
 */

import type { ContextDetails, ContextMenuItemId } from "./types";
import {
  getSelectedText,
  hasNonEmptySelection,
  restoreSelection,
  spliceFromInput,
} from "./selection";
import { getDocument, getNavigator, getWindow } from "../env/browser";

export interface ActionResult {
  ok: boolean;
}

interface ExecCommandFn {
  (command: string, showUI?: boolean, value?: string): boolean;
}

function tryExecCommand(command: "copy" | "cut"): boolean {
  const doc = getDocument() as
    | (Document & { execCommand?: ExecCommandFn })
    | null;
  if (!doc?.execCommand) return false;
  try {
    return doc.execCommand(command);
  } catch {
    return false;
  }
}

async function tryClipboardWrite(text: string): Promise<boolean> {
  const nav = getNavigator();
  if (!nav?.clipboard?.writeText) return false;
  try {
    await nav.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function isItemEnabled(
  item: ContextMenuItemId,
  ctx: ContextDetails,
): boolean {
  if (item === "refresh") return true;
  if (ctx.isPasswordField) return false;

  if (item === "copy") return ctx.hasNonEmptySelection;
  if (item === "cut") {
    return ctx.isEditable && ctx.hasNonEmptySelection;
  }
  return false;
}

export function performRefresh(): ActionResult {
  const win = getWindow();
  if (!win) return { ok: false };
  win.location.reload();
  return { ok: true };
}

export async function performCopy(ctx: ContextDetails): Promise<ActionResult> {
  if (!hasNonEmptySelection(ctx.selection)) return { ok: false };
  restoreSelection(ctx.selection);

  if (tryExecCommand("copy")) return { ok: true };

  const text = getSelectedText(ctx.selection);
  if (!text) return { ok: false };
  const ok = await tryClipboardWrite(text);
  return { ok };
}

export async function performCut(ctx: ContextDetails): Promise<ActionResult> {
  if (!ctx.isEditable || !hasNonEmptySelection(ctx.selection)) {
    return { ok: false };
  }
  restoreSelection(ctx.selection);

  if (tryExecCommand("cut")) return { ok: true };

  // Fallback: copy via clipboard API + manual DOM mutation.
  const text = getSelectedText(ctx.selection);
  if (!text) return { ok: false };
  const wrote = await tryClipboardWrite(text);
  if (!wrote) return { ok: false };

  if (ctx.selection.kind === "input") {
    spliceFromInput(ctx.selection);
    return { ok: true };
  }

  if (ctx.selection.kind === "range") {
    try {
      ctx.selection.range.deleteContents();
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  return { ok: false };
}
