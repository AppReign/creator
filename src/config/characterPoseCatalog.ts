import type { EquipSlot } from "./equipSlots";

/** Stance pose keys shared by chest overlays, gloves, and base arms (no {@code all}). */
export const STANCE_POSE_KEYS = [
  "1h mainhand",
  "1h offhand",
  "2h mainhand",
  "2h offhand",
  "2h mainhand crossbow",
  "2h offhand crossbow",
  "1h mainhand crossbow",
  "1h offhand crossbow",
  "throwing mainhand",
  "throwing offhand"
] as const;

/**
 * All characterDisplay / base-part pose keys including the {@code all} wildcard.
 * Matches server `FULL_POSE_KEYS` for chest; gloves use {@link STANCE_POSE_KEYS} only.
 */
export const FULL_POSE_KEYS = ["all", ...STANCE_POSE_KEYS] as const;

const ALL_ONLY_POSE_KEYS = ["all"] as const;

const POSE_KEYS_BY_SLOT: Partial<Record<EquipSlot, readonly string[]>> = {
  chest: FULL_POSE_KEYS,
  /** Like base arms: one sprite set per weapon stance — no {@code all} bucket. */
  gloves: STANCE_POSE_KEYS,
  helm: ALL_ONLY_POSE_KEYS,
  pants: ALL_ONLY_POSE_KEYS,
  boots: ALL_ONLY_POSE_KEYS,
  "main-hand": ALL_ONLY_POSE_KEYS,
  "off-hand": ALL_ONLY_POSE_KEYS
};

export function poseKeysForEquipSlot(equipSlot: EquipSlot | string): readonly string[] {
  return POSE_KEYS_BY_SLOT[equipSlot as EquipSlot] ?? ALL_ONLY_POSE_KEYS;
}
