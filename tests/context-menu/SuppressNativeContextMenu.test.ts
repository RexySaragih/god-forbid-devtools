import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Suppress native context menu", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when the user right-clicks anywhere on the page", () => {
    it("should call preventDefault on the contextmenu event", () => {
      // Given
      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      const event = dispatchContextMenu({ x: 10, y: 10 });

      // Then
      expect(event.defaultPrevented).toBe(true);
    });
  });
});
