import {
  createContextMenuGuard,
  type ContextMenuGuard,
  type ContextMenuGuardOptions,
} from "../../src/context-menu";
import { MENU_CLASS, MENU_ITEM_CLASS } from "../../src/context-menu/styles";

export interface SetupGuardResult {
  guard: ContextMenuGuard;
  getMenuRoot(): HTMLElement | null;
  getMenuItems(): HTMLButtonElement[];
  getItemByLabel(label: string): HTMLButtonElement | null;
  cleanup(): void;
}

export function setupGuard(
  options: ContextMenuGuardOptions = {},
): SetupGuardResult {
  const guard = createContextMenuGuard(options);
  guard.start();

  function getMenuRoot(): HTMLElement | null {
    return document.querySelector(`.${MENU_CLASS}`);
  }

  function getMenuItems(): HTMLButtonElement[] {
    const root = getMenuRoot();
    if (!root) return [];
    return Array.from(root.querySelectorAll(`.${MENU_ITEM_CLASS}`));
  }

  function getItemByLabel(label: string): HTMLButtonElement | null {
    return getMenuItems().find((btn) => btn.dataset.gfdLabel === label) ?? null;
  }

  function cleanup(): void {
    guard.stop();
    document.body.innerHTML = "";
  }

  return { guard, getMenuRoot, getMenuItems, getItemByLabel, cleanup };
}

export interface DispatchContextMenuOptions {
  x?: number;
  y?: number;
  target?: EventTarget;
}

export function dispatchContextMenu(
  options: DispatchContextMenuOptions = {},
): MouseEvent {
  const target = options.target ?? document.body;
  const event = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    clientX: options.x ?? 50,
    clientY: options.y ?? 50,
  });
  target.dispatchEvent(event);
  return event;
}
