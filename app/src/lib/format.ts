import { BN } from "@coral-xyz/anchor";

const UNIT = 1_000_000;

export function truncateAddr(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatRelative(tsMs: number, now = Date.now()): string {
  const delta = tsMs - now;
  const past = delta < 0;
  const abs = Math.abs(delta);

  const MIN = 60_000;
  const HOUR = MIN * 60;
  const DAY = HOUR * 24;

  let qty: number;
  let unit: string;
  if (abs < MIN) {
    qty = Math.max(1, Math.floor(abs / 1000));
    unit = "s";
  } else if (abs < HOUR) {
    qty = Math.floor(abs / MIN);
    unit = "min";
  } else if (abs < DAY) {
    qty = Math.floor(abs / HOUR);
    unit = "h";
  } else {
    qty = Math.floor(abs / DAY);
    unit = "d";
  }

  return past ? `${qty}${unit} ago` : `in ${qty}${unit}`;
}

export function formatUsdc(raw: BN | number | bigint): string {
  const n =
    typeof raw === "bigint"
      ? Number(raw)
      : typeof raw === "number"
        ? raw
        : raw.toNumber();
  return (n / UNIT).toFixed(2);
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}
