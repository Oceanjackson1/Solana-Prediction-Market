"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  orderSideLabel,
  priceToDisplay,
  amountYesToDisplay,
  type OrderAccount,
} from "@/lib/anchor/sdk";

type Level = { price: string; size: number };

function aggregateByPrice(orders: OrderAccount[]): Level[] {
  const m = new Map<string, BN>();
  for (const o of orders) {
    if (o.account.remaining.isZero()) continue;
    const key = priceToDisplay(o.account.price);
    const prev = m.get(key);
    m.set(key, prev ? prev.add(o.account.remaining) : o.account.remaining.clone());
  }
  return Array.from(m.entries())
    .map(([price, size]) => ({ price, size: size.toNumber() / 1_000_000 }))
    .sort((a, b) => Number(b.price) - Number(a.price));
}

export function OrderBook({
  orders,
  onCancel,
}: {
  orders: OrderAccount[];
  onCancel?: (o: OrderAccount) => void;
}) {
  const { publicKey } = useWallet();
  const { bids, asks } = useMemo(() => {
    const buyYes = orders.filter(
      (o) => orderSideLabel(o.account.side) === "BuyYes",
    );
    const sellYes = orders.filter(
      (o) => orderSideLabel(o.account.side) === "SellYes",
    );
    return {
      bids: aggregateByPrice(buyYes),
      asks: aggregateByPrice(sellYes).sort(
        (a, b) => Number(a.price) - Number(b.price),
      ),
    };
  }, [orders]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel title="Bids (Buy YES)" rows={bids} color="emerald" />
      <Panel title="Asks (Sell YES)" rows={asks} color="rose" />
      <UserOrders
        orders={orders}
        me={publicKey?.toBase58()}
        onCancel={onCancel}
      />
    </div>
  );
}

function Panel({
  title,
  rows,
  color,
}: {
  title: string;
  rows: Level[];
  color: "emerald" | "rose";
}) {
  const accent =
    color === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className={"mb-2 text-sm font-medium " + accent}>{title}</div>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">No resting orders.</p>
      ) : (
        <table className="w-full text-sm tabular-nums">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="text-left font-normal">Price</th>
              <th className="text-right font-normal">Size (YES)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.price}
                className="border-t border-zinc-100 dark:border-zinc-900"
              >
                <td className={"py-1 " + accent}>{r.price}</td>
                <td className="py-1 text-right">{r.size.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UserOrders({
  orders,
  me,
  onCancel,
}: {
  orders: OrderAccount[];
  me?: string;
  onCancel?: (o: OrderAccount) => void;
}) {
  if (!me) return null;
  const mine = orders.filter((o) => o.account.maker.toBase58() === me);
  return (
    <div className="sm:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="mb-2 text-sm font-medium">Your open orders</div>
      {mine.length === 0 ? (
        <p className="text-xs text-zinc-500">You have no open orders.</p>
      ) : (
        <table className="w-full text-sm tabular-nums">
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="text-left font-normal">Side</th>
              <th className="text-right font-normal">Price</th>
              <th className="text-right font-normal">Remaining</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mine.map((o) => (
              <tr
                key={o.pubkey.toBase58()}
                className="border-t border-zinc-100 dark:border-zinc-900"
              >
                <td className="py-1">{orderSideLabel(o.account.side)}</td>
                <td className="py-1 text-right">
                  {priceToDisplay(o.account.price)}
                </td>
                <td className="py-1 text-right">
                  {amountYesToDisplay(o.account.remaining)}
                </td>
                <td className="py-1 text-right">
                  {onCancel && (
                    <button
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => onCancel(o)}
                    >
                      cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
