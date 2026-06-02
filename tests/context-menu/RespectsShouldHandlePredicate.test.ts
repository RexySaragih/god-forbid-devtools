import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("shouldHandle predicate", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when shouldHandle returns false", () => {
    it("should let the native menu through (no preventDefault, no menu mounted)", () => {
      // Given
      const ctx = setupGuard({ shouldHandle: () => false });
      cleanup = ctx.cleanup;

      // When
      const event = dispatchContextMenu();

      // Then
      expect(event.defaultPrevented).toBe(false);
      expect(ctx.getMenuRoot()).toBeNull();
    });
  });

  describe("when shouldHandle returns true", () => {
    it("should suppress and mount the menu as usual", () => {
      // Given
      const ctx = setupGuard({ shouldHandle: () => true });
      cleanup = ctx.cleanup;

      // When
      const event = dispatchContextMenu();

      // Then
      expect(event.defaultPrevented).toBe(true);
      expect(ctx.getMenuRoot()).not.toBeNull();
    });
  });
});
