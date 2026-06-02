import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Menu teardown", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when the user clicks outside the menu", () => {
    it("should remove the menu from the DOM", () => {
      // Given
      const ctx = setupGuard();
      cleanup = ctx.cleanup;
      dispatchContextMenu();
      expect(ctx.getMenuRoot()).not.toBeNull();

      // When
      document.body.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: 500,
          clientY: 500,
        }),
      );

      // Then
      expect(ctx.getMenuRoot()).toBeNull();
    });
  });

  describe("when the user presses Escape", () => {
    it("should remove the menu from the DOM", () => {
      // Given
      const ctx = setupGuard();
      cleanup = ctx.cleanup;
      dispatchContextMenu();
      expect(ctx.getMenuRoot()).not.toBeNull();

      // When
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

      // Then
      expect(ctx.getMenuRoot()).toBeNull();
    });
  });
});
