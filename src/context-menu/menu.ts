/**
 * Menu DOM construction + positioning.
 *
 * One menu node per guard instance; we reuse it across opens. Positioning
 * clamps the menu inside the viewport (8px padding) so it never spawns
 * partially off-screen.
 *
 * Each item renders:
 * - A 16x16 SVG icon (inline, no external deps)
 * - The label text
 * - A keyboard shortcut hint (right-aligned, dimmed)
 */

import type { ContextDetails, ContextMenuItemId, ContextMenuTheme } from "./types";
import { isItemEnabled } from "./actions";
import {
  MENU_CLASS,
  MENU_ITEM_CLASS,
  MENU_ITEM_DISABLED_CLASS,
  MENU_ITEM_FOCUSED_CLASS,
  MENU_ITEM_ICON_CLASS,
  MENU_ITEM_SHORTCUT_CLASS,
  MENU_SEPARATOR_CLASS,
} from "./styles";
import { createElement, removeNode } from "../env/dom";
import { getWindow } from "../env/browser";

const VIEWPORT_PADDING = 8;

export const DEFAULT_LABELS: Record<ContextMenuItemId, string> = {
  refresh: "Refresh",
  copy: "Copy",
  cut: "Cut",
};

/**
 * Inline SVG icons — crisp 16x16 stroke icons. No external dependency.
 * Designed with stroke-width 1.5 for a refined, consistent look.
 */
const ICONS: Record<ContextMenuItemId, string> = {
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  copy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  cut: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
};

/**
 * Keyboard shortcut hints. Detects macOS for symbol notation.
 */
function isMacPlatform(): boolean {
  const win = getWindow();
  if (!win) return false;
  const nav = win.navigator;
  // Modern: navigator.userAgentData. Fallback: navigator.platform.
  if ("userAgentData" in nav) {
    const uad = nav as Navigator & {
      userAgentData?: { platform?: string };
    };
    return uad.userAgentData?.platform === "macOS";
  }
  return /Mac|iPhone|iPad|iPod/.test(nav.platform ?? "");
}

function getShortcuts(): Record<ContextMenuItemId, string> {
  const mac = isMacPlatform();
  return {
    refresh: mac ? "\u2318R" : "Ctrl+R",
    copy: mac ? "\u2318C" : "Ctrl+C",
    cut: mac ? "\u2318X" : "Ctrl+X",
  };
}

export interface MenuRenderConfig {
  items: ContextMenuItemId[];
  labels: Record<ContextMenuItemId, string>;
  zIndex: number;
  theme: ContextMenuTheme;
}

export interface MenuHandle {
  root: HTMLUListElement;
  buttons: Map<ContextMenuItemId, HTMLButtonElement>;
  destroy(): void;
}

export function buildMenu(config: MenuRenderConfig): MenuHandle | null {
  const root = createElement("ul");
  if (!root) return null;
  root.className = MENU_CLASS;
  root.setAttribute("role", "menu");
  root.setAttribute("data-gfd-theme", config.theme);
  root.tabIndex = -1;
  root.style.zIndex = String(config.zIndex);
  root.style.visibility = "hidden";

  const buttons = new Map<ContextMenuItemId, HTMLButtonElement>();
  const shortcuts = getShortcuts();

  for (let i = 0; i < config.items.length; i++) {
    const id = config.items[i]!;

    // Insert a separator between "Refresh" and the clipboard group.
    if (i === 1 && config.items[0] === "refresh") {
      const sep = createElement("li");
      if (sep) {
        sep.className = MENU_SEPARATOR_CLASS;
        sep.setAttribute("role", "separator");
        root.appendChild(sep);
      }
    }

    const li = createElement("li");
    if (!li) continue;
    li.setAttribute("role", "none");

    const btn = createElement("button");
    if (!btn) continue;
    btn.type = "button";
    btn.className = MENU_ITEM_CLASS;
    btn.setAttribute("role", "menuitem");
    btn.dataset.gfdItem = id;
    btn.dataset.gfdLabel = config.labels[id];
    btn.tabIndex = -1;
    // Prevent focus theft when the user mousedowns the button.
    btn.addEventListener("mousedown", (e) => e.preventDefault());

    // Icon
    const iconSpan = createElement("span");
    if (iconSpan) {
      iconSpan.className = MENU_ITEM_ICON_CLASS;
      iconSpan.innerHTML = ICONS[id];
      iconSpan.setAttribute("aria-hidden", "true");
      btn.appendChild(iconSpan);
    }

    // Label
    const labelSpan = createElement("span");
    if (labelSpan) {
      labelSpan.textContent = config.labels[id];
      btn.appendChild(labelSpan);
    }

    // Shortcut hint
    const shortcutSpan = createElement("span");
    if (shortcutSpan) {
      shortcutSpan.className = MENU_ITEM_SHORTCUT_CLASS;
      shortcutSpan.textContent = shortcuts[id];
      shortcutSpan.setAttribute("aria-hidden", "true");
      btn.appendChild(shortcutSpan);
    }

    li.appendChild(btn);
    root.appendChild(li);
    buttons.set(id, btn);
  }

  return {
    root,
    buttons,
    destroy(): void {
      removeNode(root);
      buttons.clear();
    },
  };
}

export function applyEnabledState(
  handle: MenuHandle,
  ctx: ContextDetails,
): void {
  for (const [id, btn] of handle.buttons) {
    const enabled = isItemEnabled(id, ctx);
    btn.classList.toggle(MENU_ITEM_DISABLED_CLASS, !enabled);
    btn.setAttribute("aria-disabled", enabled ? "false" : "true");
    if (!enabled) {
      btn.classList.remove(MENU_ITEM_FOCUSED_CLASS);
    }
  }
}

export function positionMenu(
  handle: MenuHandle,
  x: number,
  y: number,
): void {
  const win = getWindow();
  if (!win) return;
  const root = handle.root;

  // Mount off-screen first so we can measure.
  root.style.left = "0px";
  root.style.top = "0px";
  root.style.visibility = "hidden";

  const rect = root.getBoundingClientRect();
  const vw = win.innerWidth;
  const vh = win.innerHeight;

  let left = x;
  let top = y;

  if (left + rect.width + VIEWPORT_PADDING > vw) {
    left = Math.max(VIEWPORT_PADDING, vw - rect.width - VIEWPORT_PADDING);
  }
  if (top + rect.height + VIEWPORT_PADDING > vh) {
    top = Math.max(VIEWPORT_PADDING, vh - rect.height - VIEWPORT_PADDING);
  }

  root.style.left = `${left}px`;
  root.style.top = `${top}px`;
  root.style.visibility = "visible";
}
