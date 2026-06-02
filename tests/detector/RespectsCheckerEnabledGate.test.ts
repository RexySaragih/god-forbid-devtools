import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStubChecker,
  setupDetector,
} from "../helpers/setup-detector";

describe("Detector checker gating", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when a checker reports it is not enabled", () => {
    it("should skip its isOpen probe", async () => {
      // Given
      const disabled = createStubChecker({
        name: "disabled",
        enabled: false,
        isOpen: true,
      });
      const enabled = createStubChecker({
        name: "enabled",
        enabled: true,
        isOpen: false,
      });
      const { detector, flush } = setupDetector([disabled, enabled]);

      // When
      detector.start();
      await flush(2);

      // Then
      expect(disabled.callCount()).toBe(0);
      expect(enabled.callCount()).toBeGreaterThan(0);

      detector.stop();
    });
  });
});
