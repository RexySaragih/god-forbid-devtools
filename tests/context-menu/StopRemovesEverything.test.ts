import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("stop() teardown", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("after stop() is called", () => {
    it("should not mount a menu on subsequent contextmenu and should remove the injected style tag", () => {
      // Given
      const ctx = setupGuard();
      cleanup = ctx.cleanup;
      dispatchContextMenu();
      expect(ctx.getMenuRoot()).not.toBeNull();
      const styleBefore = document.getElementById("gfd-ctx-menu-styles");
      expect(styleBefore).not.toBeNull();

      // When
      ctx.guard.stop();
      dispatchContextMenu();

      // Then
      expect(ctx.getMenuRoot()).toBeNull();
      const styleAfter = document.getElementById("gfd-ctx-menu-styles");
      expect(styleAfter).toBeNull();
    });
  });
});
