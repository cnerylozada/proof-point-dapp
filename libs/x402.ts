import { facilitator } from "thirdweb/x402";
import { thirdwebServerClient } from "./thirdweb-server";

export const thirdwebFacilitator = facilitator({
  client: thirdwebServerClient,
  serverWalletAddress: "0xae46cBf74de8DFaf199C958a711eB16b74c3CfCc",
});
