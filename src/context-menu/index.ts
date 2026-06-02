/**
 * Context-menu guard orchestrator.
 *
 * Wires the `contextmenu` listener (`capture: true` so we win against
 * app-level handlers), suppresses the native menu, mounts our replacement,
 * and tears down on the usual culprits (outside click, scroll, blur, escape,
 * route change, another contextmenu).
 *
 * Refresh / Copy / Cut behaviour lives in `actions.ts`. Selection capture
 * lives in `selection.ts`. This file is the glue.
 */

import type {
  ContextDetails,
  ContextMenuGuard,
  ContextMenuGuardOptions,
  ContextMenuItemId,
} from "./types";
import {
  applyEnabledState,
  buildMenu,
  DEFAULT_LABELS,
  positionMenu,
  type MenuHandle,
} from "./menu";
import { createKeyboardController } from "./keyboard";
import {
  performCopy,
  performCut,
  performRefresh,
  isItemEnabled,
} from "./actions";
import {
  captureSelection,
  hasNonEmptySelection,
  isEditable,
  isPasswordField,
  restoreSelection,
} from "./selection";
import { injectStyles, removeStyles } from "./styles";
import { appendToBody, removeNode } from "../env/dom";
import { getDocument, getWindow, inBrowser } from "../env/browser";

const DEFAULT_Z_INDEX = 2_147_483_000;
const DEFAULT_ITEMS: ContextMenuItemId[] = ["refresh", "copy", "cut"];

export type {
  ContextMenuGuard,
  ContextMenuGuardOptions,
  ContextMenuItemId,
  ContextMenuTheme,
} from "./types";

