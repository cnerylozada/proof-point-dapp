"use client";

import { useState } from "react";
import { PangramGame } from "@/components/pangram/PangramGame";

const words = ["lucciano", "keystone"];

export default function PangramPage() {
  const [submittedGuesses, setSubmittedGuesses] = useState<string[] | null>(
    null,
  );

  return (
    <div className="flex w-full flex-col items-center gap-8 px-4 py-16">
      <div className="w-full max-w-md">
        <PangramGame
          words={words}
          difficulty="normal"
          onSubmit={setSubmittedGuesses}
        />
      </div>

      {submittedGuesses && (
        <pre className="w-full max-w-md rounded-lg bg-muted p-3 text-sm">
          {JSON.stringify(submittedGuesses, null, 2)}
        </pre>
      )}
    </div>
  );
}
