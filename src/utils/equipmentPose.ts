import { EquipSlot } from "../config/equipSlots";
import { ConfigPartEquipment, Pose } from "../interfaces/Config";
import { weaponCategory } from "../layers/weaponCategory";

export type EquipmentHandPose = {
  mainHandPose: Pose;
  offHandPose: Pose;
};

const DEFAULT_MAIN_HAND_EMPTY: Pose = "1h mainhand";
const DEFAULT_OFF_HAND_EMPTY: Pose = "1h offhand";

export type HandPoseBucket = "mainhand" | "offhand";
export function handPoseBucketOf(p: Pose): HandPoseBucket {
  if (
    p === "1h offhand" ||
    p === "1h offhand crossbow" ||
    p === "throwing offhand" ||
    p === "2h offhand" ||
    p === "2h offhand crossbow"
  ) {
    return "offhand";
  }
  return "mainhand";
}

export function isTwoHandedWeaponPose(pose: Pose): boolean {
  return (
    pose === "2h mainhand" ||
    pose === "2h offhand" ||
    pose === "2h mainhand crossbow" ||
    pose === "2h offhand crossbow"
  );
}

export function complementaryOneHandIdle(p: Pose): Pose {
  return p === "1h mainhand" ? "1h offhand" : "1h mainhand";
}

export function complementaryTwoHandedOffhand(mainHandPose: Pose): Pose {
  switch (mainHandPose) {
    case "2h mainhand":
      return "2h offhand";
    case "2h mainhand crossbow":
      return "2h offhand crossbow";
    default:
      throw new Error(`No 2h off-hand complement for pose=${mainHandPose}`);
  }
}

/** Chest weapon-stance overlays — one per hand slot (weapon stance or default idle). */
export function deriveChestWeaponStances(
  equipped: ConfigPartEquipment[]
): Pose[] {
  const handPose = derivePoseFromEquipment(equipped);
  const hasMain = equipped.some((p) => p.equipSlot === "main-hand");

  const mainStance = hasMain ? handPose.mainHandPose : DEFAULT_MAIN_HAND_EMPTY;
  const offStance = handPose.offHandPose;

  if (mainStance === offStance) {
    return [mainStance];
  }
  return [mainStance, offStance];
}

/** True when the item’s pose or flag indicates it uses both hands (2h / 2h crossbow). */
export function weaponOccupiesBothHands(part: ConfigPartEquipment): boolean {
  return (
    part.twoHanded === true ||
    isTwoHandedWeaponPose(part.pose) ||
    isTwoHandedWeaponPose(bodyStancePoseForHandItem(part))
  );
}

/**
 * Body/arm stance for a hand-slot item. Hand weapons store catalog {@code pose=all}; map that
 * to a real stance key ({@code 1h mainhand}, {@code 2h mainhand}, …) for base parts and chest overlays.
 */
export function bodyStancePoseForHandItem(part: ConfigPartEquipment): Pose {
  if (part.equipSlot !== "main-hand" && part.equipSlot !== "off-hand") {
    return part.pose;
  }

  if (part.pose !== "all") {
    return part.pose;
  }

  const equipType = (part.equipType ?? "").toLowerCase();
  if (equipType === "thrown" || equipType === "darts") {
    return part.equipSlot === "main-hand" ? "throwing mainhand" : "throwing offhand";
  }

  const category = weaponCategory(part.equipType, "all", part.twoHanded);

  if (part.equipSlot === "main-hand") {
    switch (category) {
      case "2h":
        return "2h mainhand";
      case "crossbow-2h":
        return "2h mainhand crossbow";
      case "crossbow-1h":
        return "1h mainhand crossbow";
      case "default-1h":
      case "shield":
      default:
        return "1h mainhand";
    }
  }

  switch (category) {
    case "2h":
      return "2h offhand";
    case "crossbow-2h":
      return "2h offhand crossbow";
    case "crossbow-1h":
      return "1h offhand crossbow";
    case "shield":
    case "default-1h":
    default:
      return "1h offhand";
  }
}

function stancePoseForSlot(
  part: ConfigPartEquipment | undefined,
  slot: "main-hand" | "off-hand"
): Pose {
  if (!part) {
    return slot === "main-hand" ? DEFAULT_MAIN_HAND_EMPTY : DEFAULT_OFF_HAND_EMPTY;
  }
  return bodyStancePoseForHandItem(part);
}

export function derivePoseFromEquipment(
  equipment: ConfigPartEquipment[]
): EquipmentHandPose {
  const mainHand = equipment.find((p) => p.equipSlot === "main-hand");
  const offHand = equipment.find((p) => p.equipSlot === "off-hand");

  let mainHandPose = stancePoseForSlot(mainHand, "main-hand");
  let offHandPose = stancePoseForSlot(offHand, "off-hand");

  if (
    mainHand != null &&
    offHand == null &&
    weaponOccupiesBothHands(mainHand)
  ) {
    offHandPose = complementaryTwoHandedOffhand(mainHandPose);
  }

  return { mainHandPose, offHandPose };
}

/**
 * Two pose keys for {@link getBaseCharacterAssets}. If both slot poses map to the **same**
 * hand bucket (collision), the second bundle uses the opposite idle (`1h mainhand` ↔ `1h offhand`).
 * Item resolution still uses truthful {@link derivePoseFromEquipment}.
 */
export function deriveBaseArmBundlePoses(
  pose: EquipmentHandPose
): EquipmentHandPose {
  const { mainHandPose, offHandPose } = pose;
  const sm = handPoseBucketOf(mainHandPose);
  const so = handPoseBucketOf(offHandPose);

  if (sm === so) {
    return {
      mainHandPose,
      offHandPose: complementaryOneHandIdle(mainHandPose)
    };
  }

  return { mainHandPose, offHandPose };
}

/**
 * Whether `p` should appear in the slot list for the current hand-derived pose.
 * Hand slots and gloves list every catalog option in that slot (native catalog `pose` may
 * differ from the default derived pose when nothing is equipped). Other armor uses `"all"`
 * or stance-specific poses.
 */
export function partMatchesPose(
  p: ConfigPartEquipment,
  slot: EquipSlot,
  pose: EquipmentHandPose
): boolean {
  if (slot === "main-hand" || slot === "off-hand" || slot === "gloves") {
    return true;
  }
  if (p.pose === "all") return true;
  return p.pose === pose.mainHandPose || p.pose === pose.offHandPose;
}

export function getEquipmentPartsForSlot(
  slot: EquipSlot,
  catalog: ConfigPartEquipment[],
  equipped: ConfigPartEquipment[]
): ConfigPartEquipment[] {
  const handPose = derivePoseFromEquipment(equipped);
  return catalog.filter(
    (p) => p.equipSlot === slot && partMatchesPose(p, slot, handPose)
  );
}
