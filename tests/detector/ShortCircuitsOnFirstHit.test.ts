import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStubChecker,
  setupDetector,
} from "../helpers/setup-detector";

describe("Detector iteration order", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when the first checker returns true", () => {
    it("should not invoke later checkers in that poll", async () => {
      // Given
      const first = createStubChecker({ name: "first", isOpen: true });
      const second = createStubChecker({ name: "second", isOpen: false });
      const { detector, flush } = setupDetector([first, second]);

      // When
      detector.start();
      await flush();

      // Then
      expect(first.callCount()).toBe(1);
      expect(second.callCount()).toBe(0);

      detector.stop();
    });
  });
});
