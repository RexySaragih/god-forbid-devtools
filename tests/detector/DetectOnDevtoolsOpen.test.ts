import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStubChecker,
  setupDetector,
} from "../helpers/setup-detector";

describe("Detect when DevTools opens", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when a checker reports DevTools is open", () => {
    it("should fire a single isOpen=true change and dispatch a devtoolschange event", async () => {
      // Given
      const checker = createStubChecker({ name: "stub-open", isOpen: false });
      const { detector, flush } = setupDetector([checker]);

      const listener = vi.fn();
      detector.addListener(listener);

      const windowEvents: Event[] = [];
      const windowHandler = (event: Event): void => {
        windowEvents.push(event);
      };
      window.addEventListener("devtoolschange", windowHandler);

      // When
      detector.start();
      await flush();
      checker.setOpen(true);
      await flush();

      // Then
      expect(detector.isOpen).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ isOpen: true, checkerName: "stub-open" }),
      );
      expect(windowEvents).toHaveLength(1);
      const detail = (windowEvents[0] as CustomEvent<{ isOpen: boolean }>)
        .detail;
      expect(detail.isOpen).toBe(true);

      // Cleanup
      window.removeEventListener("devtoolschange", windowHandler);
      detector.stop();
    });
  });
});
