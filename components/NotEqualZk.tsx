"use client";

import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import not_equal from "../circuits/not_equal.json";
import { offChainValidation } from "@/libs/noir";

export const NotEqualZk = () => {
  const generateWitness = async () => {
    const x = BigInt(7);
    const y = BigInt(9);

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

  return (
    <div>
      <div>DefaultZk</div>
      <div>
        <button
          onClick={async () => {
            const isValid = await verifyOffChain();
            console.log("isValid", isValid);
          }}
        >
          Verify off chain
        </button>
      </div>
    </div>
  );
};
