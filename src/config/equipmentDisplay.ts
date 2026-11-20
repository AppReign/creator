import {
  ConfigImage,
  ConfigPartEquipment,
  ItemEquip,
  CharacterDisplay,
  CharacterDisplayImageRow,
  Pose,
  CharacterSex
} from "../interfaces/Config";
import type { EquipmentSetBundle } from "../types/equipmentSet";
import type { EquipSlot } from "./equipSlots";
import {
  resolveEquipmentZIndex,
  supportsHandWeaponZIndex,
  type ChestHandSide
} from "../layers/resolveEquipmentZIndex";
import {
  equipmentZIndexContextFromEquipped,
  type EquipmentZIndexContext
} from "../layers/zIndexOverrides";
import {
  deriveChestWeaponStances,
  handPoseBucketOf,
  EquipmentHandPose
} from "../utils/equipmentPose";

/** Neutral idle pose for catalog previews (gloves resolve from stance buckets). */
const CATALOG_PREVIEW_HAND_POSE: EquipmentHandPose = {
  mainHandPose: "1h mainhand",
  offHandPose: "1h offhand"
};

/** Slots that only use the {@code all} pose bucket (including hand weapons). */
const ALL_ONLY_SLOTS: readonly EquipSlot[] = [
  "helm",
  "boots",
  "pants",
  "main-hand",
  "off-hand"
];

const femaleFallbackWarned = new Set<string>();

function getMalePoseBuckets(
  item: ItemEquip & { characterDisplay: CharacterDisplay }
): Partial<Record<Pose, CharacterDisplayImageRow[]>> {
  const male = item.characterDisplay.perSex.male;
  if (!male || Object.keys(male).length === 0) {
    throw new Error(`Item "${item.id}" missing characterDisplay.perSex.male`);
  }
  return male;
}

function getPoseBuckets(
  item: ItemEquip & { characterDisplay: CharacterDisplay },
  sex: CharacterSex
): Partial<Record<Pose, CharacterDisplayImageRow[]>> {
  const male = item.characterDisplay.perSex.male;
  if (!male || Object.keys(male).length === 0) {
    throw new Error(`Item "${item.id}" missing characterDisplay.perSex.male`);
  }
  if (sex === "male") {
    return male;
  }
  const perSex = item.characterDisplay.perSex;
  const female =
    "female" in perSex ? perSex.female : undefined;
  if (female && Object.keys(female).length > 0) {
    return female;
  }
  if (!femaleFallbackWarned.has(item.id)) {
    console.warn(
      `[equipment] Item "${item.id}" has no female characterDisplay; using male layers until art is added.`
    );
    femaleFallbackWarned.add(item.id);
  }
  return male;
}

function isHandPoseKeyedBuckets(
  buckets: Partial<Record<Pose, CharacterDisplayImageRow[]>>
): boolean {
  if (!buckets.all?.length) return false;
  return Object.keys(buckets).some((k) => k !== "all");
}

function isHandWeaponSlot(slot: EquipSlot | string): slot is "main-hand" | "off-hand" {
  return slot === "main-hand" || slot === "off-hand";
}

function filterResolvedImages(
  images: ({ filename: string; zIndex: number } | null)[]
): ConfigImage[] {
  return images.filter(
    (image): image is { filename: string; zIndex: number } => image != null
  );
}

function toConfigImage(
  item: ItemEquip,
  poseKey: Pose,
  row: CharacterDisplayImageRow,
  zIndexContext?: EquipmentZIndexContext,
  chestHandSide?: ChestHandSide
): { filename: string; zIndex: number } | null {
  if (
    isHandWeaponSlot(item.equipSlot) &&
    !supportsHandWeaponZIndex(
      item.equipSlot,
      poseKey,
      row.layer,
      item.equipType,
      item.twoHanded
    )
  ) {
    return null;
  }

  return {
    filename: row.filename,
    zIndex: resolveEquipmentZIndex({
      equipSlot: item.equipSlot,
      poseKey,
      layer: row.layer,
      equipType: item.equipType,
      twoHanded: item.twoHanded,
      chestHandSide,
      zIndexContext
    })
  };
}

