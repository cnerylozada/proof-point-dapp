import { createThirdwebClient } from "thirdweb";
import { facilitator } from "thirdweb/x402";

const thirdwebServerClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

export const thirdwebFacilitator = facilitator({
  client: thirdwebServerClient,
  serverWalletAddress: process.env.THIRDWEB_SERVER_WALLET!,
  waitUntil: "confirmed",
});
