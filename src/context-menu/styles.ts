/**
 * CSS for the replacement context menu, plus a nonce-aware injection helper.
 *
 * The menu is scoped under `.gfd-ctx-menu` so it can't collide with host-app
 * styles (Mantine, Tailwind, etc). Supports multiple themes via a data
 * attribute on the menu root.
 *
 * Available themes:
 * - "system"  — Translucent, adapts to OS light/dark preference (default)
 * - "light"   — Clean opaque white, subtle borders, works on any background
 * - "dark"    — Solid dark surface, high contrast text
 * - "coffee"  — Warm cream/brown palette, cozy and grounded
 */

import { appendToHead, createElement, removeNode } from "../env/dom";

export const MENU_CLASS = "gfd-ctx-menu";
export const MENU_ITEM_CLASS = "gfd-ctx-menu__item";
export const MENU_ITEM_DISABLED_CLASS = "gfd-ctx-menu__item--disabled";
export const MENU_ITEM_FOCUSED_CLASS = "gfd-ctx-menu__item--focused";
export const MENU_SEPARATOR_CLASS = "gfd-ctx-menu__separator";
export const MENU_ITEM_ICON_CLASS = "gfd-ctx-menu__icon";
export const MENU_ITEM_SHORTCUT_CLASS = "gfd-ctx-menu__shortcut";

const STYLE_ID = "gfd-ctx-menu-styles";

