import { resolveEquipmentImagesForHandPose } from "./equipmentDisplay";
import { derivePoseFromEquipment } from "../utils/equipmentPose";
import { zIndexValue } from "../layers/zIndex";
import { EQUIPMENT } from "../layers/equipmentLayer";
import { BODY } from "../layers/baseLayer";
import type { ConfigPartEquipment, ItemEquip } from "../interfaces/Config";

function mockChestItem(): ItemEquip {
  return {
    id: "e.test-chest",
    name: "Test Chest",
    equipSlot: "chest",
    equipType: "medium-chest",
    characterDisplay: {
      perSex: {
        male: {
          all: [{ filename: "test-chest-all-base-male.png", layer: "base" }],
          "1h mainhand": [
            { filename: "test-chest-idle-mainhand-overlay-male.png", layer: "base" }
          ],
          "1h offhand": [
            { filename: "test-chest-idle-offhand-overlay-male.png", layer: "base" }
          ],
          "throwing mainhand": [
            { filename: "test-chest-throw-mh-overlay-male.png", layer: "base" }
          ],
          "throwing offhand": [
            { filename: "test-chest-throw-oh-overlay-male.png", layer: "base" }
          ]
        }
      }
    }
  };
}

function mockGlovesItem(): ItemEquip {
  return {
    id: "e.test-gloves",
    name: "Test Gloves",
    equipSlot: "gloves",
    equipType: "medium-gloves",
    characterDisplay: {
      perSex: {
        male: {
          "1h mainhand": [
            { filename: "test-gloves-1h-mh-under-male.png", layer: "under" },
            { filename: "test-gloves-1h-mh-over-male.png", layer: "over" }
          ],
          "1h offhand": [
            { filename: "test-gloves-1h-oh-under-male.png", layer: "under" },
            { filename: "test-gloves-1h-oh-over-male.png", layer: "over" }
          ],
          "2h mainhand": [
            { filename: "test-gloves-2h-mh-under-male.png", layer: "under" }
          ],
          "2h offhand": [
            { filename: "test-gloves-2h-oh-under-male.png", layer: "under" }
          ],
          "throwing mainhand": [
            { filename: "test-gloves-throw-mh-under-male.png", layer: "under" }
          ]
        }
      }
    }
  };
}

function mainHandDarts(): ConfigPartEquipment {
  return {
    name: "Test Darts",
    equipSlot: "main-hand",
    equipType: "darts",
    pose: "all",
    equipSet: "test",
    images: []
  };
}

function offHandDarts(): ConfigPartEquipment {
  return {
    name: "Test Darts",
    equipSlot: "off-hand",
    equipType: "darts",
    pose: "all",
    equipSet: "test",
    images: []
  };
}

function mainHandTwoHanded(): ConfigPartEquipment {
  return {
    name: "Test Polearm",
    equipSlot: "main-hand",
    equipType: "polearm",
    twoHanded: true,
    pose: "all",
    equipSet: "test",
    images: []
  };
}

describe("resolveEquipmentImagesForHandPose (chest)", () => {
  it("loads throwing mainhand overlay from the matching characterDisplay bucket", () => {
    const equipped = [mainHandDarts()];
    const handPose = derivePoseFromEquipment(equipped);
    const images = resolveEquipmentImagesForHandPose(
      mockChestItem(),
      handPose,
      "male",
      equipped
    );

    expect(images.map((img) => img.filename)).toEqual([
      "test-chest-all-base-male.png",
      "test-chest-throw-mh-overlay-male.png",
      "test-chest-idle-offhand-overlay-male.png"
    ]);
    const byFilename = Object.fromEntries(
      images
        .filter((img): img is { filename: string; zIndex: number } => "zIndex" in img)
        .map((img) => [img.filename, img.zIndex])
    );
    expect(byFilename["test-chest-throw-mh-overlay-male.png"]).toBe(
      zIndexValue(EQUIPMENT.CHEST.MAINHAND.THROWING)
    );
  });

  it("loads throwing offhand overlay from the matching characterDisplay bucket", () => {
    const equipped = [offHandDarts()];
    const handPose = derivePoseFromEquipment(equipped);
    expect(handPose).toEqual({
      mainHandPose: "1h mainhand",
      offHandPose: "throwing offhand"
    });

    const images = resolveEquipmentImagesForHandPose(
      mockChestItem(),
      handPose,
      "male",
      equipped
    );

    expect(images.map((img) => img.filename)).toEqual([
      "test-chest-all-base-male.png",
      "test-chest-idle-mainhand-overlay-male.png",
      "test-chest-throw-oh-overlay-male.png"
    ]);
    const byFilename = Object.fromEntries(
      images
        .filter((img): img is { filename: string; zIndex: number } => "zIndex" in img)
        .map((img) => [img.filename, img.zIndex])
    );
    expect(byFilename["test-chest-throw-oh-overlay-male.png"]).toBe(
      zIndexValue(EQUIPMENT.CHEST.OFFHAND.THROWING)
    );
    expect(byFilename["test-chest-throw-oh-overlay-male.png"]).toBeGreaterThan(
      zIndexValue(EQUIPMENT.CHEST.BODY.UNTUCKED)
    );
  });

  it("loads both idle overlays when no hand weapons are equipped", () => {
    const handPose = derivePoseFromEquipment([]);
    const images = resolveEquipmentImagesForHandPose(
      mockChestItem(),
      handPose,
      "male",
      []
    );

    expect(images.map((img) => img.filename)).toEqual([
      "test-chest-all-base-male.png",
      "test-chest-idle-mainhand-overlay-male.png",
      "test-chest-idle-offhand-overlay-male.png"
    ]);
    const byFilename = Object.fromEntries(
      images
        .filter((img): img is { filename: string; zIndex: number } => "zIndex" in img)
        .map((img) => [img.filename, img.zIndex])
    );
    expect(byFilename["test-chest-idle-offhand-overlay-male.png"]).toBe(
      zIndexValue(EQUIPMENT.CHEST.OFFHAND.ONE_HANDED)
    );
    expect(byFilename["test-chest-idle-offhand-overlay-male.png"]).toBeGreaterThan(
      zIndexValue(EQUIPMENT.CHEST.BODY.UNTUCKED)
    );
    expect(byFilename["test-chest-idle-offhand-overlay-male.png"]).toBeGreaterThanOrEqual(
      zIndexValue(BODY.OFFHAND.ONE_HANDED.UNDER)
    );
  });
});

