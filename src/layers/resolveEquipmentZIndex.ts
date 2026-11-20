import type { EquipSlot } from "../config/equipSlots";
import type { Pose } from "../interfaces/Config";
import { handPoseBucketOf } from "../utils/equipmentPose";
import { EQUIPMENT } from "./equipmentLayer";
import { CharacterStackLayer, normalizeStackLayer } from "./characterStackLayer";
import { WeaponCategory, weaponCategory } from "./weaponCategory";
import { ZIndexLayerKey, zIndexValue } from "./zIndex";
import {
  applyGlovesEquippedOffset,
  bootsLayerKey,
  chestBodyLayerKey,
  type EquipmentZIndexContext
} from "./zIndexOverrides";

export type ChestHandSide = "mainhand" | "offhand";

export type ResolveEquipmentZIndexInput = {
  equipSlot: EquipSlot | string;
  poseKey: Pose;
  layer: CharacterStackLayer | string;
  equipType?: string;
  twoHanded?: boolean;
  /**
   * Chest stance buckets: which hand slot this row occupies in the composed stack.
   * Main-hand weapon pose → `mainhand`; off-hand / secondary bucket → `offhand`.
   */
  chestHandSide?: ChestHandSide;
  /** Optional tuck / gloves-equipped overrides on top of the base {@link zIndex} table. */
  zIndexContext?: EquipmentZIndexContext;
};

/** Chest weapon-stance overlay z-index per composed stance pose key. */
const CHEST_STANCE_ZINDEX: Partial<Record<Pose, ZIndexLayerKey>> = {
  "1h mainhand": EQUIPMENT.CHEST.MAINHAND.ONE_HANDED,
  "1h offhand": EQUIPMENT.CHEST.OFFHAND.ONE_HANDED,
  "2h mainhand": EQUIPMENT.CHEST.MAINHAND.TWO_HANDED,
  "2h offhand": EQUIPMENT.CHEST.OFFHAND.TWO_HANDED,
  "2h mainhand crossbow": EQUIPMENT.CHEST.MAINHAND.CROSSBOW_TWO_HANDED,
  "2h offhand crossbow": EQUIPMENT.CHEST.OFFHAND.CROSSBOW_TWO_HANDED,
  "1h mainhand crossbow": EQUIPMENT.CHEST.MAINHAND.CROSSBOW_ONE_HANDED,
  "1h offhand crossbow": EQUIPMENT.CHEST.OFFHAND.CROSSBOW_ONE_HANDED,
  "throwing mainhand": EQUIPMENT.CHEST.MAINHAND.THROWING,
  "throwing offhand": EQUIPMENT.CHEST.OFFHAND.THROWING
};

/** Chest overlay layer for one composed hand slot + stance bucket. */
export function chestLayerForHandBucket(
  handSide: ChestHandSide,
  bucketPoseKey: Pose
): ZIndexLayerKey {
  const key = CHEST_STANCE_ZINDEX[bucketPoseKey];
  if (!key) {
    throw new Error(
      `No chest overlay for handSide=${handSide} bucketPoseKey=${bucketPoseKey}`
    );
  }
  const expectedSide = handPoseBucketOf(bucketPoseKey);
  if (expectedSide !== handSide) {
    throw new Error(
      `Chest handSide=${handSide} does not match bucketPoseKey=${bucketPoseKey}`
    );
  }
  return key;
}

const MAIN_HAND_ZINDEX: Record<
  WeaponCategory,
  Partial<Record<"over" | "under", ZIndexLayerKey>>
> = {
  "default-1h": {
    under: EQUIPMENT.MAINHAND.ONE_HANDED.DEFAULT.UNDER
  },
  "2h": {
    under: EQUIPMENT.MAINHAND.TWO_HANDED.UNDER,
    over: EQUIPMENT.MAINHAND.TWO_HANDED.OVER
  },
  "crossbow-1h": {
    under: EQUIPMENT.MAINHAND.ONE_HANDED.CROSSBOW.UNDER,
    over: EQUIPMENT.MAINHAND.ONE_HANDED.CROSSBOW.OVER
  },
  "crossbow-2h": {
    under: EQUIPMENT.MAINHAND.TWO_HANDED.UNDER,
    over: EQUIPMENT.MAINHAND.TWO_HANDED.OVER
  },
  shield: {}
};

