import type { EquipSlot } from "../config/equipSlots";
import type { ConfigPartEquipment } from "../interfaces/Config";
import { BODY } from "./baseLayer";
import { EQUIPMENT } from "./equipmentLayer";
import { zIndexValue, type ZIndexLayerKey } from "./zIndex";

/**
 * Runtime stacking context on top of the canonical {@link zIndex} table.
 * — Gloves: numeric offset so glove under clears bare-hand over (weapon lifts with gloves).
 * — Tuck: swap layer keys for chest→pants and pants→boots.
 */
export type EquipmentZIndexContext = {
  glovesEquipped?: boolean;
  tuckChestIntoPants?: boolean;
  tuckPantsIntoBoots?: boolean;
};

/** Body hand bands that have both under + over (used to size the gloves lift). */
const BODY_HAND_UNDER_OVER: readonly [ZIndexLayerKey, ZIndexLayerKey][] = [
  [BODY.MAINHAND.ONE_HANDED.UNDER, BODY.MAINHAND.ONE_HANDED.OVER],
  [BODY.MAINHAND.TWO_HANDED.UNDER, BODY.MAINHAND.TWO_HANDED.OVER],
  [BODY.MAINHAND.TWO_HANDED_CROSSBOW.UNDER, BODY.MAINHAND.TWO_HANDED_CROSSBOW.OVER],
  [BODY.OFFHAND.ONE_HANDED.UNDER, BODY.OFFHAND.ONE_HANDED.OVER],
  [BODY.OFFHAND.TWO_HANDED.UNDER, BODY.OFFHAND.TWO_HANDED.OVER]
];

/**
 * Lift gloves + hand weapons by this much when gloves are equipped so
 * {@code gloveUnder > bodyOver} for every under/over hand band.
 */
export const GLOVES_EQUIPPED_Z_OFFSET = Math.max(
  ...BODY_HAND_UNDER_OVER.map(
    ([under, over]) => zIndexValue(over) - zIndexValue(under) + 1
  )
);

export function hasGlovesEquipped(equipped: ConfigPartEquipment[]): boolean {
  return equipped.some((part) => part.equipSlot === "gloves");
}

export function equipmentZIndexContextFromEquipped(
  equipped: ConfigPartEquipment[],
  overrides: Omit<EquipmentZIndexContext, "glovesEquipped"> = {}
): EquipmentZIndexContext {
  return {
    glovesEquipped: hasGlovesEquipped(equipped),
    ...overrides
  };
}

/** Slots whose base z moves with the gloves grip band. */
export function slotGetsGlovesOffset(equipSlot: EquipSlot | string): boolean {
  return (
    equipSlot === "gloves" ||
    equipSlot === "main-hand" ||
    equipSlot === "off-hand"
  );
}

export function applyGlovesEquippedOffset(
  baseZ: number,
  equipSlot: EquipSlot | string,
  ctx: EquipmentZIndexContext | undefined
): number {
  if (!ctx?.glovesEquipped || !slotGetsGlovesOffset(equipSlot)) {
    return baseZ;
  }
  return baseZ + GLOVES_EQUIPPED_Z_OFFSET;
}

export function chestBodyLayerKey(
  tuckChestIntoPants: boolean | undefined
): ZIndexLayerKey {
  return tuckChestIntoPants
    ? EQUIPMENT.CHEST.BODY.TUCKED
    : EQUIPMENT.CHEST.BODY.UNTUCKED;
}

/**
 * Pants into boots → boots draw over pants ({@link EQUIPMENT.BOOTS.UNTUCKED}).
 * Untucked → boots under pant legs ({@link EQUIPMENT.BOOTS.TUCKED}).
 */
export function bootsLayerKey(
  tuckPantsIntoBoots: boolean | undefined
): ZIndexLayerKey {
  return tuckPantsIntoBoots
    ? EQUIPMENT.BOOTS.UNTUCKED
    : EQUIPMENT.BOOTS.TUCKED;
}
