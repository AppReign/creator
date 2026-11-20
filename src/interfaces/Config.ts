import { FULL_POSE_KEYS } from "../config/characterPoseCatalog";
import { EquipSlot } from "../config/equipSlots";
import { CharacterStackLayer } from "../layers/characterStackLayer";
import { ZIndexLayerKey } from "../layers/zIndex";

/** One drawable row inside `characterDisplay`; `layer` resolves via `resolveEquipmentZIndex`. */
export type CharacterDisplayImageRow = {
  filename: string;
  layer: CharacterStackLayer;
};

export type Pose = (typeof FULL_POSE_KEYS)[number];

export type CharacterSex = "male" | "female";

/** `main-hand` / `off-hand`: only the `all` bucket on `male`. */
export type MaleCharacterDisplayAllOnlyBucket = {
  all: CharacterDisplayImageRow[];
};

/** Boots, pants, helm: only the `all` bucket on `male` (no per-stance arm variants). */
export type CharacterDisplayAllOnly = {
  perSex: {
    male: { all: CharacterDisplayImageRow[] };
  };
};

/** `equipSlot: "chest"`: stance pose buckets on `male`. */
export type CharacterDisplayChest = {
  perSex: {
    male: Partial<Record<Pose, CharacterDisplayImageRow[]>>;
    female?: Partial<Record<Pose, CharacterDisplayImageRow[]>>;
  };
};

/** `main-hand` / `off-hand`: only the `all` bucket (z-index from equip type, not stance). */
export type CharacterDisplayHand = {
  perSex: {
    male: MaleCharacterDisplayAllOnlyBucket;
  };
};

/** Union of all slot-specific registry display shapes. */
export type CharacterDisplay =
  | CharacterDisplayChest
  | CharacterDisplayAllOnly
  | CharacterDisplayHand;

type EquipType =
  | "aerial"
  | "aquatic"
  | "bow"
  | "buckler-shield"
  | "crossbow"
  | "dagger"
  | "darts"
  | "drake"
  | "heavy-boots"
  | "heavy-chest"
  | "heavy-gloves"
  | "heavy-helm"
  | "heavy-pants"
  | "impact"
  | "inorganic"
  | "light-boots"
  | "light-chest"
  | "light-gloves"
  | "light-helm"
  | "light-pants"
  | "mace"
  | "medium-boots"
  | "medium-chest"
  | "medium-gloves"
  | "medium-helm"
  | "medium-pants"
  | "medium-shield"
  | "orb"
  | "polearm"
  | "ring"
  | "rod"
  | "staff"
  | "steed"
  | "sword"
  | "terrestrial"
  | "thrown"
  | "tower-shield"
  | "wand"
  | "whip";

/**
 * One equipment row loaded from the game API (`POST /api/data/items/batch`).
 * `equipSet` for catalog grouping comes from `vanity.vanitySet` on the API item.
 * Omit `characterDisplay` until art is wired (items without it are skipped by `buildEquipmentCatalog`).
 */
export type ItemEquip = {
  id: string;
  name: string;
  equipSlot: EquipSlot;
  equipType?: EquipType | string;
  twoHanded?: boolean;
  imagePath?: string;
  characterDisplay?: CharacterDisplay;
};

export interface ConfigPartType {
  id: number;
  name: string;
}

/** Equipment pipeline resolves numeric `zIndex` from equipment `layer`; base body uses `layer` only (see `layers/baseLayer.ts`). */
export type ConfigImage =
  | {
      filename: string;
      zIndex: number;
      src?: string;
    }
  | {
      filename: string;
      layer: ZIndexLayerKey;
      src?: string;
    };

export interface ConfigPart {
  name: string;
  images: ConfigImage[];
  pose: Pose;
}

export interface ConfigPartEquipment extends ConfigPart {
  equipSlot: EquipSlot;
  /** Optional: e.g. "sword", "bow" (prod may use strings outside this union). */
  equipType?: EquipType | string;
  /** Named vanity set grouping (from API `vanity.vanitySet`). */
  equipSet: string;
  twoHanded?: boolean;
  /** Item id (`e.*`) used to resolve drawable layers from the API catalog. */
  equipmentRegistryKey?: string;
}

export default interface Config {
  partTypes: ConfigPartType[];
  parts: ConfigPart[];
}
