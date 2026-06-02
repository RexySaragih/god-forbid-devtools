import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";
import { MENU_ITEM_DISABLED_CLASS } from "../../src/context-menu/styles";

describe("Cut action availability", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when right-clicking on a non-editable element", () => {
    it("should render Cut as disabled", () => {
      // Given
      const div = document.createElement("div");
      div.textContent = "static content";
      document.body.appendChild(div);

      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu({ target: div });

      // Then
      const cut = ctx.getItemByLabel("Cut");
      expect(cut).not.toBeNull();
      expect(cut?.classList.contains(MENU_ITEM_DISABLED_CLASS)).toBe(true);
      expect(cut?.getAttribute("aria-disabled")).toBe("true");
    });
  });
});
