// Pure utility functions (no dependencies)

export type Option = "A" | "B" | "C" | "D";

export function isOption(v: unknown): v is Option {
  return v === "A" || v === "B" || v === "C" || v === "D";
}

export function now() {
  return new Date();
}

export interface RoundStateInfo {
  status: string;
  openedAt: Date | null;
  closesAt: Date | null;
  closedAt: Date | null;
}

export function computeRoundState(round: RoundStateInfo) {
  const t = now().getTime();
  const closesAtMs = round.closesAt?.getTime() ?? null;
  const openedAtMs = round.openedAt?.getTime() ?? null;
  const isOpen =
    round.status === "OPEN" &&
    openedAtMs !== null &&
    closesAtMs !== null &&
    t >= openedAtMs &&
    t < closesAtMs;

  const isExpired =
    round.status === "OPEN" && closesAtMs !== null && t >= closesAtMs;

  return {
    isOpen,
    isExpired,
    serverNowMs: t,
    openedAtMs,
    closesAtMs,
  };
}
