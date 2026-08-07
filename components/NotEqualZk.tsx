"use client";

import { useState } from "react";
import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import not_equal from "../circuits/not_equal.json";
import { generateOnChainProof, offChainValidation } from "@/libs/noir";

type OnChainProof = Awaited<ReturnType<typeof generateOnChainProof>>;

export const NotEqualZk = () => {
  const [onChainProof, setOnChainProof] = useState<OnChainProof | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [offChainFailed, setOffChainFailed] = useState(false);

  const generateWitness = async () => {
    const x = BigInt(7);
    const y = BigInt(21);

    const notEqualCircuit = new Noir(not_equal as unknown as CompiledCircuit);
    const { witness } = await notEqualCircuit.execute({
      x: x.toString(),
      y: y.toString(),
    });
    return witness;
  };

  const verifyOffChain = async () => {
    try {
      const witness = await generateWitness();
      console.log("witness", witness);

      return offChainValidation(not_equal.bytecode, witness);
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const buildOnChainProof = async () => {
    const isValidOffChain = await verifyOffChain();
    if (!isValidOffChain) return null;

    const witness = await generateWitness();
    return generateOnChainProof(not_equal.bytecode, witness);
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
      <div>NotEqualZk</div>
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
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="font-medium">_proof (bytes)</span>
              <span className="text-zinc-500">
                {(onChainProof.proof.length - 2) / 2} bytes
              </span>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(onChainProof.proof)
                }
                className="rounded border border-black/20 px-2 py-0.5 text-xs dark:border-white/20"
              >
                Copy
              </button>
            </div>
            <pre className="max-h-40 overflow-auto rounded bg-zinc-100 p-2 font-mono text-xs break-all whitespace-pre-wrap dark:bg-zinc-900">
              {onChainProof.proof}
            </pre>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className="font-medium">_publicInputs (bytes32[])</span>
              <span className="text-zinc-500">
                {onChainProof.publicInputs.length} items
              </span>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    JSON.stringify(onChainProof.publicInputs),
                  )
                }
                className="rounded border border-black/20 px-2 py-0.5 text-xs dark:border-white/20"
              >
                Copy
              </button>
            </div>
            <ol className="max-h-40 overflow-auto rounded bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-900">
              {onChainProof.publicInputs.map((publicInput, index) => (
                <li key={index} className="break-all">
                  <span className="text-zinc-500">{index}: </span>
                  {publicInput}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
