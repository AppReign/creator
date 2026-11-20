/** Mirrors dotv `CharacterBasePart*` catalogs for the upload UI. */
import { poseKeyToSlug } from "../utils/poseKeySlug";

export const BASE_PART_TYPES = [
  "head",
  "body",
  "mainHand",
  "offHand"
] as const;

export type BasePartType = (typeof BASE_PART_TYPES)[number];

export const BASE_PART_COLORS = ["white"] as const;

export type BasePartColor = (typeof BASE_PART_COLORS)[number];

const ALL_ONLY_POSE = ["all"] as const;

const MAIN_HAND_POSE_KEYS = [
  "1h mainhand",
  "2h mainhand",
  "2h mainhand crossbow",
  "1h mainhand crossbow",
  "throwing mainhand"
] as const;

const OFF_HAND_POSE_KEYS = [
  "1h offhand",
  "2h offhand",
  "2h offhand crossbow",
  "1h offhand crossbow",
  "throwing offhand"
] as const;

/** partType|poseKey|layerSlug → zIndex layer (must match dotv-common). */
const Z_INDEX_BY_LAYER_KEY: Record<string, string> = {
  "head|all|base": "BODY_HEAD_BASE",
  "body|all|base": "BODY_BODY_BASE",
  "mainHand|1h mainhand|under": "BODY_ONEHLARM",
  "mainHand|1h mainhand|over": "BODY_ONEHLFINGERS",
  "offHand|1h offhand|under": "BODY_ONEHRARM",
  "offHand|1h offhand|over": "BODY_ONEHRFINGERS",
  "mainHand|2h mainhand|under": "BODY_TWOHLARM",
  "mainHand|2h mainhand|over": "BODY_TWOHLFINGERS",
  "offHand|2h offhand|under": "BODY_TWOHRARM",
  "offHand|2h offhand|over": "BODY_TWOHRFINGERS",
  "mainHand|2h mainhand crossbow|under": "BODY_TWOHCBLARM",
  "mainHand|2h mainhand crossbow|over": "BODY_TWOHCBLFINGERS",
  "offHand|2h offhand crossbow|under": "BODY_TWOHCBRARM",
  "mainHand|1h mainhand crossbow|under": "BODY_ONEHCBLARM",
  "offHand|1h offhand crossbow|under": "BODY_ONEHCBRARM",
  "mainHand|throwing mainhand|under": "BODY_ARMLTHROWING",
  "offHand|throwing offhand|under": "BODY_ARMRTHROWING"
};

function layerKey(partType: string, poseKey: string, layerSlug: string): string {
  return `${partType}|${poseKey}|${layerSlug}`;
}

export function poseKeysForBasePartType(partType: BasePartType): readonly string[] {
  if (partType === "head" || partType === "body") {
    return ALL_ONLY_POSE;
  }
  if (partType === "mainHand") {
    return MAIN_HAND_POSE_KEYS;
  }
  return OFF_HAND_POSE_KEYS;
}

export function isValidBasePartLayer(
  partType: BasePartType,
  poseKey: string,
  layerSlug: string
): boolean {
  return layerKey(partType, poseKey, layerSlug) in Z_INDEX_BY_LAYER_KEY;
}

export function layerSlugsForBasePart(
  partType: BasePartType,
  poseKey: string
): string[] {
  const prefix = `${partType}|${poseKey}|`;
  return Object.keys(Z_INDEX_BY_LAYER_KEY)
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));
}

export function zIndexLayerForBasePart(
  partType: BasePartType,
  poseKey: string,
  layerSlug: string
): string | undefined {
  return Z_INDEX_BY_LAYER_KEY[layerKey(partType, poseKey, layerSlug)];
}

/** Expected CDN filename (matches dotv `CharacterBasePartImagePathBuilder`). */
export function buildBasePartFilename(
  gender: string,
  color: string,
  poseKey: string,
  layerSlug: string
): string {
  const prefix = `${gender.trim().toLowerCase()}-${color.trim().toLowerCase()}`;
  return `${prefix}-${poseKeyToSlug(poseKey)}-${layerSlug.trim().toLowerCase()}.png`;
}

export function buildBasePartObjectKey(
  gender: string,
  color: string,
  partType: BasePartType,
  poseKey: string,
  layerSlug: string
): string {
  const filename = buildBasePartFilename(gender, color, poseKey, layerSlug);
  return `character/${gender.trim().toLowerCase()}/${color.trim().toLowerCase()}/${partType}/${filename}`;
}
