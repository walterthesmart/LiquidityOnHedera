import { useState, useEffect } from "react";
import { toast } from "sonner";

export function usePaystack() {
  const [isReady, setIsReady] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if Paystack is already available
    if (typeof window !== "undefined" && window.PaystackPop) {
      setIsReady(true);
      return;
    }

    // Check if script is already in the document
    const existingScript = document.querySelector(
      'script[src="https://js.paystack.co/v2/inline.js"]',
    );
    if (existingScript) {
      setIsScriptLoaded(true);
      return;
    }

    // Add the script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      toast.error("Failed to load payment system");
      document.body.removeChild(script);
    };

    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      // We don't remove the script because other components might use it
    };
  }, []);

  // When script loads, check for Paystack object
  useEffect(() => {
    if (isScriptLoaded && typeof window !== "undefined") {
      // Check for Paystack every 100ms for up to 5 seconds
      const checkInterval = setInterval(() => {
        if (window.PaystackPop) {
          setIsReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.PaystackPop) {
          toast.error("Payment system failed to initialize");
        }
      }, 5000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [isScriptLoaded]);

  const initiatePayment = (options: Paystack.PaystackOptions) => {
    if (!isReady || !window.PaystackPop) {
      toast.error("Payment system not ready");
      return;
    }

    try {
      const handler = window.PaystackPop.setup(options);
      handler.openIframe();
      return true;
    } catch (error) {
      console.error("Error initiating Paystack payment:", error);
      toast.error("Failed to start payment process");
      return false;
    }
  };

  return { isReady, initiatePayment };
}
