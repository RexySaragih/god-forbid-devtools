import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dispatchContextMenu,
  setupGuard,
} from "../helpers/setup-guard";

describe("Copy action with document selection", () => {
  let cleanup: (() => void) | null = null;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    // Force execCommand fallback so we exercise the clipboard path.
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: () => false,
    });
  });

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  describe("when text is selected on the page and Copy is clicked", () => {
    it("should write the selected text to the clipboard", async () => {
      // Given
      const para = document.createElement("p");
      para.textContent = "hello world";
      document.body.appendChild(para);

      const range = document.createRange();
      range.setStart(para.firstChild!, 0);
      range.setEnd(para.firstChild!, 5); // "hello"
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);

      const ctx = setupGuard();
      cleanup = ctx.cleanup;

      // When
      dispatchContextMenu({ target: para });
      const copy = ctx.getItemByLabel("Copy");
      copy?.click();
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }

      // Then
      expect(writeText).toHaveBeenCalledWith("hello");
    });
  });
});
