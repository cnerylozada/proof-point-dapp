import { arbitrumSepolia } from "thirdweb/chains";
import { getDefaultToken } from "thirdweb/react";

export const PAYMENT_RECIPIENT =
  "0xDE645d7DC8f33DbC92dd970d408A9f9cF50eCD1B" as const;

export const PAYMENT_NETWORK = arbitrumSepolia;

export const PAYMENT_TOKEN_ADDRESS = getDefaultToken(PAYMENT_NETWORK, "USDC")!;
