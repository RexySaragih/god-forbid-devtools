import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";
import { MENU_ITEM_DISABLED_CLASS } from "../../src/context-menu/styles";

describe("Copy availability", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when right-clicking with no active selection", () => {
    it("should render Copy as disabled", () => {
      // Given
      const sel = window.getSelection();
      sel?.removeAllRanges();
      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu();

      // Then
      const copy = ctx.getItemByLabel("Copy");
      expect(copy?.classList.contains(MENU_ITEM_DISABLED_CLASS)).toBe(true);
    });
  });
});
