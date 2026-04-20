"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ToastKind = "info" | "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };

type Ctx = {
  push: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // During SSR or before provider mounts — degrade to no-ops.
    return {
      push: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      kind === "error" ? 6000 : 3500,
    );
  }, []);

  const api = useMemo<Ctx>(
    () => ({
      push,
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastDeck toasts={toasts} />
    </ToastCtx.Provider>
  );
}

function ToastDeck({ toasts }: { toasts: Toast[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "pointer-events-auto rounded-xl border px-4 py-3 shadow-lg text-sm backdrop-blur",
            t.kind === "success" &&
              "border-emerald-300 bg-emerald-50/90 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-100",
            t.kind === "error" &&
              "border-rose-300 bg-rose-50/90 text-rose-900 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-100",
            t.kind === "info" &&
              "border-zinc-300 bg-white/90 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