export function createContextMenuGuard(
  options: ContextMenuGuardOptions = {},
): ContextMenuGuard {
  const enabled = options.enabled ?? true;
  const items = options.items ?? DEFAULT_ITEMS;
  const labels: Record<ContextMenuItemId, string> = {
    ...DEFAULT_LABELS,
    ...options.labels,
  };
  const theme = options.theme ?? "system";
  const zIndex = options.zIndex ?? DEFAULT_Z_INDEX;
  const styleNonce = options.styleNonce;
  const shouldHandle = options.shouldHandle;
  const onOpen = options.onOpen;
  const onAction = options.onAction;

  let running = false;
  let menuHandle: MenuHandle | null = null;
  let openContext: ContextDetails | null = null;
  let keyboard: ReturnType<typeof createKeyboardController> | null = null;

  function ensureMenu(): MenuHandle | null {
    if (menuHandle) return menuHandle;
    menuHandle = buildMenu({ items, labels, zIndex, theme });
    if (!menuHandle) return null;

    // Wire click handlers.
    menuHandle.root.addEventListener("click", onMenuClick);

    return menuHandle;
  }

  function onMenuClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    // Traverse up to the button element that carries `data-gfd-item`.
    const btn = target.closest<HTMLElement>("[data-gfd-item]");
    if (!btn) return;
    const itemId = btn.dataset.gfdItem as ContextMenuItemId | undefined;
    if (!itemId) return;
    if (!openContext) return;
    if (!isItemEnabled(itemId, openContext)) return;
    event.preventDefault();
    void invokeAction(itemId);
  }

  async function invokeAction(id: ContextMenuItemId): Promise<void> {
    if (!openContext) return;
    const ctx = openContext;
    closeMenu();

    let result = { ok: false };
    if (id === "refresh") {
      result = performRefresh();
    } else if (id === "copy") {
      result = await performCopy(ctx);
    } else if (id === "cut") {
      result = await performCut(ctx);
    }

    if (result.ok) {
      try {
        onAction?.(id);
      } catch {
        // host hook failure shouldn't break the guard
      }
    }
  }

  function buildContext(event: MouseEvent): ContextDetails | null {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return null;

    const selection = captureSelection(target);
    return {
      x: event.clientX,
      y: event.clientY,
      target,
      targetTag: target.tagName.toLowerCase(),
      isEditable: isEditable(target),
      isPasswordField: isPasswordField(target),
      selection,
      hasNonEmptySelection: hasNonEmptySelection(selection),
    };
  }

  function onContextMenu(event: MouseEvent): void {
    if (!running) return;

    if (shouldHandle && !shouldHandle(event)) {
      // Let the native menu through.
      return;
    }

    event.preventDefault();

    const ctx = buildContext(event);
    if (!ctx) return;

    const handle = ensureMenu();
    if (!handle) return;

    openContext = ctx;
    applyEnabledState(handle, ctx);

    if (handle.root.parentNode === null) {
      appendToBody(handle.root);
    }

    positionMenu(handle, ctx.x, ctx.y);

    // Re-apply the captured selection so the host page's text highlight stays
    // visibly active after our menu mounts. Without this, browsers (especially
    // Chrome) render the selection as "inactive" and the highlight fades.
    if (ctx.selection.kind === "range") {
      restoreSelection(ctx.selection);
    }

    // Mark body so our CSS can keep the inactive selection visible.
    const doc = getDocument();
    doc?.body?.classList.add("gfd-menu-open");

    keyboard = createKeyboardController(handle.buttons, {
      onActivate: (id) => {
        void invokeAction(id);
      },
      onClose: closeMenu,
    });
    keyboard.reset();

    attachTeardownListeners();

    try {
      onOpen?.({ x: ctx.x, y: ctx.y, targetTag: ctx.targetTag });
    } catch {
      // host hook failure shouldn't break the guard
    }
  }

  function onDocumentMouseDown(event: MouseEvent): void {
    if (!menuHandle) return;
    if (event.target instanceof Node && menuHandle.root.contains(event.target)) {
      return;
    }
    closeMenu();
  }

  function onDocumentKeyDown(event: KeyboardEvent): void {
    keyboard?.handle(event);
  }

  function onWindowScroll(): void {
    closeMenu();
  }

  function onWindowBlur(): void {
    closeMenu();
  }

  function onWindowPopState(): void {
    closeMenu();
  }

  function attachTeardownListeners(): void {
    const doc = getDocument();
    const win = getWindow();
    if (!doc || !win) return;
    doc.addEventListener("mousedown", onDocumentMouseDown, true);
    doc.addEventListener("keydown", onDocumentKeyDown, true);
    win.addEventListener("scroll", onWindowScroll, true);
    win.addEventListener("resize", onWindowScroll, true);
    win.addEventListener("blur", onWindowBlur);
    win.addEventListener("popstate", onWindowPopState);
  }

  function detachTeardownListeners(): void {
    const doc = getDocument();
    const win = getWindow();
    if (!doc || !win) return;
    doc.removeEventListener("mousedown", onDocumentMouseDown, true);
    doc.removeEventListener("keydown", onDocumentKeyDown, true);
    win.removeEventListener("scroll", onWindowScroll, true);
    win.removeEventListener("resize", onWindowScroll, true);
    win.removeEventListener("blur", onWindowBlur);
    win.removeEventListener("popstate", onWindowPopState);
  }

  function closeMenu(): void {
    detachTeardownListeners();
    keyboard = null;
    openContext = null;
    const doc = getDocument();
    doc?.body?.classList.remove("gfd-menu-open");
    if (menuHandle) {
      removeNode(menuHandle.root);
    }
  }

  return {
    start(): void {
      if (!inBrowser()) return;
      if (!enabled) return;
      if (running) return;
      const win = getWindow();
      if (!win) return;
      injectStyles(styleNonce);
      win.addEventListener("contextmenu", onContextMenu, true);
      running = true;
    },
    stop(): void {
      const win = getWindow();
      if (win) {
        win.removeEventListener("contextmenu", onContextMenu, true);
      }
      closeMenu();
      if (menuHandle) {
        menuHandle.destroy();
        menuHandle = null;
      }
      removeStyles();
      running = false;
    },
    isRunning(): boolean {
      return running;
    },
  };
}
