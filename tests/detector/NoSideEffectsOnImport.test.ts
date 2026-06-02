import { describe, expect, it, vi } from "vitest";

describe("Package import side effects", () => {
  describe("when the package is imported without calling start()", () => {
    it("should not touch console or document", async () => {
      // Given — spy console + document mutators
      const consoleSpies = {
        log: vi.spyOn(console, "log").mockImplementation(() => undefined),
        table: vi.spyOn(console, "table").mockImplementation(() => undefined),
        clear: vi.spyOn(console, "clear").mockImplementation(() => undefined),
      };
      const createElementSpy = vi.spyOn(document, "createElement");
      const headBefore = document.head.children.length;

      // When — fresh import; vitest module cache is per-test by default with
      // restoreMocks but we re-import via dynamic import to be explicit.
      vi.resetModules();
      await import("../../src");

      // Then
      expect(consoleSpies.log).not.toHaveBeenCalled();
      expect(consoleSpies.table).not.toHaveBeenCalled();
      expect(consoleSpies.clear).not.toHaveBeenCalled();
      expect(createElementSpy).not.toHaveBeenCalled();
      expect(document.head.children.length).toBe(headBefore);

      consoleSpies.log.mockRestore();
      consoleSpies.table.mockRestore();
      consoleSpies.clear.mockRestore();
      createElementSpy.mockRestore();
    });
  });
});
