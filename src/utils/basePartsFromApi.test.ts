import { resolveBasePartsFromVariant } from "./basePartsFromApi";
import { derivePoseFromEquipment } from "./equipmentPose";
import type { ConfigPartEquipment } from "../interfaces/Config";
import type { CharacterBasePartsVariant } from "../types/characterBaseParts";

const CDN = "https://cdn.example.com";

function mockMaleWhiteVariant(): CharacterBasePartsVariant {
  return {
    id: "male-white",
    gender: "male",
    color: "white",
    parts: {
      head: { all: [{ filename: "male-white-all-base.png", layer: "BODY_HEAD_BASE" }] },
      body: { all: [{ filename: "male-white-all-base.png", layer: "BODY_BODY_BASE" }] },
      mainHand: {
        "1h mainhand": [
          { filename: "male-white-1h-mainhand-under.png", layer: "BODY_ONEHLARM" },
          { filename: "male-white-1h-mainhand-over.png", layer: "BODY_ONEHLFINGERS" }
        ],
        "2h mainhand": [
          { filename: "male-white-2h-mainhand-under.png", layer: "BODY_TWOHLARM" },
          { filename: "male-white-2h-mainhand-over.png", layer: "BODY_TWOHLFINGERS" }
        ]
      },
      offHand: {
        "1h offhand": [
          { filename: "male-white-1h-offhand-under.png", layer: "BODY_ONEHRARM" },
          { filename: "male-white-1h-offhand-over.png", layer: "BODY_ONEHRFINGERS" }
        ],
        "2h offhand": [{ filename: "male-white-2h-offhand-under.png", layer: "BODY_TWOHRARM" }]
      }
    }
  };
}

function rodEquipped(): ConfigPartEquipment[] {
  return [
    {
      name: "Chandler's Rod",
      equipSlot: "main-hand",
      equipType: "rod",
      pose: "all",
      equipSet: "chandlers",
      images: []
    }
  ];
}

describe("resolveBasePartsFromVariant", () => {
  it("includes main-hand base arm layers for 1h rod (catalog pose=all)", () => {
    const variant = mockMaleWhiteVariant();
    const handPose = derivePoseFromEquipment(rodEquipped());
    const parts = resolveBasePartsFromVariant(variant, handPose, CDN);

    const filenames = parts.flatMap((part) => part.images.map((img) => img.filename));

    expect(filenames).toContain("male-white-1h-mainhand-under.png");
    expect(filenames).toContain("male-white-1h-mainhand-over.png");
    expect(filenames).toContain("male-white-1h-offhand-under.png");
    expect(filenames).toContain("male-white-1h-offhand-over.png");
  });

  it("does not look up mainHand[all] when equipping catalog pose=all weapon", () => {
    const variant = mockMaleWhiteVariant();
    variant.parts.mainHand = {
      all: [{ filename: "wrong-mainhand-all.png", layer: "BODY_ONEHLARM" }],
      "1h mainhand": [
        { filename: "male-white-1h-mainhand-under.png", layer: "BODY_ONEHLARM" }
      ]
    };

    const parts = resolveBasePartsFromVariant(
      variant,
      derivePoseFromEquipment(rodEquipped()),
      CDN
    );
    const filenames = parts.flatMap((part) => part.images.map((img) => img.filename));

    expect(filenames).toContain("male-white-1h-mainhand-under.png");
    expect(filenames).not.toContain("wrong-mainhand-all.png");
  });
});
