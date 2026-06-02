import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Cut action inside a <textarea>", () => {
  let cleanup: (() => void) | null = null;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: () => false,
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when a textarea has a non-empty selection", () => {
    it("should write the selection to clipboard and remove it from the value", async () => {
      // Given
      const ta = document.createElement("textarea");
      ta.value = "the quick brown fox";
      document.body.appendChild(ta);
      ta.focus();
      ta.setSelectionRange(4, 9); // "quick"

      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu({ target: ta });
      const cut = ctx.getItemByLabel("Cut");
      cut?.click();
      // Drain microtasks until performCut → clipboard write → splice resolves.
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }

      // Then
      expect(writeText).toHaveBeenCalledWith("quick");
      expect(ta.value).toBe("the  brown fox");
    });
  });
});
