import type { Pose } from "../interfaces/Config";

export type WeaponCategory =
  | "default-1h"
  | "2h"
  | "crossbow-1h"
  | "crossbow-2h"
  | "shield";

const SHIELD_TYPES = new Set([
  "buckler-shield",
  "medium-shield",
  "tower-shield"
]);

const TWO_HANDED_MELEE_POSES = new Set<Pose>(["2h mainhand", "2h offhand"]);
const TWO_HANDED_CROSSBOW_POSES = new Set<Pose>([
  "2h mainhand crossbow",
  "2h offhand crossbow"
]);

/**
 * Weapon stacking category. Hand weapons use {@code poseKey=all} only; category comes from
 * {@code equipType} and {@code twoHanded}. Chest/gloves may still pass stance pose keys.
 */
export function weaponCategory(
  equipType: string | undefined,
  poseKey: Pose,
  twoHanded?: boolean
): WeaponCategory {
  const type = (equipType ?? "").toLowerCase();
  const useItemFlagsOnly = poseKey === "all";

  if (SHIELD_TYPES.has(type)) {
    return "shield";
  }

  if (type === "crossbow") {
    if (twoHanded || (!useItemFlagsOnly && TWO_HANDED_CROSSBOW_POSES.has(poseKey))) {
      return "crossbow-2h";
    }
    return "crossbow-1h";
  }

  if (twoHanded || (!useItemFlagsOnly && TWO_HANDED_MELEE_POSES.has(poseKey))) {
    return "2h";
  }

  return "default-1h";
}
