"use client";

import { useState } from "react";
import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import panagram from "../circuits/panagram.json";
import {
  generateOnChainProof,
  offChainValidation,
  stringToBigInt,
} from "@/libs/noir";
import { poseidon1 } from "poseidon-lite";
import { OnChainProofParams } from "./OnChainProofParams";

type OnChainProof = Awaited<ReturnType<typeof generateOnChainProof>>;

const publicInputNames = panagram.abi.parameters
  .filter((parameter) => parameter.visibility === "public")
  .map((parameter) => parameter.name);

export const Panagram = () => {
  const [onChainProof, setOnChainProof] = useState<OnChainProof | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [offChainFailed, setOffChainFailed] = useState(false);

  const generateWitness = async () => {
    const panagramCircuit = new Noir(panagram as unknown as CompiledCircuit);

    const { witness } = await panagramCircuit.execute({
      raw_guess: stringToBigInt("lucciano").toString(),
      user_wallet: BigInt(
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ).toString(),
      answer_hash: poseidon1([stringToBigInt("lucciano")]).toString(),
      round_id: BigInt(101).toString(),
    });

    return witness;
  };

  const verifyOffChain = async () => {
    try {
      const witness = await generateWitness();

      const isValid = await offChainValidation(panagram.bytecode, witness);
      return isValid ? witness : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const buildOnChainProof = async () => {
    const witness = await verifyOffChain();
    if (!witness) return null;

    return generateOnChainProof(panagram.bytecode, witness);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setOnChainProof(null);
    setOffChainFailed(false);

    try {
      const result = await buildOnChainProof();
      if (result) setOnChainProof(result);
      else setOffChainFailed(true);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>Panagram</div>
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
