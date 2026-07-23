import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";

export const offChainValidation = async (
  bytecode: string,
  witness: Uint8Array<ArrayBufferLike>,
) => {
  const barretenbergAPI = await Barretenberg.new();
  const backend = new UltraHonkBackend(bytecode, barretenbergAPI);

  const bbProof = await backend.generateProof(witness);
  return backend.verifyProof(bbProof);
};
