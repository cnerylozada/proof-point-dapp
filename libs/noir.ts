import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { hexlify } from "ethers";

const createBackend = async (bytecode: string) => {
  const barretenbergAPI = await Barretenberg.new();
  return new UltraHonkBackend(bytecode, barretenbergAPI);
};

export const offChainValidation = async (
  bytecode: string,
  witness: Uint8Array<ArrayBufferLike>,
) => {
  const backend = await createBackend(bytecode);

  const bbProof = await backend.generateProof(witness);
  return backend.verifyProof(bbProof);
};

export const generateOnChainProof = async (
  bytecode: string,
  witness: Uint8Array<ArrayBufferLike>,
) => {
  const backend = await createBackend(bytecode);

  const { proof, publicInputs } = await backend.generateProof(witness, {
    verifierTarget: "evm",
  });

  return {
    // _proof (bytes)
    proof: hexlify(proof) as `0x${string}`,
    // _publicInputs (bytes32[]) — bb returns DECIMAL strings, so each needs
    // hex conversion + left-padding to a full 32 bytes.
    publicInputs: publicInputs.map(
      (input) =>
        `0x${BigInt(input).toString(16).padStart(64, "0")}` as `0x${string}`,
    ),
  };
};
