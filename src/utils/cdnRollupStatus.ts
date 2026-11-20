/** Aggregated CDN probe result for a set of image URLs. */
export type CdnRollupStatus = "pending" | "ok" | "partial" | "error" | "issue" | "na";

export function rollupCdnStatusFromCounts(
  total: number,
  ok: number,
  error: number,
  pending: number
): CdnRollupStatus {
  if (total === 0) return "na";
  if (pending > 0) return "pending";
  if (error > 0 && ok > 0) return "partial";
  if (error > 0) return "error";
  if (ok === total) return "ok";
  return "error";
}
