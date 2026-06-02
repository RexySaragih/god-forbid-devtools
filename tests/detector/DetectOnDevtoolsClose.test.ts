import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStubChecker,
  setupDetector,
} from "../helpers/setup-detector";

describe("Detect when DevTools closes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when DevTools transitions from open back to closed", () => {
    it("should fire exactly one isOpen=false change", async () => {
      // Given
      const checker = createStubChecker({ name: "stub", isOpen: true });
      const { detector, flush } = setupDetector([checker]);

      const listener = vi.fn();
      detector.addListener(listener);

      // When
      detector.start();
      await flush();
      checker.setOpen(false);
      await flush();
      // Extra polls while still closed shouldn't refire.
      await flush(3);

      // Then
      const closeCalls = listener.mock.calls.filter(([open]) => open === false);
      expect(closeCalls).toHaveLength(1);
      expect(detector.isOpen).toBe(false);

      detector.stop();
    });
  });
});
