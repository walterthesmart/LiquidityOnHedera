export {};

// Create a type for the roles
export type Roles = "admin" | "super-admin";

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
    };
  }
  interface Window {
    PaystackPop: Paystack.PaystackPopInterface;
  }
}
