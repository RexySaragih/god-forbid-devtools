import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Custom menu positioning", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when right-click happens away from viewport edges", () => {
    it("should mount the menu at the cursor coordinates", () => {
      // Given
      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu({ x: 120, y: 80 });

      // Then
      const root = ctx.getMenuRoot();
      expect(root).not.toBeNull();
      expect(root?.style.left).toBe("120px");
      expect(root?.style.top).toBe("80px");
    });
  });

  describe("when right-click is near the right edge", () => {
    it("should clamp the menu inside the viewport", () => {
      // Given — happy-dom doesn't run layout, so we stub getBoundingClientRect
      // with a realistic menu size.
      const MENU_W = 180;
      const MENU_H = 120;
      const rectSpy = vi
        .spyOn(HTMLElement.prototype, "getBoundingClientRect")
        .mockImplementation(() => ({
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: MENU_W,
          bottom: MENU_H,
          width: MENU_W,
          height: MENU_H,
          toJSON: () => ({}),
        }));
      const ctx = setupGuard();
      cleanup = () => {
        ctx.cleanup();
        rectSpy.mockRestore();
      };

      // When — click within MENU_W of the right edge.
      dispatchContextMenu({ x: window.innerWidth - 10, y: 50 });

      // Then
      const root = ctx.getMenuRoot();
      expect(root).not.toBeNull();
      const left = parseInt(root!.style.left, 10);
      // Menu's right edge must be inside the viewport (with 8px padding).
      expect(left + MENU_W).toBeLessThanOrEqual(window.innerWidth - 8);
    });
  });
});
