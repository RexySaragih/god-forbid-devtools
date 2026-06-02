import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStubChecker,
  setupDetector,
} from "../helpers/setup-detector";

describe("Detector listener invocation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when state stays stable across polls", () => {
    it("should not invoke listeners", async () => {
      // Given
      const checker = createStubChecker({ isOpen: false });
      const { detector, flush } = setupDetector([checker]);
      const listener = vi.fn();
      detector.addListener(listener);

      // When
      detector.start();
      await flush(5);

      // Then
      expect(listener).not.toHaveBeenCalled();

      detector.stop();
    });
  });
});
