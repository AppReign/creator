import React from "react";
import { EquipmentList } from "../components/EquipmentList";
import CdnCheckProgress from "../components/CdnCheckProgress";
import { CharacterSex, ConfigPartEquipment } from "../interfaces/Config";
import { useEquipmentValidation } from "../pages/equipmentSets/equipmentValidationContext";
import classes from "../styles/components/EquipmentSelector.module.scss";

interface EquipmentSelectorProps {
  equipItem: (item: ConfigPartEquipment) => void;
  unequipItem: (item: ConfigPartEquipment) => void;
  equippedItems: ConfigPartEquipment[];
  itemList: ConfigPartEquipment[];
  title?: string;
  previewSex: CharacterSex;
}

const EquipmentSelector = ({
  itemList,
  title,
  equipItem,
  unequipItem,
  equippedItems,
  previewSex
}: EquipmentSelectorProps) => {
  const { cdnCheckProgress } = useEquipmentValidation();
  const showProgress =
    cdnCheckProgress.total > 0 &&
    cdnCheckProgress.checked < cdnCheckProgress.total;

  return (
    <div className={classes.EquipmentSelector}>
      {title && (
        <h2 className={classes.EquipmentSelectorTitle}>{title}</h2>
      )}
      {showProgress && (
        <div className={classes.progressWrap}>
          <CdnCheckProgress
            checked={cdnCheckProgress.checked}
            total={cdnCheckProgress.total}
            variant="inline"
          />
        </div>
      )}
      <EquipmentList
        itemList={itemList}
        equipItem={equipItem}
        unequipItem={unequipItem}
        equippedItems={equippedItems}
        previewSex={previewSex}
      />
    </div>
  );
};

EquipmentSelector.displayName = "EquipmentSelector";

export default EquipmentSelector;