const CSS = `
/* ─── Base layout (shared across all themes) ─── */

.${MENU_CLASS} {
  position: fixed;
  min-width: 180px;
  padding: 5px;
  margin: 0;
  list-style: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif;
  font-size: 13px;
  font-weight: 400;
  letter-spacing: -0.008em;
  line-height: 1;
  user-select: none;
  outline: none;
  transform-origin: top left;
  animation: gfd-ctx-appear 0.14s cubic-bezier(0.2, 0.9, 0.3, 1.0) both;
  will-change: transform, opacity;

  /* Theme variables (defaults = light) */
  --gfd-ctx-bg: #ffffff;
  --gfd-ctx-fg: #1c1c1e;
  --gfd-ctx-fg-secondary: #6e6e73;
  --gfd-ctx-border: rgba(0, 0, 0, 0.08);
  --gfd-ctx-inner-border: transparent;
  --gfd-ctx-radius: 10px;
  --gfd-ctx-item-radius: 6px;
  --gfd-ctx-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 16px 36px rgba(0, 0, 0, 0.04);
  --gfd-ctx-hover-bg: rgba(0, 0, 0, 0.04);
  --gfd-ctx-active-bg: rgba(0, 0, 0, 0.07);
  --gfd-ctx-disabled-fg: rgba(28, 28, 30, 0.3);
  --gfd-ctx-separator: rgba(0, 0, 0, 0.06);
  --gfd-ctx-backdrop: none;

  background: var(--gfd-ctx-bg);
  color: var(--gfd-ctx-fg);
  border: 1px solid var(--gfd-ctx-border);
  border-radius: var(--gfd-ctx-radius);
  box-shadow: var(--gfd-ctx-shadow);
  backdrop-filter: var(--gfd-ctx-backdrop);
  -webkit-backdrop-filter: var(--gfd-ctx-backdrop);
}

@keyframes gfd-ctx-appear {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(-2px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.${MENU_ITEM_CLASS} {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--gfd-ctx-item-radius);
  cursor: default;
  white-space: nowrap;
  background: transparent;
  border: 0;
  color: inherit;
  width: 100%;
  text-align: left;
  font: inherit;
  transition:
    background 0.1s ease,
    transform 0.1s cubic-bezier(0.2, 0.9, 0.3, 1.0);
  position: relative;
}

.${MENU_ITEM_CLASS}:hover:not(.${MENU_ITEM_DISABLED_CLASS}),
.${MENU_ITEM_FOCUSED_CLASS}:not(.${MENU_ITEM_DISABLED_CLASS}) {
  background: var(--gfd-ctx-hover-bg);
}

.${MENU_ITEM_CLASS}:active:not(.${MENU_ITEM_DISABLED_CLASS}) {
  background: var(--gfd-ctx-active-bg);
  transform: scale(0.98);
  transition-duration: 0.06s;
}

.${MENU_ITEM_DISABLED_CLASS} {
  color: var(--gfd-ctx-disabled-fg);
  cursor: not-allowed;
}

.${MENU_ITEM_ICON_CLASS} {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.65;
}

.${MENU_ITEM_DISABLED_CLASS} .${MENU_ITEM_ICON_CLASS} {
  opacity: 0.28;
}

.${MENU_ITEM_SHORTCUT_CLASS} {
  margin-left: auto;
  padding-left: 20px;
  font-size: 11px;
  color: var(--gfd-ctx-fg-secondary);
  opacity: 0.55;
  font-variant-numeric: tabular-nums;
}

.${MENU_ITEM_DISABLED_CLASS} .${MENU_ITEM_SHORTCUT_CLASS} {
  opacity: 0.28;
}

.${MENU_SEPARATOR_CLASS} {
  height: 1px;
  margin: 4px 8px;
  background: var(--gfd-ctx-separator);
  border: 0;
  padding: 0;
  list-style: none;
}

/* ─── Theme: light (explicit) ─── */

.${MENU_CLASS}[data-gfd-theme="light"] {
  --gfd-ctx-bg: #ffffff;
  --gfd-ctx-fg: #1c1c1e;
  --gfd-ctx-fg-secondary: #6e6e73;
  --gfd-ctx-border: rgba(0, 0, 0, 0.1);
  --gfd-ctx-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 16px 36px rgba(0, 0, 0, 0.04);
  --gfd-ctx-hover-bg: rgba(0, 0, 0, 0.04);
  --gfd-ctx-active-bg: rgba(0, 0, 0, 0.07);
  --gfd-ctx-disabled-fg: rgba(28, 28, 30, 0.3);
  --gfd-ctx-separator: rgba(0, 0, 0, 0.06);
  --gfd-ctx-backdrop: none;
}

/* ─── Theme: dark ─── */

.${MENU_CLASS}[data-gfd-theme="dark"] {
  --gfd-ctx-bg: #1c1c1e;
  --gfd-ctx-fg: #f5f5f7;
  --gfd-ctx-fg-secondary: #98989d;
  --gfd-ctx-border: rgba(255, 255, 255, 0.08);
  --gfd-ctx-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2),
    0 8px 24px rgba(0, 0, 0, 0.32),
    0 20px 40px rgba(0, 0, 0, 0.16);
  --gfd-ctx-hover-bg: rgba(255, 255, 255, 0.07);
  --gfd-ctx-active-bg: rgba(255, 255, 255, 0.12);
  --gfd-ctx-disabled-fg: rgba(245, 245, 247, 0.25);
  --gfd-ctx-separator: rgba(255, 255, 255, 0.07);
  --gfd-ctx-backdrop: none;
}

/* ─── Theme: coffee ─── */

.${MENU_CLASS}[data-gfd-theme="coffee"] {
  --gfd-ctx-bg: #faf6f1;
  --gfd-ctx-fg: #3b2f2f;
  --gfd-ctx-fg-secondary: #7a6a5e;
  --gfd-ctx-border: rgba(139, 109, 80, 0.12);
  --gfd-ctx-radius: 10px;
  --gfd-ctx-item-radius: 6px;
  --gfd-ctx-shadow:
    0 1px 3px rgba(80, 50, 20, 0.05),
    0 6px 16px rgba(80, 50, 20, 0.07),
    0 16px 36px rgba(80, 50, 20, 0.04);
  --gfd-ctx-hover-bg: rgba(139, 109, 80, 0.07);
  --gfd-ctx-active-bg: rgba(139, 109, 80, 0.12);
  --gfd-ctx-disabled-fg: rgba(59, 47, 47, 0.3);
  --gfd-ctx-separator: rgba(139, 109, 80, 0.1);
  --gfd-ctx-backdrop: none;
}

/* ─── Theme: system (adapts to prefers-color-scheme) ─── */

.${MENU_CLASS}[data-gfd-theme="system"] {
  --gfd-ctx-bg: rgba(255, 255, 255, 0.88);
  --gfd-ctx-fg: #1c1c1e;
  --gfd-ctx-fg-secondary: #6e6e73;
  --gfd-ctx-border: rgba(0, 0, 0, 0.08);
  --gfd-ctx-shadow:
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 16px 36px rgba(0, 0, 0, 0.04);
  --gfd-ctx-hover-bg: rgba(0, 0, 0, 0.04);
  --gfd-ctx-active-bg: rgba(0, 0, 0, 0.07);
  --gfd-ctx-disabled-fg: rgba(28, 28, 30, 0.3);
  --gfd-ctx-separator: rgba(0, 0, 0, 0.06);
  --gfd-ctx-backdrop: blur(16px) saturate(1.3);
}

@media (prefers-color-scheme: dark) {
  .${MENU_CLASS}[data-gfd-theme="system"] {
    --gfd-ctx-bg: rgba(30, 30, 32, 0.88);
    --gfd-ctx-fg: #f5f5f7;
    --gfd-ctx-fg-secondary: #98989d;
    --gfd-ctx-border: rgba(255, 255, 255, 0.08);
    --gfd-ctx-shadow:
      0 1px 3px rgba(0, 0, 0, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.32),
      0 20px 40px rgba(0, 0, 0, 0.16);
    --gfd-ctx-hover-bg: rgba(255, 255, 255, 0.07);
    --gfd-ctx-active-bg: rgba(255, 255, 255, 0.12);
    --gfd-ctx-disabled-fg: rgba(245, 245, 247, 0.25);
    --gfd-ctx-separator: rgba(255, 255, 255, 0.07);
  }

  .${MENU_CLASS}[data-gfd-theme="coffee"] {
    --gfd-ctx-bg: #2c2320;
    --gfd-ctx-fg: #f5ede6;
    --gfd-ctx-fg-secondary: #b8a898;
    --gfd-ctx-border: rgba(200, 170, 140, 0.1);
    --gfd-ctx-shadow:
      0 1px 3px rgba(0, 0, 0, 0.2),
      0 8px 24px rgba(0, 0, 0, 0.28),
      0 20px 40px rgba(0, 0, 0, 0.14);
    --gfd-ctx-hover-bg: rgba(200, 170, 140, 0.08);
    --gfd-ctx-active-bg: rgba(200, 170, 140, 0.14);
    --gfd-ctx-disabled-fg: rgba(245, 237, 230, 0.25);
    --gfd-ctx-separator: rgba(200, 170, 140, 0.1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .${MENU_CLASS} {
    animation: none;
  }
  .${MENU_ITEM_CLASS} {
    transition: none;
  }
}

/*
 * Keep the host page's text selection visible while our menu is open.
 *
 * When a DOM-based context menu mounts, the browser renders the page's
 * selection as "inactive" and dims the highlight. While our guard sets
 * the .gfd-menu-open class on <body>, we keep the highlight visible.
 */
body.gfd-menu-open ::selection {
  background-color: rgba(0, 122, 255, 0.28);
}
body.gfd-menu-open ::-moz-selection {
  background-color: rgba(0, 122, 255, 0.28);
}
`;

let injectedStyleNode: HTMLStyleElement | null = null;

export function injectStyles(nonce?: string): void {
  if (injectedStyleNode) return;
  const style = createElement("style");
  if (!style) return;
  style.id = STYLE_ID;
  if (nonce) style.setAttribute("nonce", nonce);
  style.textContent = CSS;
  appendToHead(style);
  injectedStyleNode = style;
}

export function removeStyles(): void {
  removeNode(injectedStyleNode);
  injectedStyleNode = null;
}
