import {
  applyGlovesEquippedOffset,
  bootsLayerKey,
  chestBodyLayerKey,
  GLOVES_EQUIPPED_Z_OFFSET,
  equipmentZIndexContextFromEquipped
} from "./zIndexOverrides";
import { resolveEquipmentZIndex } from "./resolveEquipmentZIndex";
import { zIndexValue } from "./zIndex";
import { EQUIPMENT } from "./equipmentLayer";
import { BODY } from "./baseLayer";
import type { ConfigPartEquipment } from "../interfaces/Config";

describe("zIndexOverrides", () => {
  it("sizes gloves offset so glove under clears body over for 1h mainhand", () => {
    const bodyUnder = zIndexValue(BODY.MAINHAND.ONE_HANDED.UNDER);
    const bodyOver = zIndexValue(BODY.MAINHAND.ONE_HANDED.OVER);
    const gloveUnder = zIndexValue(EQUIPMENT.GLOVES.MAINHAND.ONE_HANDED.UNDER);
    expect(gloveUnder).toBe(bodyUnder);
    expect(gloveUnder + GLOVES_EQUIPPED_Z_OFFSET).toBeGreaterThan(bodyOver);
  });

  it("lifts gloves and hand weapons when gloves are equipped", () => {
    const base = zIndexValue(EQUIPMENT.GLOVES.MAINHAND.ONE_HANDED.UNDER);
    expect(
      applyGlovesEquippedOffset(base, "gloves", { glovesEquipped: true })
    ).toBe(base + GLOVES_EQUIPPED_Z_OFFSET);
    expect(
      applyGlovesEquippedOffset(base, "main-hand", { glovesEquipped: true })
    ).toBe(base + GLOVES_EQUIPPED_Z_OFFSET);
    expect(
      applyGlovesEquippedOffset(base, "chest", { glovesEquipped: true })
    ).toBe(base);
    expect(
      applyGlovesEquippedOffset(base, "gloves", { glovesEquipped: false })
    ).toBe(base);
  });

  it("selects tucked chest and boots layer keys for pants-into-boots", () => {
    expect(chestBodyLayerKey(false)).toBe(EQUIPMENT.CHEST.BODY.UNTUCKED);
    expect(chestBodyLayerKey(true)).toBe(EQUIPMENT.CHEST.BODY.TUCKED);
    // pants over boots (default)
    expect(bootsLayerKey(false)).toBe(EQUIPMENT.BOOTS.TUCKED);
    // pants into boots
    expect(bootsLayerKey(true)).toBe(EQUIPMENT.BOOTS.UNTUCKED);
  });

  it("derives glovesEquipped from equipped parts", () => {
    const gloves: ConfigPartEquipment = {
      name: "Gloves",
      equipSlot: "gloves",
      pose: "1h mainhand",
      equipSet: "test",
      images: []
    };
    expect(equipmentZIndexContextFromEquipped([gloves]).glovesEquipped).toBe(
      true
    );
    expect(equipmentZIndexContextFromEquipped([]).glovesEquipped).toBe(false);
  });
});

describe("resolveEquipmentZIndex with overrides", () => {
  it("uses tucked chest body when tuckChestIntoPants is set", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "chest",
        poseKey: "all",
        layer: "base",
        zIndexContext: { tuckChestIntoPants: true }
      })
    ).toBe(zIndexValue(EQUIPMENT.CHEST.BODY.TUCKED));
  });

  it("uses untucked boots (over pants) when tuckPantsIntoBoots is set", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "boots",
        poseKey: "all",
        layer: "base",
        zIndexContext: { tuckPantsIntoBoots: true }
      })
    ).toBe(zIndexValue(EQUIPMENT.BOOTS.UNTUCKED));
  });

  it("uses tucked boots (under pant legs) by default", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "boots",
        poseKey: "all",
        layer: "base"
      })
    ).toBe(zIndexValue(EQUIPMENT.BOOTS.TUCKED));
  });

  it("offsets glove and weapon z when glovesEquipped", () => {
    const bareWeapon = resolveEquipmentZIndex({
      equipSlot: "main-hand",
      poseKey: "all",
      layer: "under",
      equipType: "sword"
    });
    const glovedWeapon = resolveEquipmentZIndex({
      equipSlot: "main-hand",
      poseKey: "all",
      layer: "under",
      equipType: "sword",
      zIndexContext: { glovesEquipped: true }
    });
    expect(glovedWeapon).toBe(bareWeapon + GLOVES_EQUIPPED_Z_OFFSET);

    const bareGlove = resolveEquipmentZIndex({
      equipSlot: "gloves",
      poseKey: "1h mainhand",
      layer: "under"
    });
    const glovedGlove = resolveEquipmentZIndex({
      equipSlot: "gloves",
      poseKey: "1h mainhand",
      layer: "under",
      zIndexContext: { glovesEquipped: true }
    });
    expect(glovedGlove).toBe(bareGlove + GLOVES_EQUIPPED_Z_OFFSET);
    expect(glovedGlove).toBeGreaterThan(
      zIndexValue(BODY.MAINHAND.ONE_HANDED.OVER)
    );
  });
});
