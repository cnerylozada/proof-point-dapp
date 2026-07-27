"use client";
import { BN254_FR_MODULUS } from "@aztec/bb.js";
import { sepolia } from "thirdweb/chains";
import { useActiveAccount } from "thirdweb/react";
import { Signature } from "ethers";
import { poseidon2 } from "poseidon-lite";

export const SignatureZk = () => {
  const activeAccount = useActiveAccount();

  return (
    <div>
      <div>SignatureZk</div>
      <div>
        <button
          onClick={async () => {
            if (activeAccount) {
              const signedMessage = await activeAccount.signMessage({
                message: "hello_noir",
                chainId: sepolia.id,
              });

              const parsedSignature = Signature.from(signedMessage);
              const rField = BigInt(parsedSignature.r) % BN254_FR_MODULUS;
              const sField = BigInt(parsedSignature.s) % BN254_FR_MODULUS;

              const signatureCommitment = poseidon2([rField, sField]);
              console.log(signatureCommitment);
            }
          }}
        >
          Sign message
        </button>
      </div>
    </div>
  );
};
