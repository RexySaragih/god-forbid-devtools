/**
 * Keyboard navigation for the menu.
 *
 * Arrow Up / Down moves a "focused" highlight across enabled items, Enter
 * activates, Escape closes. We don't actually move DOM focus to each button
 * (that would steal from the editable target); instead we toggle a CSS class
 * and read it back when Enter fires.
 */

import { MENU_ITEM_DISABLED_CLASS, MENU_ITEM_FOCUSED_CLASS } from "./styles";
import type { ContextMenuItemId } from "./types";

export interface KeyboardController {
  reset(): void;
  handle(event: KeyboardEvent): void;
}

export interface KeyboardHandlers {
  onActivate(id: ContextMenuItemId): void;
  onClose(): void;
}

export function createKeyboardController(
  buttons: Map<ContextMenuItemId, HTMLButtonElement>,
  handlers: KeyboardHandlers,
): KeyboardController {
  let focusedIndex = -1;

  function enabledEntries(): Array<[ContextMenuItemId, HTMLButtonElement]> {
    return Array.from(buttons.entries()).filter(
      ([, btn]) => !btn.classList.contains(MENU_ITEM_DISABLED_CLASS),
    );
  }

  function applyFocus(index: number): void {
    const entries = enabledEntries();
    for (const [, btn] of buttons) {
      btn.classList.remove(MENU_ITEM_FOCUSED_CLASS);
    }
    if (index < 0 || index >= entries.length) {
      focusedIndex = -1;
      return;
    }
    focusedIndex = index;
    const [, btn] = entries[index]!;
    btn.classList.add(MENU_ITEM_FOCUSED_CLASS);
  }

  return {
    reset(): void {
      focusedIndex = -1;
      for (const [, btn] of buttons) {
        btn.classList.remove(MENU_ITEM_FOCUSED_CLASS);
      }
    },
    handle(event: KeyboardEvent): void {
      const entries = enabledEntries();

      if (event.key === "Escape") {
        event.preventDefault();
        handlers.onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (entries.length === 0) return;
        const next =
          focusedIndex < 0 ? 0 : (focusedIndex + 1) % entries.length;
        applyFocus(next);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (entries.length === 0) return;
        const next =
          focusedIndex < 0
            ? entries.length - 1
            : (focusedIndex - 1 + entries.length) % entries.length;
        applyFocus(next);
        return;
      }

      if (event.key === "Enter") {
        if (focusedIndex < 0) return;
        const entry = entries[focusedIndex];
        if (!entry) return;
        event.preventDefault();
        handlers.onActivate(entry[0]);
        return;
      }
    },
  };
}
