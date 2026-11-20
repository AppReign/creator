import { resolveEquipmentZIndex, chestLayerForHandBucket } from "./resolveEquipmentZIndex";
import { zIndexValue } from "./zIndex";
import { EQUIPMENT } from "./equipmentLayer";

describe("resolveEquipmentZIndex", () => {
  it("resolves chest all base to untucked body", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "chest",
        poseKey: "all",
        layer: "base"
      })
    ).toBe(zIndexValue(EQUIPMENT.CHEST.BODY.UNTUCKED));
  });

  it("resolves chest 2h base to mainhand two-handed overlay", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "chest",
        poseKey: "2h mainhand",
        layer: "base"
      })
    ).toBe(zIndexValue(EQUIPMENT.CHEST.MAINHAND.TWO_HANDED));
  });

  it("maps chest pose keys to the matching hand overlay", () => {
    expect(chestLayerForHandBucket("mainhand", "1h mainhand")).toBe(
      EQUIPMENT.CHEST.MAINHAND.ONE_HANDED
    );
    expect(chestLayerForHandBucket("offhand", "1h offhand")).toBe(
      EQUIPMENT.CHEST.OFFHAND.ONE_HANDED
    );
    expect(chestLayerForHandBucket("mainhand", "throwing mainhand")).toBe(
      EQUIPMENT.CHEST.MAINHAND.THROWING
    );
    expect(chestLayerForHandBucket("offhand", "throwing offhand")).toBe(
      EQUIPMENT.CHEST.OFFHAND.THROWING
    );
    expect(chestLayerForHandBucket("mainhand", "2h mainhand")).toBe(
      EQUIPMENT.CHEST.MAINHAND.TWO_HANDED
    );
    expect(chestLayerForHandBucket("offhand", "2h offhand")).toBe(
      EQUIPMENT.CHEST.OFFHAND.TWO_HANDED
    );
  });

  it("uses chestHandSide for composed chest buckets", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "chest",
        poseKey: "throwing mainhand",
        layer: "base",
        chestHandSide: "mainhand"
      })
    ).toBe(zIndexValue(EQUIPMENT.CHEST.MAINHAND.THROWING));
    expect(
      resolveEquipmentZIndex({
        equipSlot: "chest",
        poseKey: "1h offhand",
        layer: "base",
        chestHandSide: "offhand"
      })
    ).toBe(zIndexValue(EQUIPMENT.CHEST.OFFHAND.ONE_HANDED));
  });

  it("resolves main-hand crossbow over/under at all pose", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "main-hand",
        poseKey: "all",
        layer: "under",
        equipType: "crossbow"
      })
    ).toBe(zIndexValue(EQUIPMENT.MAINHAND.ONE_HANDED.CROSSBOW.UNDER));
    expect(
      resolveEquipmentZIndex({
        equipSlot: "main-hand",
        poseKey: "all",
        layer: "over",
        equipType: "crossbow"
      })
    ).toBe(zIndexValue(EQUIPMENT.MAINHAND.ONE_HANDED.CROSSBOW.OVER));
  });

  it("resolves main-hand default 1h under at all pose", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "main-hand",
        poseKey: "all",
        layer: "under",
        equipType: "sword"
      })
    ).toBe(zIndexValue(EQUIPMENT.MAINHAND.ONE_HANDED.DEFAULT.UNDER));
  });

  it("resolves off-hand shield under", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "off-hand",
        poseKey: "all",
        layer: "under",
        equipType: "buckler-shield"
      })
    ).toBe(zIndexValue(EQUIPMENT.OFFHAND.ONE_HANDED.SHIELD.UNDER));
  });

  it("resolves boots base to tucked (under pant legs) by default", () => {
    expect(
      resolveEquipmentZIndex({
        equipSlot: "boots",
        poseKey: "all",
        layer: "base"
      })
    ).toBe(zIndexValue(EQUIPMENT.BOOTS.TUCKED));
  });

  it("rejects non-base layer on chest", () => {
    expect(() =>
      resolveEquipmentZIndex({
        equipSlot: "chest",
        poseKey: "all",
        layer: "over"
      })
    ).toThrow(/Chest only supports layer=base/);
  });
});
