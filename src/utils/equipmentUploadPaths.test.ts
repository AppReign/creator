import {
  buildEquipmentUploadFilename,
  buildEquipmentUploadObjectKey
} from "./equipmentUploadPaths";

describe("equipmentUploadPaths", () => {
  const item = {
    itemSetSegment: "plain-farmer",
    normalizedItemId: "plain-farmers-tunic"
  };

  it("builds filename matching dotv path builder", () => {
    expect(
      buildEquipmentUploadFilename("plain-farmers-tunic", "male", "2h mainhand", "base")
    ).toBe("plain-farmers-tunic-2h-mainhand-base-male.png");
    expect(
      buildEquipmentUploadFilename("training-sword", "female", "all", "over")
    ).toBe("training-sword-all-over-female.png");
  });

  it("builds object key matching dotv path builder", () => {
    expect(
      buildEquipmentUploadObjectKey(item, "male", "2h mainhand", "base")
    ).toBe(
      "equipment/plain-farmer/plain-farmers-tunic/male/plain-farmers-tunic-2h-mainhand-base-male.png"
    );
  });
});
