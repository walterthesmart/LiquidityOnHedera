/**
 * Test file for error handling improvements
 *
 * This file contains tests to verify that the error handling
 * improvements work correctly for TradingView widgets.
 */

import { logError } from "@/lib/utils";

describe("Error Handling", () => {
  // Mock console.error to avoid noise in tests
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("logError utility", () => {
    it("should handle Error objects correctly", () => {
      const error = new Error("Test error");
      const result = logError("TestContext", error);

      expect(result?.error.name).toBe("Error");
      expect(result?.error.message).toBe("Test error");
      expect(result?.context).toBe("TestContext");
    });

    it("should handle empty objects", () => {
      const error = {};
      const result = logError("TestContext", error);

      expect(result?.error.name).toBe("UnknownError");
      expect(result?.error.message).toBe("Unknown error occurred");
    });

    it("should handle null/undefined errors", () => {
      const result1 = logError("TestContext", null);
      const result2 = logError("TestContext", undefined);

      expect(result1?.error.name).toBe("UnknownError");
      expect(result2?.error.name).toBe("UnknownError");
    });

    it("should handle script error events", () => {
      const scriptError = {
        type: "error",
        target: { tagName: "SCRIPT", src: "https://example.com/script.js" },
        message: "Script error",
      };

      const result = logError("TestContext", scriptError);

      expect(result?.error.target).toBe("SCRIPT");
      expect(result?.error.type).toBe("error");
    });

    it("should handle TradingView-specific errors", () => {
      const tradingViewError = {
        type: "error",
        target: {
          tagName: "SCRIPT",
          src: "https://s3.tradingview.com/widget.js",
        },
        message: "TradingView widget failed",
      };

      const result = logError("TradingViewWidget", tradingViewError);

      expect(result?.context).toBe("TradingViewWidget");
      expect(result?.error.target).toBe("SCRIPT");
    });
  });
});

// Export for potential manual testing
export const testErrorHandling = {
  testEmptyError: () => logError("Test", {}),
  testNullError: () => logError("Test", null),
  testUndefinedError: () => logError("Test", undefined),
  testStringError: () => logError("Test", "String error"),
  testNumberError: () => logError("Test", 404),
};
