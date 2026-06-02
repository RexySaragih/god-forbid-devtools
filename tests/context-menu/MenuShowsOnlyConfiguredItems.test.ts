import { afterEach, describe, expect, it } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Menu item configuration", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when items option is omitted", () => {
    it("should render Refresh, Copy, Cut in that order", () => {
      // Given
      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu();

      // Then
      const labels = ctx.getMenuItems().map((b) => b.dataset.gfdLabel);
      expect(labels).toEqual(["Refresh", "Copy", "Cut"]);
    });
  });

  describe('when items is ["refresh"]', () => {
    it("should render only Refresh", () => {
      // Given
      const ctx = setupGuard({ items: ["refresh"] });
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu();

      // Then
      const labels = ctx.getMenuItems().map((b) => b.dataset.gfdLabel);
      expect(labels).toEqual(["Refresh"]);
    });
  });

  describe("when labels override the default text", () => {
    it("should render the overridden labels", () => {
      // Given
      const ctx = setupGuard({
        labels: { refresh: "Reload", copy: "Salin", cut: "Potong" },
      });
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu();

      // Then
      const labels = ctx.getMenuItems().map((b) => b.dataset.gfdLabel);
      expect(labels).toEqual(["Reload", "Salin", "Potong"]);
    });
  });
});
