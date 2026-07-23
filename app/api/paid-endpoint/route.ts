import { after } from "next/server";
import { settlePayment, verifyPayment, type PaymentArgs } from "thirdweb/x402";
import { thirdwebFacilitator } from "@/libs/x402";
import {
  PAYMENT_NETWORK,
  PAYMENT_RECIPIENT,
  PAYMENT_TOKEN_ADDRESS,
} from "@/libs/x402-config";

export async function GET(request: Request) {
  const paymentData =
    request.headers.get("payment-signature") ?? request.headers.get("x-payment");

  const paymentArgs: PaymentArgs = {
    resourceUrl: request.url,
    method: "GET",
    paymentData,
    scheme: "exact",
    price: {
      amount: "20000",
      asset: {
        address: PAYMENT_TOKEN_ADDRESS.address as `0x${string}`,
      },
    },
    network: PAYMENT_NETWORK,
    facilitator: thirdwebFacilitator,
    payTo: PAYMENT_RECIPIENT,
  };

  // Verify the signature/balance/allowance first (fast, no on-chain submission).
  const result = await verifyPayment(paymentArgs);

  if (result.status !== 200) {
    return Response.json(result.responseBody, {
      status: result.status,
      headers: result.responseHeaders,
    });
  }

  // Settle (the actual on-chain transfer) after the response is sent, so a
  // slow/stuck settlement never blocks or fails the API response itself.
  after(async () => {
    const settleResult = await settlePayment(paymentArgs);
    if (settleResult.status !== 200) {
      console.error("[x402] payment not settled:", settleResult);
    }
  });

  return Response.json({
    message: "This is the paid content!",
    timestamp: new Date().toISOString(),
  });
}
