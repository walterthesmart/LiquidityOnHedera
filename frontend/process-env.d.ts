declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Database
            CONN_STRING: string;

            // Clerk Authentication
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
            CLERK_SECRET_KEY: string;

            // RainbowKit Configuration
            NEXT_PUBLIC_PROJECT_ID: string;

            // M-Pesa (Legacy - keeping for reference)
            AUTHORIZATION: string;
            BUSINESS_SHORT_CODE: string;
            PASS_KEY: string;
            URL: string;

            // Paystack (Nigerian Payment Processor)
            PAYSTACK_URL: string;
            LIVE_PAYSTACK_SECRET_KEY: string;
            TEST_PAYSTACK_SECRET_KEY: string;

            // WhatsApp Notifications
            WHATSAPP_TOKEN: string;
            WHATSAPP_PHONE_ID: string;
            NOTIFIER_NUMBER: string;

            // Legacy Account/Private Key (removed with Avalanche support)

            // Currency Conversion
            CONVERSION_KEY: string;

            // Hedera Hashgraph Configuration
            NEXT_PUBLIC_HEDERA_NETWORK: 'testnet' | 'mainnet';
            NEXT_PUBLIC_HEDERA_OPERATOR_ID: string;
            HEDERA_OPERATOR_KEY: string;
            NEXT_PUBLIC_HEDERA_CONTRACT_ID: string;
            HEDERA_PRIVATE_KEY: string;

            // Hedera Mirror Node URLs
            NEXT_PUBLIC_HEDERA_TESTNET_MIRROR_URL: string;
            NEXT_PUBLIC_HEDERA_MAINNET_MIRROR_URL: string;

            // Hedera JSON-RPC URLs
            NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL: string;
            NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL: string;

            // Nigerian Stock Exchange API
            NGX_API_KEY?: string;
            NGX_API_URL?: string;

            // Exchange Rate API for NGN/HBAR conversion
            EXCHANGE_RATE_API_KEY?: string;
        }
    }
}

export { };
