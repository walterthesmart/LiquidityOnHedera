import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enhanced error logging utility with better error object handling
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>,
) {
  const timestamp = new Date().toISOString();

  // Skip logging completely empty errors to reduce noise
  if (
    !error ||
    (typeof error === "object" && Object.keys(error).length === 0)
  ) {
    console.debug(`[${context}] Skipping empty error at ${timestamp}:`, {
      error,
      additionalData,
    });
    return null;
  }

  // Safely handle different types of error objects
  let processedError: {
    name: string;
    message: string;
    stack?: string;
    target?: string;
    type?: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    originalValue?: unknown;
  };

  if (error instanceof Error) {
    processedError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error && typeof error === "object") {
    // Handle empty objects, event objects, or other object types
    const errorObj = error as Record<string, unknown>;

    // Check if this is a meaningful error object
    const hasUsefulInfo =
      errorObj.message ||
      errorObj.reason ||
      errorObj.name ||
      errorObj.stack ||
      errorObj.filename ||
      (errorObj.target && typeof errorObj.target === "object");

    if (!hasUsefulInfo) {
      console.debug(`[${context}] Skipping error object with no useful info at ${timestamp}:`, {
        error: errorObj,
        additionalData,
      });
      return null;
    }

    processedError = {
      name: (errorObj.name as string) || "UnknownError",
      message:
        (errorObj.message as string) ||
        (errorObj.reason as string) ||
        "Unknown error occurred",
      type: (errorObj.type as string) || "unknown",
      target:
        (errorObj.target as { tagName?: string; src?: string })?.tagName ||
        (errorObj.target as { tagName?: string; src?: string })?.src ||
        "unknown",
      // Include any other relevant properties
      ...Object.keys(errorObj).reduce(
        (acc, key) => {
          if (typeof errorObj[key] !== "function" && key !== "target") {
            acc[key] = errorObj[key];
          }
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };
  } else {
    // Handle primitive values or null/undefined
    processedError = {
      name: "UnknownError",
      message: String(error) || "Unknown error occurred",
      originalValue: error,
    };
  }

  const errorInfo = {
    timestamp,
    context,
    error: processedError,
    additionalData,
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : "server",
    url: typeof window !== "undefined" ? window.location.href : "server",
  };

  console.error(`[${context}] Error at ${timestamp}:`, errorInfo);

  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === "production") {
    // Example: Send to error tracking service
    // sendToErrorTracking(errorInfo);
  }

  return errorInfo;
}

// Enhanced network diagnostics
export function getNetworkDiagnostics() {
  return {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    timestamp: new Date().toISOString(),
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    referrer: typeof document !== "undefined" ? document.referrer : "unknown",
  };
}

// Network request wrapper with enhanced error handling
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  delay = 1000,
): Promise<Response> {
  let lastError: Error = new Error("Unknown error");
  const diagnostics = getNetworkDiagnostics();

  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Log successful requests for debugging
      console.log(`✅ Fetch success: ${url} (attempt ${i + 1})`);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Enhanced error logging with network diagnostics
      logError("fetchWithRetry", lastError, {
        url,
        attempt: i + 1,
        maxRetries: retries,
        options: { ...options, signal: undefined }, // Don't log the signal
        diagnostics,
        errorType: lastError.name,
        errorMessage: lastError.message,
      });

      if (i < retries) {
        console.log(
          `🔄 Retrying fetch: ${url} (attempt ${i + 2}/${retries + 1}) in ${delay * Math.pow(2, i)}ms`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i)),
        );
      }
    }
  }

  // Final error with comprehensive diagnostics
  console.error(`❌ Fetch failed after ${retries + 1} attempts: ${url}`, {
    error: lastError,
    diagnostics,
  });

  throw lastError!;
}