function pushBucketLayers(
  item: ItemEquip,
  bucketPoseKey: Pose,
  layers: CharacterDisplayImageRow[] | undefined,
  seen: Set<string>,
  out: { filename: string; zIndex: number }[],
  zIndexContext?: EquipmentZIndexContext,
  chestHandSide?: ChestHandSide
): void {
  if (!layers?.length) return;
  for (const row of layers) {
    const image = toConfigImage(
      item,
      bucketPoseKey,
      row,
      zIndexContext,
      chestHandSide
    );
    if (!image) continue;
    const key = `${image.filename}|${image.zIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(image);
  }
}

function chestHandSideForWeaponStance(weaponStancePose: Pose): ChestHandSide {
  const bucket = handPoseBucketOf(weaponStancePose);
  return bucket === "offhand" ? "offhand" : "mainhand";
}

function pushChestWeaponStanceLayers(
  item: ItemEquip,
  weaponStancePose: Pose,
  buckets: Partial<Record<Pose, CharacterDisplayImageRow[]>>,
  def: Pose,
  seen: Set<string>,
  out: { filename: string; zIndex: number }[],
  zIndexContext?: EquipmentZIndexContext
): void {
  pushBucketLayers(
    item,
    weaponStancePose,
    buckets[weaponStancePose] ?? buckets[def],
    seen,
    out,
    zIndexContext,
    chestHandSideForWeaponStance(weaponStancePose)
  );
}

function allBucketImages(
  item: ItemEquip,
  buckets: Partial<Record<Pose, CharacterDisplayImageRow[]>>,
  zIndexContext?: EquipmentZIndexContext
): ConfigImage[] {
  const seen = new Set<string>();
  const out: { filename: string; zIndex: number }[] = [];
  pushBucketLayers(item, "all", buckets.all, seen, out, zIndexContext);
  if (out.length) return out;
  const firstEntry = Object.entries(buckets).find(([, v]) => v?.length);
  if (!firstEntry) return [];
  const [poseKey, rows] = firstEntry as [Pose, CharacterDisplayImageRow[]];
  pushBucketLayers(item, poseKey, rows, seen, out, zIndexContext);
  return out;
}

/**
 * Gloves follow base arms: load over/under rows from the current main- and off-hand
 * stance buckets (no {@code all}).
 */
function resolveGlovesImagesForHandPose(
  item: ItemEquip,
  buckets: Partial<Record<Pose, CharacterDisplayImageRow[]>>,
  handPose: EquipmentHandPose,
  zIndexContext?: EquipmentZIndexContext
): ConfigImage[] {
  const seen = new Set<string>();
  const out: { filename: string; zIndex: number }[] = [];
  const stances =
    handPose.mainHandPose === handPose.offHandPose
      ? [handPose.mainHandPose]
      : [handPose.mainHandPose, handPose.offHandPose];
  for (const stance of stances) {
    pushBucketLayers(item, stance, buckets[stance], seen, out, zIndexContext);
  }
  return out;
}

/**
 * Resolves drawable rows for the current hand pose.
 * — **Chest** composes `all` plus main- and off-hand stance buckets (weapon or idle).
 * — **Gloves** load main- and off-hand stance buckets only (like base arms).
 * — **Helm / pants / boots / main-hand / off-hand** use only the `all` bucket.
 */
export function resolveEquipmentImagesForHandPose(
  item: ItemEquip,
  pose: EquipmentHandPose,
  sex: CharacterSex,
  equipped: ConfigPartEquipment[] = [],
  zIndexOverrides: Omit<EquipmentZIndexContext, "glovesEquipped"> = {}
): ConfigImage[] {
  if (!item.characterDisplay) {
    return [];
  }
  const withDisplay = item as ItemEquip & { characterDisplay: CharacterDisplay };
  const buckets = getPoseBuckets(withDisplay, sex);
  const slot = item.equipSlot;
  const zIndexContext = equipmentZIndexContextFromEquipped(
    equipped,
    zIndexOverrides
  );

  if (slot === "gloves") {
    return resolveGlovesImagesForHandPose(item, buckets, pose, zIndexContext);
  }

  if (ALL_ONLY_SLOTS.includes(slot)) {
    return allBucketImages(item, buckets, zIndexContext);
  }

  const maleBuckets = getMalePoseBuckets(withDisplay);
  const def: Pose = maleBuckets.all?.length
    ? "all"
    : deriveCatalogPoseFromBuckets(maleBuckets);

  const seen = new Set<string>();
  const out: { filename: string; zIndex: number }[] = [];

  pushBucketLayers(item, "all", buckets.all, seen, out, zIndexContext);
  for (const weaponStance of deriveChestWeaponStances(equipped)) {
    pushChestWeaponStanceLayers(
      item,
      weaponStance,
      buckets,
      def,
      seen,
      out,
      zIndexContext
    );
  }
  return out;
}

export function deriveCatalogPoseFromBuckets(
  buckets: Partial<Record<Pose, CharacterDisplayImageRow[]>>
): Pose {
  if (isHandPoseKeyedBuckets(buckets)) return "all";
  const nonEmpty = (
    Object.entries(buckets) as [Pose, NonNullable<(typeof buckets)[Pose]>][]
  ).filter(([, rows]) => rows?.length);
  if (nonEmpty.length === 0) return "all";
  if (nonEmpty.length === 1) return nonEmpty[0][0];
  const nonAll = nonEmpty.filter(([k]) => k !== "all");
  if (nonAll.length === 1) return nonAll[0][0];
  if (nonAll.length > 1) return nonAll[0][0];
  return "all";
}

function deriveCatalogPose(
  item: ItemEquip & { characterDisplay: CharacterDisplay }
): Pose {
  if (isHandWeaponSlot(item.equipSlot)) {
    return "all";
  }
  // One item, many stance buckets — listing filter always includes gloves (see partMatchesPose).
  if (item.equipSlot === "gloves") {
    return "1h mainhand";
  }
  return deriveCatalogPoseFromBuckets(getMalePoseBuckets(item));
}

function imagesForCatalogEntry(
  item: ItemEquip & { characterDisplay: CharacterDisplay }
): ConfigImage[] {
  const buckets = getMalePoseBuckets(item);

  if (item.equipSlot === "gloves") {
    return resolveGlovesImagesForHandPose(item, buckets, CATALOG_PREVIEW_HAND_POSE);
  }

  if (ALL_ONLY_SLOTS.includes(item.equipSlot)) {
    return allBucketImages(item, buckets);
  }

  if (isHandPoseKeyedBuckets(buckets)) {
    return allBucketImages(item, buckets);
  }
  const catalogPose = deriveCatalogPose(item);
  const poseLayers = buckets[catalogPose];
  if (poseLayers?.length) {
    return filterResolvedImages(
      poseLayers.map((row) => toConfigImage(item, catalogPose, row))
    );
  }
  return allBucketImages(item, buckets);
}

function catalogEntryFromRegistryItem(
  registryKey: string,
  item: ItemEquip & { characterDisplay: CharacterDisplay },
  equipSet: string
): ConfigPartEquipment {
  return {
    name: item.name,
    equipSlot: item.equipSlot,
    equipSet,
    pose: deriveCatalogPose(item),
    images: imagesForCatalogEntry(item),
    ...(item.equipType !== undefined ? { equipType: item.equipType } : {}),
    ...(item.twoHanded !== undefined ? { twoHanded: item.twoHanded } : {}),
    equipmentRegistryKey: registryKey
  };
}

export function buildEquipmentCatalog(
  bundles: readonly EquipmentSetBundle[]
): ConfigPartEquipment[] {
  const out: ConfigPartEquipment[] = [];
  for (const { equipSet, items } of bundles) {
    for (const item of items) {
      if (!item.characterDisplay) continue;
      out.push(
        catalogEntryFromRegistryItem(
          item.id,
          item as ItemEquip & { characterDisplay: CharacterDisplay },
          equipSet
        )
      );
    }
  }
  return out;
}
