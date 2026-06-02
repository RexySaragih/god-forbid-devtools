import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Refresh action", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when the user clicks Refresh in the menu", () => {
    it("should call location.reload", () => {
      // Given
      const reload = vi
        .spyOn(window.location, "reload")
        .mockImplementation(() => undefined);
      const ctx = setupGuard();
      cleanup = () => {
        ctx.cleanup();
        reload.mockRestore();
      };

      // When
      dispatchContextMenu();
      const refresh = ctx.getItemByLabel("Refresh");
      refresh?.click();

      // Then
      expect(reload).toHaveBeenCalledTimes(1);
    });
  });
});
