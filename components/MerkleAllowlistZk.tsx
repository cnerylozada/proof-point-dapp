"use client";

import { poseidon1, poseidon2 } from "poseidon-lite";
import { IMT, IMTNode } from "@zk-kit/imt";
import { Noir } from "@noir-lang/noir_js";
import type { CompiledCircuit } from "@noir-lang/types";
import merkle_allowlist from "../circuits/merkle_allowlist.json";
import { offChainValidation } from "@/libs/noir";

export const MerkleAllowlistZk = () => {
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
    };
  };

  const generateWitness = async (merkleProof: {
    raw_wallet: bigint;
    indexes: number;
    hash_path: any[];
    root: IMTNode;
  }) => {
    const { raw_wallet, indexes, hash_path, root } = merkleProof;
    const circuitInputs = {
      raw_wallet: raw_wallet.toString(),
      indexes: indexes.toString(),
      hash_path: hash_path.map((sibling) => sibling.toString()),
      root: root.toString(),
    };

    const merkleAllowlistCircuit = new Noir(
      merkle_allowlist as unknown as CompiledCircuit,
    );
    const { witness } = await merkleAllowlistCircuit.execute(circuitInputs);
    return witness;
  };

  const onOffChainValidation = async (allowList: string[], wallet: string) => {
    try {
      const merkleProof = buildMerkleProof(allowList, wallet);
      const witness = await generateWitness(merkleProof);
      console.log("witness", witness);

      return offChainValidation(merkle_allowlist.bytecode, witness);
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  return (
    <div>
      <div>MerkleAllowlistZk</div>
      <div>
        <button
          onClick={async () => {
            const isValid = await onOffChainValidation(
              allowList,
              "0x89F9E866B3dDb6146244b618B828EBe398D69149",
            );
            console.log("isValid", isValid);
          }}
        >
          Verify off chain
        </button>
      </div>
    </div>
  );
};
