import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";
import { MENU_ITEM_FOCUSED_CLASS } from "../../src/context-menu/styles";

describe("Menu keyboard navigation", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when ArrowDown is pressed", () => {
    it("should move the focused highlight forward through enabled items", () => {
      // Given
      const ctx = setupGuard({ items: ["refresh"] });
      cleanup = ctx.cleanup;
      dispatchContextMenu();

      // When
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );

      // Then
      const refresh = ctx.getItemByLabel("Refresh");
      expect(refresh?.classList.contains(MENU_ITEM_FOCUSED_CLASS)).toBe(true);
    });
  });

  describe("when Enter is pressed on a focused item", () => {
    it("should activate it", () => {
      // Given
      const reload = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => undefined);
      const ctx = setupGuard({ items: ["refresh"] });
      cleanup = () => {
        ctx.cleanup();
        reload.mockRestore();
      };
      dispatchContextMenu();

      // When
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );

      // Then
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});
