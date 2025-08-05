"use server";

import "../../../envConfig";
import { Errors, MyError } from "@/constants/errors";
import { sleep } from "@/constants/helpers";
import { SendMoneyTransfer } from "@/constants/types";
import axios from "axios";
import crypto from "crypto";

interface CreateTransferReceipt {
  customer_name: string;
  customer_phone_number: string; // Not start with 254
  customer_email: string;
}

interface CreateTransferReference extends CreateTransferReceipt {
  amount: number;
}

interface TransferReference {
  source: string;
  reason: string;
  amount: number;
  reference: string;
  recipient: string;
}

async function getRecepientCode(args: CreateTransferReceipt): Promise<string> {
  let paystack_secret_key: string = "";
  if (process.env.NODE_ENV === "production") {
    paystack_secret_key = process.env.LIVE_PAYSTACK_SECRET_KEY;
  } else {
    paystack_secret_key = process.env.TEST_PAYSTACK_SECRET_KEY;
  }

  if (!paystack_secret_key) {
    console.log("Set paystack secret in env variables");
    throw new MyError(Errors.INVALID_SETUP);
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "mobile_money",
        name: args.customer_name,
        account_number: args.customer_phone_number,
        bank_code: "MPESA",
        currency: "KES",
      },
      {
        headers: {
          Authorization: `Bearer ${paystack_secret_key}`,
        },
      },
    );

    if (!response.data.data.recipient_code) {
      console.log("Recepient code not returned", response);
      throw new MyError(Errors.NOT_GET_RECEPIENT_CODE);
    } else {
      return response.data.data.recipient_code;
    }
  } catch (err) {
    if (err instanceof MyError) {
      if (err.message === Errors.NOT_GET_RECEPIENT_CODE) {
        throw err;
      }
    }

    console.log("Unkown error", err);
    throw new MyError(Errors.UNKNOWN);
  }
}

async function generateTransferReference(
  args: CreateTransferReference,
  retry?: number,
): Promise<TransferReference> {
  try {
    if (retry) {
      if (retry! >= 5) {
        console.log("Exceeded maximum tries");
        throw new MyError(Errors.NOT_GET_TRANSFER_REFERENCE);
      }
    }

    const recepient_code = await getRecepientCode({
      customer_email: args.customer_email,
      customer_name: args.customer_name,
      customer_phone_number: args.customer_phone_number,
    });
    const uuid = crypto.randomUUID().toString();

    return {
      source: "balance",
      reason: "Sale of stocks",
      amount: args.amount,
      reference: uuid,
      recipient: recepient_code,
    };
  } catch (err) {
    if (err instanceof MyError) {
      if (err.message === Errors.NOT_GET_RECEPIENT_CODE) {
        await sleep(2 ** (retry ?? 1));
        console.log(`Retrying ${retry ? retry + 1 : 1}`);
        return await generateTransferReference(args, retry ? retry + 1 : 1);
      } else if (err.message === Errors.NOT_GET_TRANSFER_REFERENCE) {
        throw err;
      }
    }

    console.log("Erorr getting transfer reference", err);
    throw new MyError(Errors.UNKNOWN);
  }
}

export default async function sendMoneyTransfer(args: SendMoneyTransfer) {
  try {
    let paystack_secret_key: string = "";
    if (process.env.NODE_ENV === "production") {
      paystack_secret_key = process.env.LIVE_PAYSTACK_SECRET_KEY;
    } else {
      paystack_secret_key = process.env.TEST_PAYSTACK_SECRET_KEY;
    }

    if (!paystack_secret_key) {
      console.log("Set paystack secret in env variables");
      throw new MyError(Errors.INVALID_SETUP);
    }

    const transfer_reference = await generateTransferReference(args);
    await axios.post("https://api.paystack.co/transfer", transfer_reference, {
      headers: {
        Authorization: `Bearer ${paystack_secret_key}`,
      },
    });
  } catch (err) {
    if (err instanceof MyError) {
      if (err.message === Errors.NOT_GET_TRANSFER_REFERENCE) {
        throw err;
      }
    }

    console.log("Error sending transfer request", err);
    throw new MyError(Errors.UNKNOWN);
  }
}
