# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js version warning

This project runs **Next.js 16.2.10**, which is newer than what most training data covers. Before writing or editing any App Router code (routing, `route.ts` handlers, `after()`, config, etc.), check `node_modules/next/dist/docs/01-app/` — it ships the actual docs for the installed version. Don't assume Next.js 13/14/15 conventions apply.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test script/framework configured in this repo yet.

## Environment variables

Required in `.env`:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` — public thirdweb client ID, used client-side (`libs/thirdweb.ts`)
- `THIRDWEB_SECRET_KEY` — server-only thirdweb secret key, used to build the server client (`libs/thirdweb-server.ts`) that backs the x402 facilitator

Never import `libs/thirdweb-server.ts` from client components — it will leak the secret key into the client bundle.

## Architecture

Proof Point is a demo app combining **thirdweb** for wallet/chain interaction with the **x402 payment protocol** for pay-per-view API access, plus an early prototype of Merkle-tree-based allowlist proofs.

### x402 pay-per-view flow

- `libs/x402-config.ts` defines the payment terms: amount, recipient address, network (`arbitrumSepolia`), and token (default USDC for that chain via `getDefaultToken`).
- `libs/x402.ts` builds a `thirdwebFacilitator` (from `thirdweb/x402`) using the server-side thirdweb client and a server wallet address that settles payments on-chain.
- `app/api/paid-endpoint/route.ts` is the payment-gated route. Pattern to follow for any new paid endpoint:
  1. Read the payment header (`payment-signature` or `x-payment`).
  2. Build `PaymentArgs` from the config in `libs/x402-config.ts` plus the facilitator.
  3. `verifyPayment(paymentArgs)` first — cheap, no on-chain submission. If it doesn't return `200`, return its `responseBody`/`responseHeaders`/`status` directly.
  4. Call `settlePayment(paymentArgs)` (the actual on-chain transfer) inside `after(...)` from `next/server`, so response latency isn't blocked by settlement. Log settlement failures; don't fail the already-sent response.
- `components/PayPerView.tsx` is the client counterpart: `useFetchWithPayment` (from `thirdweb/react`) wraps `fetch` and transparently handles wallet connection, funding, and payment signing before hitting a paid endpoint.

### thirdweb client split

- `libs/thirdweb.ts` — public client (browser-safe, `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`), used by `Header.tsx`, `PayPerView.tsx`, and any client component needing wallet/chain access.
- `libs/thirdweb-server.ts` — server-only client (`THIRDWEB_SECRET_KEY`), used only to construct the x402 facilitator.

### Wallet connection

`components/Header.tsx` renders thirdweb's `ConnectButton`, configured for `arbitrumSepolia` with an in-app wallet (Google auth) plus MetaMask. This is rendered globally from `app/layout.tsx`, wrapped in `ThirdwebProvider`.

### Allowlist Merkle proof prototype

`app/dashboard/page.tsx` currently contains prototype/scratch code (not yet a real feature) building a Poseidon-hashed incremental Merkle tree over a hardcoded wallet allowlist. Note: this page separately queries an ERC-20 balance on `sepolia` (via `libs/thirdweb.ts` + `thirdweb/extensions/erc20`), a different network than the `arbitrumSepolia` used for x402 payments — check which network is intended before extending this code.

### Noir ZK circuits

Circuit components live in `components/*Zk.tsx`, each pairing a compiled Noir circuit (`circuits/*.json`, output of `nargo compile`, imported directly as a JSON module — not fetched at runtime from `public/`) with the shared off-chain proving/verification helper `offChainValidation` in `libs/noir.ts`:

```ts
// libs/noir.ts
export const offChainValidation = async (bytecode: string, witness: Uint8Array) => {
  const barretenbergAPI = await Barretenberg.new();
  const backend = new UltraHonkBackend(bytecode, barretenbergAPI);
  const bbProof = await backend.generateProof(witness);
  return backend.verifyProof(bbProof);
};
```

`offChainValidation` is generic over any circuit — it just needs that circuit's `bytecode` (from its compiled JSON) and a witness. Each component is responsible for building its own circuit-specific inputs and calling `Noir.execute(inputs)` to get that witness, then passing `(circuit.bytecode, witness)` into `offChainValidation`.

Current circuit components:

- **`components/NotEqualZk.tsx`** — minimal example circuit, `circuits/not_equal.json`. Circuit: `fn main(x: Field, y: pub Field) { assert(x != y); }`. Wired into `app/page.tsx`.
- **`components/MerkleAllowlistZk.tsx`** — proves allowlist membership with a Noir circuit instead of revealing the wallet/Merkle path on-chain, `circuits/merkle_allowlist.json`. Not currently imported/rendered anywhere (standalone prototype). Details:
  - Off-chain (JS), a Poseidon-hashed `@zk-kit/imt` tree (`poseidon-lite` for `poseidon1`/`poseidon2`) is built over the allowlist, and a Merkle proof (`indexes`, `hash_path`, `root`) is derived for a given wallet — see `buildMerkleProof`.
  - The circuit itself (source not checked into this repo's `circuits/` dir) takes `main(raw_wallet: Field, indexes: Field, hash_path: [Field; 10], root: pub Field)`, hashes `raw_wallet` with Poseidon and checks tree membership against `root`. The `[Field; 10]` array length is the circuit's Merkle depth and **must match** the JS-side `MAX_DEPTH` constant in `buildMerkleProof` — both bound tree capacity to `2^depth` leaves.

For any circuit, `Noir.execute(inputs)` (`@noir-lang/noir_js`) runs the ACVM and enforces the circuit's constraints at witness-generation time — if a constraint (e.g. `assert(x != y)`, or Merkle membership) doesn't hold, this throws rather than producing a witness. A successfully-produced witness is therefore already proof the constraints passed; the subsequent `offChainValidation` (`@aztec/bb.js` `UltraHonkBackend.generateProof`/`verifyProof`) step only turns that witness into a checkable proof for a third-party verifier — it doesn't re-validate the underlying constraints. `Field` inputs accept `string | number | boolean`; values that originate as `bigint` (parsed wallet addresses, Poseidon hash outputs) need `.toString()` before being passed in, since JS `bigint` isn't itself a valid `Field` value — plain small numbers (like test fixtures `x`/`y` in `NotEqualZk`) don't need this.

The JSON circuit import needs a `CompiledCircuit` cast — TS widens the JSON's literal union fields (e.g. `kind`, `visibility`) to plain `string`, so a bare `as CompiledCircuit` fails structurally (missing `function_locations` in `file_map`, etc.); use `as unknown as CompiledCircuit` (from `@noir-lang/types`).

#### Toolchain version pinning (important)

Every compiled `circuits/*.json` artifact embeds the exact `noir_version` it was compiled with (check the `noir_version` field, or run `nargo --version`) — all circuits in this repo are currently compiled with the same `1.0.0-beta.18` toolchain, but check each artifact's `noir_version` if that ever diverges. The JS-side proving/execution stack **must match that exact prerelease**, or you'll hit deserialization errors at runtime (ACVM witness/circuit format and Barretenberg's msgpack proof format both change between beta/nightly releases):

- `@noir-lang/noir_js` (and its transitive `acvm_js`/`noirc_abi`/`types`) must match the circuit's embedded `noir_version` exactly.
- `@aztec/bb.js` must match the `bb` CLI version used alongside that `nargo`/Noir toolchain (there's no dependency link between `noir_js` and `bb.js` — they're versioned independently and must be aligned manually).

Current pin, matching the toolchain all checked-in circuits were compiled with:
```
nargo/noirc 1.0.0-beta.18   ->  "@noir-lang/noir_js": "1.0.0-beta.18"  (package.json)
bb           3.0.0-nightly.20260102  ->  "@aztec/bb.js": "3.0.0-nightly.20260102"  (package.json)
```
Verify locally with `nargo --version` and `bb --version`, and compare against the `noir_version` embedded in the circuit JSON and the versions pinned in `package.json`.

**Use exact pins (no `^`) for both packages.** A caret range on a prerelease version (e.g. `^1.0.0-beta.18`) is not a safe "at least this beta" constraint — npm resolves it against essentially all `1.0.0-*` prereleases, including later betas and nightlies, and will silently pull in an incompatible version. Confirm with `npm view "<pkg>@<range>" version` before trusting any prerelease range.

If any circuit is ever recompiled with a newer `nargo`, update both pins together to match the new `noir_version`/`bb --version`, then reinstall.
