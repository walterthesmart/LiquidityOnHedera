import { PaystackProps } from '@paystack/inline-js';

export interface PaymentConfig {
  email: string;
  amount: number;
  currency: 'NGN';
  reference: string;
  publicKey: string;
}

export class PaystackService {
  private publicKey: string;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  async initializePayment(config: Omit<PaymentConfig, 'publicKey'>): Promise<void> {
    const paymentConfig: PaystackProps = {
      ...config,
      key: this.publicKey,
      onSuccess: (transaction) => {
        console.log('Payment successful:', transaction);
      },
      onCancel: () => {
        console.log('Payment cancelled');
      },
    };

    // Initialize Paystack payment
    const PaystackPop = (window as any).PaystackPop;
    if (PaystackPop) {
      PaystackPop.setup(paymentConfig).openIframe();
    }
  }

  generateReference(): string {
    return `liq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatAmount(amount: number): number {
    // Paystack expects amount in kobo (smallest currency unit)
    return Math.round(amount * 100);
  }
}

export const paystackService = new PaystackService(
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || ''
);
