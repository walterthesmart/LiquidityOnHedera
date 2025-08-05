declare namespace Paystack {
  interface PaystackOptions {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    access_code?: string;
    // metadata?: Record<string, any>;
    callback?: (response: PaystackResponse) => void;
    onClose?: () => void;
    container?: string;
  }

  interface PaystackResponse {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    message: string;
    trxref: string;
  }

  interface PaystackPopInterface {
    setup(options: PaystackOptions): {
      openIframe(): void;
    };
  }
}

declare global {}