describe("resolveEquipmentImagesForHandPose (gloves)", () => {
  it("loads idle mainhand and offhand stance buckets (no all)", () => {
    const handPose = derivePoseFromEquipment([]);
    const images = resolveEquipmentImagesForHandPose(
      mockGlovesItem(),
      handPose,
      "male",
      []
    );

    expect(images.map((img) => img.filename)).toEqual([
      "test-gloves-1h-mh-under-male.png",
      "test-gloves-1h-mh-over-male.png",
      "test-gloves-1h-oh-under-male.png",
      "test-gloves-1h-oh-over-male.png"
    ]);
    const byFilename = Object.fromEntries(
      images
        .filter((img): img is { filename: string; zIndex: number } => "zIndex" in img)
        .map((img) => [img.filename, img.zIndex])
    );
    expect(byFilename["test-gloves-1h-mh-under-male.png"]).toBe(
      zIndexValue(EQUIPMENT.GLOVES.MAINHAND.ONE_HANDED.UNDER)
    );
    expect(byFilename["test-gloves-1h-oh-over-male.png"]).toBe(
      zIndexValue(EQUIPMENT.GLOVES.OFFHAND.ONE_HANDED.OVER)
    );
  });

  it("loads throwing mainhand + idle offhand when darts are equipped", () => {
    const equipped = [mainHandDarts()];
    const handPose = derivePoseFromEquipment(equipped);
    const images = resolveEquipmentImagesForHandPose(
      mockGlovesItem(),
      handPose,
      "male",
      equipped
    );

    expect(images.map((img) => img.filename)).toEqual([
      "test-gloves-throw-mh-under-male.png",
      "test-gloves-1h-oh-under-male.png",
      "test-gloves-1h-oh-over-male.png"
    ]);
    const byFilename = Object.fromEntries(
      images
        .filter((img): img is { filename: string; zIndex: number } => "zIndex" in img)
        .map((img) => [img.filename, img.zIndex])
    );
    expect(byFilename["test-gloves-throw-mh-under-male.png"]).toBe(
      zIndexValue(EQUIPMENT.GLOVES.MAINHAND.THROWING.UNDER)
    );
  });

  it("loads 2h mainhand and offhand stance buckets for two-handed weapons", () => {
    const equipped = [mainHandTwoHanded()];
    const handPose = derivePoseFromEquipment(equipped);
    expect(handPose).toEqual({
      mainHandPose: "2h mainhand",
      offHandPose: "2h offhand"
    });

    const images = resolveEquipmentImagesForHandPose(
      mockGlovesItem(),
      handPose,
      "male",
      equipped
    );

    expect(images.map((img) => img.filename)).toEqual([
      "test-gloves-2h-mh-under-male.png",
      "test-gloves-2h-oh-under-male.png"
    ]);
    const byFilename = Object.fromEntries(
      images
        .filter((img): img is { filename: string; zIndex: number } => "zIndex" in img)
        .map((img) => [img.filename, img.zIndex])
    );
    expect(byFilename["test-gloves-2h-mh-under-male.png"]).toBe(
      zIndexValue(EQUIPMENT.GLOVES.MAINHAND.TWO_HANDED.UNDER)
    );
    expect(byFilename["test-gloves-2h-oh-under-male.png"]).toBe(
      zIndexValue(EQUIPMENT.GLOVES.OFFHAND.TWO_HANDED.UNDER)
    );
  });
});