const OFF_HAND_ZINDEX: Record<
  WeaponCategory,
  Partial<Record<"over" | "under", ZIndexLayerKey>>
> = {
  shield: {
    under: EQUIPMENT.OFFHAND.ONE_HANDED.SHIELD.UNDER
  },
  "crossbow-1h": {
    under: EQUIPMENT.OFFHAND.ONE_HANDED.CROSSBOW.UNDER,
    over: EQUIPMENT.OFFHAND.ONE_HANDED.CROSSBOW.OVER
  },
  "default-1h": {},
  "2h": {},
  "crossbow-2h": {}
};

type GloveHandSide = "mainhand" | "offhand";

const GLOVES_ZINDEX: Record<
  GloveHandSide,
  Partial<Record<Pose, Partial<Record<"over" | "under", ZIndexLayerKey>>>>
> = {
  mainhand: {
    "1h mainhand": {
      under: EQUIPMENT.GLOVES.MAINHAND.ONE_HANDED.UNDER,
      over: EQUIPMENT.GLOVES.MAINHAND.ONE_HANDED.OVER
    },
    "2h mainhand": {
      under: EQUIPMENT.GLOVES.MAINHAND.TWO_HANDED.UNDER,
      over: EQUIPMENT.GLOVES.MAINHAND.TWO_HANDED.OVER
    },
    "1h mainhand crossbow": {
      under: EQUIPMENT.GLOVES.MAINHAND.CROSSBOW.UNDER,
      over: EQUIPMENT.GLOVES.MAINHAND.CROSSBOW.OVER
    },
    "throwing mainhand": {
      under: EQUIPMENT.GLOVES.MAINHAND.THROWING.UNDER,
      over: EQUIPMENT.GLOVES.MAINHAND.THROWING.OVER
    },
    "2h mainhand crossbow": {
      under: EQUIPMENT.GLOVES.MAINHAND.TWO_HANDED_CROSSBOW.UNDER,
      over: EQUIPMENT.GLOVES.MAINHAND.TWO_HANDED_CROSSBOW.OVER
    }
  },
  offhand: {
    "1h offhand": {
      under: EQUIPMENT.GLOVES.OFFHAND.ONE_HANDED.UNDER,
      over: EQUIPMENT.GLOVES.OFFHAND.ONE_HANDED.OVER
    },
    "2h offhand": {
      under: EQUIPMENT.GLOVES.OFFHAND.TWO_HANDED.UNDER,
      over: EQUIPMENT.GLOVES.OFFHAND.TWO_HANDED.OVER
    },
    "1h offhand crossbow": {
      under: EQUIPMENT.GLOVES.OFFHAND.CROSSBOW.UNDER,
      over: EQUIPMENT.GLOVES.OFFHAND.CROSSBOW.OVER
    },
    "throwing offhand": {
      under: EQUIPMENT.GLOVES.OFFHAND.THROWING.UNDER,
      over: EQUIPMENT.GLOVES.OFFHAND.THROWING.OVER
    },
    "2h offhand crossbow": {
      under: EQUIPMENT.GLOVES.OFFHAND.TWO_HANDED_CROSSBOW.UNDER,
      over: EQUIPMENT.GLOVES.OFFHAND.TWO_HANDED_CROSSBOW.OVER
    }
  }
};

function resolveChestZIndex(
  poseKey: Pose,
  layer: CharacterStackLayer,
  chestHandSide?: ChestHandSide,
  zIndexContext?: EquipmentZIndexContext
): ZIndexLayerKey {
  if (layer !== "base") {
    throw new Error(`Chest only supports layer=base, got ${layer}`);
  }
  if (poseKey === "all") {
    return chestBodyLayerKey(zIndexContext?.tuckChestIntoPants);
  }

  const handSide: ChestHandSide =
    chestHandSide ??
    (handPoseBucketOf(poseKey) === "offhand" ? "offhand" : "mainhand");

  return chestLayerForHandBucket(handSide, poseKey);
}

