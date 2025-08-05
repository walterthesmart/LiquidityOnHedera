import { createHmac } from "crypto";
import "../../../../envConfig";
import database from "@/db";
import { PaymentStatus } from "@/constants/status";
import { logError } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // validate event
    let paystack_secret_key: string = "";
    if (process.env.NODE_ENV === "production") {
      paystack_secret_key = process.env.LIVE_PAYSTACK_SECRET_KEY;
    } else {
      paystack_secret_key = process.env.TEST_PAYSTACK_SECRET_KEY;
    }

    const event = await request.json();
    const hash = createHmac("sha512", paystack_secret_key)
      .update(JSON.stringify(event))
      .digest("hex");
    if (hash === request.headers.get("x-paystack-signature")) {
      if (event?.event === "charge.success") {
        if (event?.data?.reference) {
          const reference: string = event?.data?.reference;
          // Mark payment request as paid
          await database.updateStockPurchaseStatus(
            reference,
            PaymentStatus.PAID,
          );
        }
      } else {
        console.log("Not handled", event);
      }
    } else {
      // invalid
      logError("PaymentWebhook", new Error("Invalid Paystack signature"), {
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    logError("PaymentWebhook", err, {
      operation: "payment_processing",
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 },
    );
  } finally {
    return NextResponse.json({ message: "Okay" }, { status: 200 });
  }
}
