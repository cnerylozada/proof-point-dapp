"use client";

type OnChainProofParamsProps = {
  proof: `0x${string}`;
  publicInputs: `0x${string}`[];
  // Names for the leading public inputs, in the circuit's `pub` parameter
  // order. Anything past the end of this list — e.g. the circuit's return
  // value, which bb appends after the public params — shows its index only.
  publicInputNames?: string[];
};

const CopyButton = ({ value }: { value: string }) => (
  <button
    onClick={() => navigator.clipboard.writeText(value)}
    className="rounded border border-black/20 px-2 py-0.5 text-xs dark:border-white/20"
  >
    Copy
  </button>
);

export const OnChainProofParams = ({
  proof,
  publicInputs,
  publicInputNames = [],
}: OnChainProofParamsProps) => (
  <div className="flex flex-col gap-4 text-sm">
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="font-medium">proof (bytes)</span>
        <span className="text-zinc-500">{(proof.length - 2) / 2} bytes</span>
        <CopyButton value={proof} />
      </div>
      <pre className="max-h-40 overflow-auto rounded bg-zinc-100 p-2 font-mono text-xs break-all whitespace-pre-wrap dark:bg-zinc-900">
        {proof}
      </pre>
    </div>

    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="font-medium">publicInputs (bytes32[])</span>
        <span className="text-zinc-500">{publicInputs.length} items</span>
        {/* JSON, because that's the ["0x…","0x…"] shape contract UIs expect */}
        <CopyButton value={JSON.stringify(publicInputs)} />
      </div>
      <ol className="max-h-40 overflow-auto rounded bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-900">
        {publicInputs.map((publicInput, index) => (
          <li key={index} className="break-all">
            <span className="text-zinc-500">
              {index}
              {publicInputNames[index] ? ` · ${publicInputNames[index]}` : ""}:{" "}
            </span>
            {publicInput}
          </li>
        ))}
      </ol>
    </div>
  </div>
);