function resolveSimpleSlotZIndex(
  equipSlot: string,
  layer: CharacterStackLayer,
  zIndexContext?: EquipmentZIndexContext
): ZIndexLayerKey {
  if (layer !== "base") {
    throw new Error(`${equipSlot} only supports layer=base, got ${layer}`);
  }
  if (equipSlot === "helm") {
    return EQUIPMENT.HELM;
  }
  if (equipSlot === "pants") {
    return EQUIPMENT.PANTS.UNTUCKED;
  }
  if (equipSlot === "boots") {
    return bootsLayerKey(zIndexContext?.tuckPantsIntoBoots);
  }
  throw new Error(`No z-index for equipSlot=${equipSlot}`);
}

function resolveHandWeaponZIndex(
  equipSlot: "main-hand" | "off-hand",
  poseKey: Pose,
  layer: CharacterStackLayer,
  equipType: string | undefined,
  twoHanded?: boolean
): ZIndexLayerKey {
  if (layer !== "over" && layer !== "under") {
    throw new Error(`Hand weapons use over/under layers, got ${layer}`);
  }
  const category = weaponCategory(equipType, poseKey, twoHanded);
  const table = equipSlot === "main-hand" ? MAIN_HAND_ZINDEX : OFF_HAND_ZINDEX;
  const key = table[category][layer];
  if (!key) {
    throw new Error(
      `No ${equipSlot} z-index for category=${category} layer=${layer} poseKey=${poseKey}`
    );
  }
  return key;
}

/** Whether a hand-weapon display row has a defined stack slot (e.g. default-1h has under only). */
export function supportsHandWeaponZIndex(
  equipSlot: "main-hand" | "off-hand",
  poseKey: Pose,
  layer: CharacterStackLayer | string,
  equipType: string | undefined,
  twoHanded?: boolean
): boolean {
  const normalized = normalizeStackLayer(String(layer));
  if (normalized !== "over" && normalized !== "under") {
    return false;
  }
  const category = weaponCategory(equipType, poseKey, twoHanded);
  const table = equipSlot === "main-hand" ? MAIN_HAND_ZINDEX : OFF_HAND_ZINDEX;
  return !!table[category][normalized];
}

function resolveGlovesZIndex(
  poseKey: Pose,
  layer: CharacterStackLayer
): ZIndexLayerKey {
  if (layer !== "over" && layer !== "under") {
    throw new Error(`Gloves use over/under layers, got ${layer}`);
  }
  const side = handPoseBucketOf(poseKey);
  const key = GLOVES_ZINDEX[side][poseKey]?.[layer];
  if (!key) {
    throw new Error(`No gloves z-index for layer=${layer} poseKey=${poseKey}`);
  }
  return key;
}

export function resolveEquipmentZIndexKey(input: ResolveEquipmentZIndexInput): ZIndexLayerKey {
  const layer = normalizeStackLayer(String(input.layer));
  if (!layer) {
    throw new Error(`Invalid stack layer: ${input.layer}`);
  }

  const slot = input.equipSlot;

  if (slot === "chest") {
    return resolveChestZIndex(
      input.poseKey,
      layer,
      input.chestHandSide,
      input.zIndexContext
    );
  }

  if (slot === "helm" || slot === "pants" || slot === "boots") {
    return resolveSimpleSlotZIndex(slot, layer, input.zIndexContext);
  }

  if (slot === "main-hand") {
    return resolveHandWeaponZIndex(
      "main-hand",
      input.poseKey,
      layer,
      input.equipType,
      input.twoHanded
    );
  }

  if (slot === "off-hand") {
    return resolveHandWeaponZIndex(
      "off-hand",
      input.poseKey,
      layer,
      input.equipType,
      input.twoHanded
    );
  }

  if (slot === "gloves") {
    return resolveGlovesZIndex(input.poseKey, layer);
  }

  throw new Error(`Unsupported equipSlot for z-index resolution: ${slot}`);
}

export function resolveEquipmentZIndex(input: ResolveEquipmentZIndexInput): number {
  const base = zIndexValue(resolveEquipmentZIndexKey(input));
  return applyGlovesEquippedOffset(base, input.equipSlot, input.zIndexContext);
}
