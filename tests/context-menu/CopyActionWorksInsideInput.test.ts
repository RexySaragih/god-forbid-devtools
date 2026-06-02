import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Copy action inside an <input>", () => {
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

  describe("when an input has a partial selection", () => {
    it("should write only the selected substring to the clipboard", async () => {
      // Given
      const input = document.createElement("input");
      input.type = "text";
      input.value = "abcdef";
      document.body.appendChild(input);
      input.focus();
      input.setSelectionRange(2, 5); // "cde"

      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu({ target: input });
      const copy = ctx.getItemByLabel("Copy");
      copy?.click();
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }

      // Then
      expect(writeText).toHaveBeenCalledWith("cde");
      // Input value untouched
      expect(input.value).toBe("abcdef");
    });
  });
});
