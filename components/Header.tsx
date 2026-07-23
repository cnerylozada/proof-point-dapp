"use client";
import { thirdwebClient } from "@/libs/thirdweb";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { arbitrumSepolia } from "thirdweb/chains";

export const Header = () => {
  const wallets = [
    inAppWallet({
      auth: {
        options: ["google"],
      },
    }),
    createWallet("io.metamask"),
  ];
  return (
    <div>
      <div>Proof Point</div>
      <div>
        <ConnectButton
          client={thirdwebClient}
          connectModal={{ size: "compact" }}
          wallets={wallets}
          chain={arbitrumSepolia}
        />
      </div>
    </div>
  );
};
