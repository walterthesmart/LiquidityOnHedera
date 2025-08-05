/**
 * Nigerian Payment Service Integration
 * Handles payments through Paystack and other Nigerian payment processors
 * Supports bank transfers, cards, USSD, and mobile money
 */

// MongoDB collections removed - using Turso database now

// Payment transaction interface
interface PaymentTransactionData {
  userWallet: string;
  stockSymbol: string;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  timestamp: string;
}

// Paystack API configuration
const PAYSTACK_BASE_URL = process.env.PAYSTACK_URL || "https://api.paystack.co";
const PAYSTACK_SECRET_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.LIVE_PAYSTACK_SECRET_KEY
    : process.env.TEST_PAYSTACK_SECRET_KEY;

// Nigerian payment methods
export type NigerianPaymentMethod =
  | "card"
  | "bank_transfer"
  | "ussd"
  | "mobile_money"
  | "qr"
  | "bank";

// Payment status types
export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "abandoned";

// Paystack transaction interface
export interface PaystackTransaction {
  reference: string;
  amount: number; // in kobo (1 NGN = 100 kobo)
  currency: "NGN";
  email: string;
  callback_url?: string;
  metadata?: {
    stock_symbol: string;
    shares_amount: number;
    user_wallet: string;
    transaction_type: "buy" | "sell";
  };
  channels?: NigerianPaymentMethod[];
}

// Payment response interface
export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    transaction_date: Date;
    gateway_response?: string;
  };
  error?: string;
}

// Nigerian banks for bank transfer
export const NIGERIAN_BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "014", name: "Afribank Nigeria Plc" },
  { code: "023", name: "Citibank Nigeria Limited" },
  { code: "050", name: "Ecobank Nigeria Plc" },
  { code: "011", name: "First Bank of Nigeria Limited" },
  { code: "214", name: "First City Monument Bank Plc" },
  { code: "070", name: "Fidelity Bank Plc" },
  { code: "058", name: "Guaranty Trust Bank Plc" },
  { code: "030", name: "Heritage Banking Company Ltd" },
  { code: "082", name: "Keystone Bank Limited" },
  { code: "076", name: "Polaris Bank Limited" },
  { code: "221", name: "Stanbic IBTC Bank Plc" },
  { code: "068", name: "Standard Chartered Bank Nigeria Ltd" },
  { code: "232", name: "Sterling Bank Plc" },
  { code: "033", name: "United Bank For Africa Plc" },
  { code: "032", name: "Union Bank of Nigeria Plc" },
  { code: "035", name: "Wema Bank Plc" },
  { code: "057", name: "Zenith Bank Plc" },
];

/**
 * Initialize a payment transaction with Paystack
 */
