"use client";
import { useState } from "react";
import { useFetchWithPayment } from "thirdweb/react";
import { thirdwebClient } from "@/libs/thirdweb-client-side";
import { PAYMENT_TOKEN_ADDRESS } from "@/libs/x402";

export const PayPerView = () => {
  const { fetchWithPayment, isPending } = useFetchWithPayment(thirdwebClient);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async () => {
    setError(null);
    try {
      const data = await fetchWithPayment("/api/paid-endpoint");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  return (
    <div>
      <div>PayPerView</div>
      <div>{PAYMENT_TOKEN_ADDRESS.address}</div>
      <div>
        <button onClick={handleApiCall} disabled={isPending}>
          {isPending ? "Loading..." : "Make Paid API Call (0.05 tokens)"}
        </button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {result != null && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};
