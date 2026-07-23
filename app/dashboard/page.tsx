import { PayPerView } from "@/components/PayPerView";
import { thirdwebClient } from "@/libs/thirdweb";
import { getContract } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { balanceOf } from "thirdweb/extensions/erc20";

export default async function DashboardPage() {
  const result = await balanceOf({
    contract: getContract({
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      chain: sepolia,
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
