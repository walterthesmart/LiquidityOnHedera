"use server";
import { Errors, MyError } from "@/constants/errors";
import "../../../envConfig";
import axios from "axios";

export async function makePaymentRequest(
  customer_email: string,
  amount: number,
): Promise<{ access_code: string; reference: string }> {
  try {
    let paystack_secret_key: string = "";
    if (process.env.NODE_ENV === "production") {
      paystack_secret_key = process.env.LIVE_PAYSTACK_SECRET_KEY;
    } else {
      paystack_secret_key = process.env.TEST_PAYSTACK_SECRET_KEY;
    }

    const response = await axios.post(
      process.env.PAYSTACK_URL,
      {
        email: customer_email,
        amount: amount,
      },
      {
        headers: {
          Authorization: `Bearer ${paystack_secret_key}`,
        },
      },
    );

    if (!response.data.data.reference) {
      console.log("Did not get reference from paystack", response);
      throw new MyError(Errors.NOT_GET_REFERENCE_CODE_PAYSTACK);
    } else {
      if (!response.data.data.access_code) {
        console.log("Did not get access code from paystack", response);
        throw new MyError(Errors.NOT_MAKE_PAYMENT_REQUEST);
      } else {
        return {
          access_code: response.data.data.access_code as string,
          reference: response.data.data.reference as string,
        };
      }
    }
  } catch (err) {
    if (err instanceof MyError) {
      if (err.message === Errors.NOT_MAKE_PAYMENT_REQUEST) {
        throw err;
      }
    }

    console.log("Unkown error", err);
    throw new MyError(Errors.UNKNOWN);
  }
}