export async function initializePayment(
  transaction: PaystackTransaction,
): Promise<PaymentResponse> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      },
    );

    const data = await response.json();

    if (data.status) {
      return {
        success: true,
        message: "Payment initialized successfully",
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
          status: "pending",
          amount: transaction.amount,
          currency: transaction.currency,
          transaction_date: new Date(),
        },
      };
    } else {
      return {
        success: false,
        message: data.message || "Payment initialization failed",
        error: data.message,
      };
    }
  } catch (error) {
    console.error("Payment initialization error:", error);
    return {
      success: false,
      message: "Network error during payment initialization",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify a payment transaction with Paystack
 */
export async function verifyPayment(
  reference: string,
): Promise<PaymentResponse> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.status && data.data) {
      const transaction = data.data;
      return {
        success: true,
        message: "Payment verification successful",
        data: {
          reference: transaction.reference,
          status: transaction.status as PaymentStatus,
          amount: transaction.amount,
          currency: transaction.currency,
          transaction_date: new Date(transaction.transaction_date),
          gateway_response: transaction.gateway_response,
        },
      };
    } else {
      return {
        success: false,
        message: data.message || "Payment verification failed",
        error: data.message,
      };
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      success: false,
      message: "Network error during payment verification",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a payment link for stock purchase
 */
export async function createStockPurchasePayment(
  userEmail: string,
  userWallet: string,
  stockSymbol: string,
  sharesAmount: number,
  totalAmountNGN: number,
  callbackUrl?: string,
): Promise<PaymentResponse> {
  const reference = `stock_${stockSymbol}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const transaction: PaystackTransaction = {
    reference,
    amount: Math.round(totalAmountNGN * 100), // Convert to kobo
    currency: "NGN",
    email: userEmail,
    callback_url: callbackUrl,
    metadata: {
      stock_symbol: stockSymbol,
      shares_amount: sharesAmount,
      user_wallet: userWallet,
      transaction_type: "buy",
    },
    channels: ["card", "bank", "ussd", "qr", "mobile_money"],
  };

  return await initializePayment(transaction);
}

/**
 * Process stock sale payment (transfer to user's bank account)
 */
export async function processStockSalePayment(
  userEmail: string,
  userBankAccount: {
    account_number: string;
    bank_code: string;
    account_name: string;
  },
  stockSymbol: string,
  sharesAmount: number,
  totalAmountNGN: number,
): Promise<PaymentResponse> {
  try {
    // Create a transfer recipient
    const recipientResponse = await fetch(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name: userBankAccount.account_name,
          account_number: userBankAccount.account_number,
          bank_code: userBankAccount.bank_code,
          currency: "NGN",
        }),
      },
    );

    const recipientData = await recipientResponse.json();

    if (!recipientData.status) {
      return {
        success: false,
        message: "Failed to create transfer recipient",
        error: recipientData.message,
      };
    }

    // Initiate transfer
    const transferResponse = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(totalAmountNGN * 100), // Convert to kobo
        recipient: recipientData.data.recipient_code,
        reason: `Stock sale: ${sharesAmount} shares of ${stockSymbol}`,
        reference: `sale_${stockSymbol}_${Date.now()}`,
      }),
    });

    const transferData = await transferResponse.json();

    if (transferData.status) {
      return {
        success: true,
        message: "Transfer initiated successfully",
        data: {
          reference: transferData.data.reference,
          status: "processing",
          amount: totalAmountNGN * 100,
          currency: "NGN",
          transaction_date: new Date(),
        },
      };
    } else {
      return {
        success: false,
        message: transferData.message || "Transfer failed",
        error: transferData.message,
      };
    }
  } catch (error) {
    console.error("Stock sale payment error:", error);
    return {
      success: false,
      message: "Network error during stock sale payment",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get list of Nigerian banks for bank transfer
 */
export async function getNigerianBanks(): Promise<
  Array<{ code: string; name: string }>
> {
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/bank`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status && data.data) {
      return data.data
        .filter((bank: { country: string }) => bank.country === "Nigeria")
        .map((bank: { code: string; name: string }) => ({
          code: bank.code,
          name: bank.name,
        }));
    } else {
      // Fallback to hardcoded list
      return NIGERIAN_BANKS;
    }
  } catch (error) {
    console.error("Error fetching banks:", error);
    return NIGERIAN_BANKS;
  }
}

/**
 * Validate Nigerian bank account
 */
export async function validateBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ valid: boolean; accountName?: string; error?: string }> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.status && data.data) {
      return {
        valid: true,
        accountName: data.data.account_name,
      };
    } else {
      return {
        valid: false,
        error: data.message || "Invalid account details",
      };
    }
  } catch (error) {
    console.error("Bank account validation error:", error);
    return {
      valid: false,
      error: "Network error during validation",
    };
  }
}

/**
 * Format Nigerian Naira amount
 */
export function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Convert Naira to kobo
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Generate payment reference
 */
export function generatePaymentReference(prefix: string = "Liquidity"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Save payment transaction to database
 */
export async function savePaymentTransaction(
  paymentData: PaymentTransactionData,
): Promise<boolean> {
  try {
    // This would typically use your database connection
    // For now, it's a placeholder that should be implemented
    console.log("Saving payment transaction:", paymentData);
    return true;
  } catch (error) {
    console.error("Error saving payment transaction:", error);
    return false;
  }
}
