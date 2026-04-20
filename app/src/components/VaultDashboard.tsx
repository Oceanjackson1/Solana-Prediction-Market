"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { fetchMarket, type MarketAccount } from "@/lib/anchor/sdk";
import { getReadOnlyProgram } from "@/lib/anchor/program";
import { useMarketProgram } from "@/lib/anchor/hooks";
import {
  askVaultPda,
  collateralVaultPda,
  noMintPda,
  yesMintPda,
} from "@/lib/anchor/pdas";
import { getReadOnlyVaultProgram } from "@/lib/anchor/vault-program";
import { useVaultProgram } from "@/lib/anchor/vault-hooks";
import {
  lpMintPda,
  noReservesPda,
  poolPda,
  usdcVaultPda,
  yesReservesPda,
} from "@/lib/anchor/vault-pdas";
import {
  fetchPoolSnapshot,
  findPoolForMarket,
  impliedYesPrice,
  type PoolSnapshot,
} from "@/lib/anchor/vault-sdk";
import { useToast } from "./Toast";

const UNIT = 1_000_000;

export function VaultDashboard({ marketId }: { marketId: string }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useMarketProgram();
  const vault = useVaultProgram();
  const toast = useToast();
  const marketPubkey = new PublicKey(marketId);

  const [market, setMarket] = useState<MarketAccount["account"] | null>(null);
  const [poolPk, setPoolPk] = useState<PublicKey | null>(null);
  const [snap, setSnap] = useState<PoolSnapshot | null>(null);
  const [userLp, setUserLp] = useState<bigint>(0n);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);

  const [bootstrapUsdc, setBootstrapUsdc] = useState("1000");
  const [withdrawVlp, setWithdrawVlp] = useState("100");

  const load = useCallback(async () => {
    try {
      const ro = getReadOnlyProgram(connection);
      const vro = getReadOnlyVaultProgram(connection);
      const m = await fetchMarket(ro, marketPubkey);
      setMarket(m);
      const poolRow = await findPoolForMarket(vro, marketPubkey);
      if (poolRow) {
        setPoolPk(poolRow.pubkey);
        const s = await fetchPoolSnapshot(vro, poolRow.pubkey);
        setSnap(s);
        if (publicKey) {
          try {
            const userLpAta = getAssociatedTokenAddressSync(
              s.pool.lpMint,
              publicKey,
            );
            const acc = await getAccount(connection, userLpAta);
            setUserLp(acc.amount);
          } catch {
            setUserLp(0n);
          }
        }
      } else {
        setPoolPk(null);
        setSnap(null);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [connection, marketPubkey, publicKey]);

  useEffect(() => {
    load();
  }, [load, nonce]);

  async function doInitializeAndSeed() {
    if (!vault || !program || !publicKey || !market) return;
    setBusy(true);
    try {
      const usdcAmount = Math.round(parseFloat(bootstrapUsdc) * UNIT);
      if (usdcAmount <= 0) throw new Error("amount > 0");

      const yesMint = yesMintPda(marketPubkey);
      const noMint = noMintPda(marketPubkey);
      const pool = poolPda(marketPubkey, publicKey);
      const lpMint = lpMintPda(pool);
      const usdcVault = usdcVaultPda(pool);
      const yesRes = yesReservesPda(pool);
      const noRes = noReservesPda(pool);

      const userUsdc = getAssociatedTokenAddressSync(
        market.collateralMint,
        publicKey,
      );
      const userYes = getAssociatedTokenAddressSync(yesMint, publicKey);
      const userNo = getAssociatedTokenAddressSync(noMint, publicKey);
      const userLp = getAssociatedTokenAddressSync(lpMint, publicKey);

      // Step 1: initialize_pool
      await vault.methods
        .initializePool()
        .accounts({
          admin: publicKey,
          market: marketPubkey,
          collateralMint: market.collateralMint,
          yesMint,
          noMint,
          pool,
          lpMint,
          usdcVault,
          yesReserves: yesRes,
          noReserves: noRes,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Step 2: mint a complete set so we have YES+NO
      await program.methods
        .mintCompleteSet(new BN(usdcAmount))
        .accounts({
          user: publicKey,
          market: marketPubkey,
          collateralMint: market.collateralMint,
          yesMint,
          noMint,
          collateralVault: collateralVaultPda(marketPubkey),
          userCollateral: userUsdc,
          userYes,
          userNo,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Step 3: provide_liquidity (YES + NO; USDC stays with user)
      await vault.methods
        .provideLiquidity(
          new BN(0),
          new BN(usdcAmount),
          new BN(usdcAmount),
        )
        .accounts({
          provider: publicKey,
          pool,
          collateralMint: market.collateralMint,
          yesMint,
          noMint,
          lpMint,
          usdcVault,
          yesReserves: yesRes,
          noReserves: noRes,
          providerUsdc: userUsdc,
          providerYes: userYes,
          providerNo: userNo,
          providerLp: userLp,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      toast.success(
        `Vault seeded with ${(usdcAmount / UNIT).toFixed(0)} YES + ${(usdcAmount / UNIT).toFixed(0)} NO · implied price 0.500`,
      );
      setNonce((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doWithdraw() {
    if (!vault || !publicKey || !snap || !poolPk) return;
    setBusy(true);
    try {
      const amt = Math.round(parseFloat(withdrawVlp) * UNIT);
      if (amt <= 0) throw new Error("amount > 0");

      const userUsdc = getAssociatedTokenAddressSync(
        snap.pool.collateralMint,
        publicKey,
      );
      const userYes = getAssociatedTokenAddressSync(
        snap.pool.yesMint,
        publicKey,
      );
      const userNo = getAssociatedTokenAddressSync(
        snap.pool.noMint,
        publicKey,
      );
      const userLpAta = getAssociatedTokenAddressSync(
        snap.pool.lpMint,
        publicKey,
      );

      await vault.methods
        .withdraw(new BN(amt))
        .accounts({
          provider: publicKey,
          pool: poolPk,
          collateralMint: snap.pool.collateralMint,
          yesMint: snap.pool.yesMint,
          noMint: snap.pool.noMint,
          lpMint: snap.pool.lpMint,
          usdcVault: snap.pool.usdcVault,
          yesReserves: snap.pool.yesReserves,
          noReserves: snap.pool.noReserves,
          providerLp: userLpAta,
          providerUsdc: userUsdc,
          providerYes: userYes,
          providerNo: userNo,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      toast.success(
        `Burned ${(amt / UNIT).toFixed(2)} vLP · pro-rata reserves returned`,
      );
      setNonce((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (!market) return <p className="p-6 text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-10 space-y-6">
      <header>
        <p className="text-xs text-zinc-500">vault · {market.slug}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {market.question}
        </h1>
      </header>

      {!snap ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-medium">Bootstrap the vault</h2>
          <p className="mt-1 text-sm text-zinc-500">
            You pay X USDC. The app mints X YES + X NO (complete set), and
            deposits them as initial liquidity. Implied price starts at 0.50.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm tabular-nums"
              value={bootstrapUsdc}
              onChange={(e) => setBootstrapUsdc(e.target.value)}
              placeholder="1000"
            />
            <button
              disabled={!publicKey || busy}
              onClick={doInitializeAndSeed}
              className="rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy
                ? "Bootstrapping…"
                : publicKey
                  ? "Initialize & seed"
                  : "Connect wallet"}
            </button>
          </div>
          {loadError && (
            <p className="mt-3 text-xs text-rose-600 break-all">{loadError}</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="USDC buffer" value={fmt(snap.rUsdc)} />
            <Stat label="YES reserves" value={fmt(snap.rYes)} />
            <Stat label="NO reserves" value={fmt(snap.rNo)} />
            <Stat
              label="implied YES"
              value={impliedYesPrice(snap.rYes, snap.rNo).toFixed(3)}
            />
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Your LP position</h2>
              <span className="text-xs text-zinc-500 tabular-nums">
                vLP supply {fmt(snap.pool.lpSupply.toString())}
              </span>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {fmt(userLp.toString())} vLP
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-sm tabular-nums"
                value={withdrawVlp}
                onChange={(e) => setWithdrawVlp(e.target.value)}
                placeholder="100"
              />
              <button
                disabled={!publicKey || busy}
                onClick={doWithdraw}
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Withdrawing…" : "Withdraw vLP"}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Burning vLP returns a pro-rata slice of (USDC, YES, NO).
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function fmt(raw: bigint | string): string {
  const v = typeof raw === "bigint" ? raw : BigInt(raw);
  return (Number(v) / UNIT).toFixed(2);
}
