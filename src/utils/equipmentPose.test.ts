import {
  bodyStancePoseForHandItem,
  deriveBaseArmBundlePoses,
  deriveChestWeaponStances,
  derivePoseFromEquipment,
  weaponOccupiesBothHands
} from "./equipmentPose";
import type { ConfigPartEquipment } from "../interfaces/Config";

function handItem(
  overrides: Partial<ConfigPartEquipment> & Pick<ConfigPartEquipment, "equipSlot" | "name">
): ConfigPartEquipment {
  return {
    pose: "all",
    equipSet: "test",
    images: [],
    ...overrides
  };
}

describe("bodyStancePoseForHandItem", () => {
  it.each([
    ["main-hand", "rod", false, "1h mainhand"],
    ["main-hand", "sword", false, "1h mainhand"],
    ["main-hand", "polearm", true, "2h mainhand"],
    ["main-hand", "crossbow", false, "1h mainhand crossbow"],
    ["main-hand", "crossbow", true, "2h mainhand crossbow"],
    ["main-hand", "darts", false, "throwing mainhand"],
    ["off-hand", "buckler-shield", false, "1h offhand"],
    ["off-hand", "crossbow", false, "1h offhand crossbow"],
    ["off-hand", "darts", false, "throwing offhand"]
  ] as const)(
    "maps %s %s (twoHanded=%s) → %s",
    (slot, equipType, twoHanded, expected) => {
      expect(
        bodyStancePoseForHandItem(
          handItem({
            name: "test",
            equipSlot: slot,
            equipType,
            twoHanded
          })
        )
      ).toBe(expected);
    }
  );

  it("does not map catalog pose=all to body stance all", () => {
    expect(
      bodyStancePoseForHandItem(
        handItem({
          name: "Chandler's Rod",
          equipSlot: "main-hand",
          equipType: "rod",
          pose: "all"
        })
      )
    ).not.toBe("all");
  });

  it("preserves explicit non-all catalog pose on hand items", () => {
    expect(
      bodyStancePoseForHandItem(
        handItem({
          name: "legacy",
          equipSlot: "main-hand",
          equipType: "sword",
          pose: "2h mainhand"
        })
      )
    ).toBe("2h mainhand");
  });
});

describe("derivePoseFromEquipment", () => {
  it("maps 1h main-hand rod + empty off-hand to idle pair (regression: Chandler's Rod)", () => {
    const rod = handItem({
      name: "Chandler's Rod",
      equipSlot: "main-hand",
      equipType: "rod",
      twoHanded: false
    });

    expect(derivePoseFromEquipment([rod])).toEqual({
      mainHandPose: "1h mainhand",
      offHandPose: "1h offhand"
    });
  });

  it("never derives body stance all from hand weapons with catalog pose=all", () => {
    const rod = handItem({
      name: "Rod",
      equipSlot: "main-hand",
      equipType: "rod"
    });
    const { mainHandPose, offHandPose } = derivePoseFromEquipment([rod]);
    expect(mainHandPose).not.toBe("all");
    expect(offHandPose).not.toBe("all");
  });

  it("maps twoHanded main-hand weapon to side-specific 2h poses when off-hand empty", () => {
    const polearm = handItem({
      name: "Great Pole",
      equipSlot: "main-hand",
      equipType: "polearm",
      twoHanded: true
    });

    expect(derivePoseFromEquipment([polearm])).toEqual({
      mainHandPose: "2h mainhand",
      offHandPose: "2h offhand"
    });
  });

  it("keeps independent stances for 1h sword + shield", () => {
    const sword = handItem({
      name: "Blade",
      equipSlot: "main-hand",
      equipType: "sword"
    });
    const shield = handItem({
      name: "Shield",
      equipSlot: "off-hand",
      equipType: "buckler-shield"
    });

    expect(derivePoseFromEquipment([sword, shield])).toEqual({
      mainHandPose: "1h mainhand",
      offHandPose: "1h offhand"
    });
  });

  it("uses idle defaults when no hand weapons equipped", () => {
    expect(derivePoseFromEquipment([])).toEqual({
      mainHandPose: "1h mainhand",
      offHandPose: "1h offhand"
    });
  });
});

