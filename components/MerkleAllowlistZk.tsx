"use client";

import { useState } from "react";
import { poseidon1, poseidon2 } from "poseidon-lite";
import { IMT, IMTNode } from "@zk-kit/imt";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/types";
import merkle_allowlist from "../circuits/merkle_allowlist.json";
import { generateOnChainProof, offChainValidation } from "@/libs/noir";
import { OnChainProofParams } from "./OnChainProofParams";

type OnChainProof = Awaited<ReturnType<typeof generateOnChainProof>>;

// bb emits public inputs in the circuit's `pub` parameter order, so the labels
// come straight from the compiled ABI rather than being hardcoded here.
const publicInputNames = merkle_allowlist.abi.parameters
  .filter((parameter) => parameter.visibility === "public")
  .map((parameter) => parameter.name);

export const MerkleAllowlistZk = () => {
  const [onChainProof, setOnChainProof] = useState<OnChainProof | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [offChainFailed, setOffChainFailed] = useState(false);

  const allowList = [
    "0xDE645d7DC8f33DbC92dd970d408A9f9cF50eCD1B",
    "0x58Dc4256E7E5402cc1A88d9A63c640B1A3959722",
    "0xa30576d76Db7A3389d8fD21f087e1098f05cF4a4",
    "0x89F9E866B3dDb6146244b618B828EBe398D69149",
    "0xae46cBf74de8DFaf199C958a711eB16b74c3CfCc",
  ];

  const buildMerkleProof = (allowList: string[], wallet: string) => {
    // Leaf = poseidon1(wallet), one leaf per allowlisted address. Must match
    // how the circuit hashes `raw_wallet` into `leaf` in Noir's main().
    const leaves = allowList.map((addr) => poseidon1([BigInt(addr)]));

    // Fixed depth -> fixed capacity (arity^depth = 2^10 = 1024 leaves max).
    // This must match the circuit's `hash_path: [Field; 10]` array length,
    // since every Merkle proof always has exactly `depth` siblings.
    const MAX_DEPTH = 10;
    const merklet = new IMT(
      (inputs) => poseidon2(inputs), // node hash = poseidon2([left, right])
      MAX_DEPTH,
      BigInt(0), // zero leaf value; unused tree slots are treated as this
      2, // arity: binary tree, 2 children per node
    );
    // Leaves are only inserted for actual allowlist entries. Any tree slots
    // beyond that (up to the 1024 capacity) aren't stored — IMT computes
    // their contribution to sibling hashes on the fly using the
    // precomputed zero-subtree hash per level, rather than really padding
    // the array with zero leaves.
    leaves.forEach((leaf) => merklet.insert(leaf));

    const raw_wallet = BigInt(wallet);
    const leaf = poseidon1([raw_wallet]);
    const index = merklet.indexOf(leaf);
    const proof = merklet.createProof(index);

    return {
      raw_wallet,
      indexes: proof.leafIndex,
      hash_path: proof.siblings.map((_) => _[0]),
      root: merklet.root,
      topic_id: BigInt(Date.now()),
    };
  };

  const generateWitness = async (merkleProof: {
    raw_wallet: bigint;
    indexes: number;
    hash_path: IMTNode[];
    root: IMTNode;
    topic_id: bigint;
  }) => {
    const { raw_wallet, indexes, hash_path, root, topic_id } = merkleProof;
    const circuitInputs = {
      raw_wallet: raw_wallet.toString(),
      indexes: indexes.toString(),
      hash_path: hash_path.map((sibling) => sibling.toString()),
      root: root.toString(),
      topic_id: topic_id.toString(),
    };

    const merkleAllowlistCircuit = new Noir(
      merkle_allowlist as unknown as CompiledCircuit,
    );
    const { witness } = await merkleAllowlistCircuit.execute(circuitInputs);
    return witness;
  };

  const verifyMembershipOffChain = async (
    allowList: string[],
    wallet: string,
  ) => {
    try {
      const merkleProof = buildMerkleProof(allowList, wallet);
      const witness = await generateWitness(merkleProof);

      const isValid = await offChainValidation(
        merkle_allowlist.bytecode,
        witness,
      );
      return isValid ? witness : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // Off-chain verification is the first layer: only once it passes do we build
  // the EVM-targeted proof for verify(bytes, bytes32[]).
  const buildOnChainProof = async (allowList: string[], wallet: string) => {
    const witness = await verifyMembershipOffChain(allowList, wallet);
    if (!witness) return null;

    return generateOnChainProof(merkle_allowlist.bytecode, witness);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setOnChainProof(null);
    setOffChainFailed(false);

    try {
      const result = await buildOnChainProof(
        allowList,
        "0x89F9E866B3dDb6146244b618B828EBe398D69149",
      );
      if (result) setOnChainProof(result);
      else setOffChainFailed(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>MerkleAllowlistZk</div>
      <div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/20"
        >
          {isGenerating ? "Proving..." : "Generate on chain proof"}
        </button>
      </div>

      {offChainFailed && (
        <div className="text-sm text-red-600">
          Off-chain verification failed — no on-chain params generated.
        </div>
      )}

      {onChainProof && (
        <OnChainProofParams
          proof={onChainProof.proof}
          publicInputs={onChainProof.publicInputs}
          publicInputNames={publicInputNames}
        />
      )}
    </div>
  );
};
