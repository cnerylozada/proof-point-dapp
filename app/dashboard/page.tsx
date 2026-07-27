import { PayPerView } from "@/components/PayPerView";
import { thirdwebClient } from "@/libs/thirdweb-client-side";
import { PAYMENT_TOKEN_ADDRESS } from "@/libs/x402";
import { getContract } from "thirdweb";
import { arbitrumSepolia } from "thirdweb/chains";
import { balanceOf } from "thirdweb/extensions/erc20";

export default async function DashboardPage() {
  const result = await balanceOf({
    contract: getContract({
      address: PAYMENT_TOKEN_ADDRESS.address,
      chain: arbitrumSepolia,
      client: thirdwebClient,
    }),
    address: "0x58Dc4256E7E5402cc1A88d9A63c640B1A3959722",
  });
  console.log("result", result);

  return (
    <div>
      <div>DashboardPage</div>
      <PayPerView />
    </div>
  );
}