describe("deriveBaseArmBundlePoses", () => {
  it("selects 1h mainhand + 1h offhand bundles for 1h rod loadout", () => {
    const rod = handItem({
      name: "Rod",
      equipSlot: "main-hand",
      equipType: "rod"
    });

    expect(deriveBaseArmBundlePoses(derivePoseFromEquipment([rod]))).toEqual({
      mainHandPose: "1h mainhand",
      offHandPose: "1h offhand"
    });
  });

  it("keeps separate 2h mainhand and 2h offhand bundles when both hands share 2h stance", () => {
    const polearm = handItem({
      name: "Pole",
      equipSlot: "main-hand",
      equipType: "polearm",
      twoHanded: true
    });
    const handPose = derivePoseFromEquipment([polearm]);

    expect(handPose).toEqual({
      mainHandPose: "2h mainhand",
      offHandPose: "2h offhand"
    });
    expect(deriveBaseArmBundlePoses(handPose)).toEqual({
      mainHandPose: "2h mainhand",
      offHandPose: "2h offhand"
    });
  });

  it("uses complementary idle when both derived poses map to the same bucket", () => {
    expect(
      deriveBaseArmBundlePoses({
        mainHandPose: "1h mainhand",
        offHandPose: "1h mainhand"
      })
    ).toEqual({
      mainHandPose: "1h mainhand",
      offHandPose: "1h offhand"
    });
  });
});

describe("deriveChestWeaponStances", () => {
  it("returns weapon stance plus idle off-hand when only main-hand is equipped", () => {
    const darts = handItem({
      name: "Darts",
      equipSlot: "main-hand",
      equipType: "darts"
    });
    expect(deriveChestWeaponStances([darts])).toEqual([
      "throwing mainhand",
      "1h offhand"
    ]);
  });

  it("returns both stances when both hands have weapons", () => {
    const rod = handItem({
      name: "Rod",
      equipSlot: "main-hand",
      equipType: "rod"
    });
    const shield = handItem({
      name: "Shield",
      equipSlot: "off-hand",
      equipType: "shield"
    });
    expect(deriveChestWeaponStances([rod, shield])).toEqual([
      "1h mainhand",
      "1h offhand"
    ]);
  });

  it("pairs 2h mainhand and 2h offhand chest overlays when only main-hand has a 2h weapon", () => {
    const polearm = handItem({
      name: "Pole",
      equipSlot: "main-hand",
      equipType: "polearm",
      twoHanded: true
    });
    expect(deriveChestWeaponStances([polearm])).toEqual([
      "2h mainhand",
      "2h offhand"
    ]);
  });

  it("pairs 2h crossbow stances when only main-hand has a 2h crossbow", () => {
    const crossbow = handItem({
      name: "Crossbow",
      equipSlot: "main-hand",
      equipType: "crossbow",
      twoHanded: true
    });
    expect(deriveChestWeaponStances([crossbow])).toEqual([
      "2h mainhand crossbow",
      "2h offhand crossbow"
    ]);
  });

  it("returns default idle stances when no hand weapons are equipped", () => {
    expect(deriveChestWeaponStances([])).toEqual(["1h mainhand", "1h offhand"]);
  });
});

describe("weaponOccupiesBothHands", () => {
  it("is false for 1h rod", () => {
    expect(
      weaponOccupiesBothHands(
        handItem({ name: "Rod", equipSlot: "main-hand", equipType: "rod" })
      )
    ).toBe(false);
  });

  it("is true for twoHanded polearm even when catalog pose is all", () => {
    expect(
      weaponOccupiesBothHands(
        handItem({
          name: "Pole",
          equipSlot: "main-hand",
          equipType: "polearm",
          twoHanded: true
        })
      )
    ).toBe(true);
  });
});
