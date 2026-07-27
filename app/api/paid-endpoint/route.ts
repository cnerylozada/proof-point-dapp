import { settlePayment, SettlePaymentArgs } from "thirdweb/x402";
import {
  PAYMENT_NETWORK,
  PAYMENT_RECIPIENT,
  PAYMENT_TOKEN_ADDRESS,
} from "@/libs/x402";
import { thirdwebFacilitator } from "@/libs/thirdweb-server-side";

export async function GET(request: Request) {
  const paymentData =
    request.headers.get("payment-signature") ??
    request.headers.get("x-payment");

  const paymentArgs: SettlePaymentArgs = {
    resourceUrl: request.url,
    method: "GET",
    paymentData,
    scheme: "exact",
    price: {
      amount: "50000",
      asset: {
        address: PAYMENT_TOKEN_ADDRESS.address as `0x${string}`,
      },
    },
    network: PAYMENT_NETWORK,
    facilitator: thirdwebFacilitator,
    payTo: PAYMENT_RECIPIENT,
  };

  const result = await settlePayment(paymentArgs);

  if (result.status !== 200) {
    return Response.json(result.responseBody, {
      status: result.status,
      headers: result.responseHeaders,
    });
  }
  console.log("server: result", result);

  return Response.json({
    message: "This is the paid content!",
    timestamp: new Date().toISOString(),
  });
}
