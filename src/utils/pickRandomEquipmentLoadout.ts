import { EquipSlot } from "../config/equipSlots";
import { ConfigPartEquipment } from "../interfaces/Config";
import {
  getEquipmentPartsForSlot,
  weaponOccupiesBothHands
} from "./equipmentPose";

const ARMOR_SLOTS: EquipSlot[] = ["helm", "chest", "pants", "boots"];

/**
 * Per-slot probability ∈ [0, 1] of leaving that slot empty.
 * (Main-hand 2h mainhand / 2h mainhand crossbow still forces an empty off-hand.)
 */
export const DEFAULT_UNEQUIP_CHANCE = 0.25;

function clamp01(n: number): number {
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function sample<T>(candidates: T[]): T {
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** With probability `unequipChance`, leave slot empty; else uniform pick from `candidates`. */
function pickOrSkip<T>(
  candidates: T[],
  unequipChance: number
): T | undefined {
  if (candidates.length === 0) return undefined;
  if (Math.random() < unequipChance) return undefined;
  return sample(candidates);
}

/**
 * Builds a valid equipment list matching creator rules:
 * — only catalog entries
 * — at most one item per `equipSlot`
 * — each slot may stay empty (`unequipChance`)
 * — 2h main-hand excludes off-hand
 */
export function pickRandomEquipmentLoadout(
  catalog: ConfigPartEquipment[],
  unequipChance: number = DEFAULT_UNEQUIP_CHANCE
): ConfigPartEquipment[] {
  const p = clamp01(unequipChance);
  const picks: ConfigPartEquipment[] = [];

  const mainCandidates = catalog.filter((part) => part.equipSlot === "main-hand");
  const main = pickOrSkip(mainCandidates, p);
  if (main) picks.push(main);

  const mainIs2h = main != null && weaponOccupiesBothHands(main);

  if (!mainIs2h) {
    const offCandidates = catalog.filter((part) => part.equipSlot === "off-hand");
    const offSafe = offCandidates.filter(
      (part) => !weaponOccupiesBothHands(part)
    );
    const pool =
      main != null
        ? offSafe.length > 0
          ? offSafe
          : offCandidates
        : offCandidates;
    const off = pickOrSkip(pool, p);
    if (off) picks.push(off);
  }

  for (const slot of ARMOR_SLOTS) {
    const options = getEquipmentPartsForSlot(slot, catalog, picks);
    const choice = pickOrSkip(options, p);
    if (choice) picks.push(choice);
  }

  return picks.map((part) => ({ ...part }));
}
