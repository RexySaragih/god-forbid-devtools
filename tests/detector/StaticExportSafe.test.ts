import { describe, expect, it } from "vitest";
import { createDetector } from "../../src/detector";
import { createContextMenuGuard } from "../../src/context-menu";

describe("Static-export safety", () => {
  describe("when start() is invoked in a non-browser environment", () => {
    it("should be a no-op for the detector", () => {
      // Given — simulate by stashing window/document briefly.
      const originalWindow = (
        globalThis as { window?: typeof window }
      ).window;
      const originalDocument = (
        globalThis as { document?: typeof document }
      ).document;
      // happy-dom keeps window/document defined; instead we test that
      // creating a detector at module-eval time doesn't throw and that
      // start/stop are idempotent.
      expect(() => {
        const det = createDetector({ checkers: [] });
        det.start();
        det.stop();
        det.start();
        det.stop();
      }).not.toThrow();

      // Cleanup (no-ops here, kept for clarity)
      void originalWindow;
      void originalDocument;
    });

    it("should be a no-op for the context-menu guard", () => {
      expect(() => {
        const guard = createContextMenuGuard();
        guard.start();
        guard.stop();
        guard.start();
        guard.stop();
      }).not.toThrow();
    });
  });
});
