import React, { useMemo, useState } from "react";
import classnames from "classnames";

import CdnStatusBadge from "./CdnStatusBadge";
import { useCreatorEquipment } from "../context/CreatorEquipmentContext";
import { CharacterSex, ConfigPartEquipment } from "../interfaces/Config";
import { useEquipmentValidation } from "../pages/equipmentSets/equipmentValidationContext";
import {
  equipmentSexCdnTitle,
  toCdnBadgeStatus
} from "../utils/cdnStatusPresentation";
import classes from "../styles/components/EquipmentList.module.scss";
import { uniqByPartName } from "../utils/uniqByPartName";

const ITEM_ICON_HOST = "https://files.dragonsofthevoid.com";

interface EquipmentListProps {
  itemList: ConfigPartEquipment[];
  equippedItems: ConfigPartEquipment[];
  equipItem: (item: ConfigPartEquipment) => void;
  unequipItem: (item: ConfigPartEquipment) => void;
  previewSex: CharacterSex;
}

function otherSex(sex: CharacterSex): CharacterSex {
  return sex === "male" ? "female" : "male";
}

function itemIconUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${ITEM_ICON_HOST}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

const ItemIcon = ({ src }: { src?: string }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={classes.iconFallback} aria-hidden />;
  }
  return (
    <img
      className={classes.icon}
      src={src}
      alt=""
      onError={() => setFailed(true)}
    />
  );
};

ItemIcon.displayName = "ItemIcon";

export const EquipmentList = ({
  itemList,
  equippedItems,
  equipItem,
  unequipItem,
  previewSex
}: EquipmentListProps) => {
  const { itemById } = useCreatorEquipment();
  const { getItemSexCdnStatus } = useEquipmentValidation();
  const otherPreviewSex = otherSex(previewSex);
  const [query, setQuery] = useState("");
  const visibleParts = useMemo(() => {
    const parts = itemList
      .reduce<ConfigPartEquipment[]>(uniqByPartName, [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    const needle = query.trim().toLowerCase();
    if (!needle) return parts;
    return parts.filter((part) => part.name.toLowerCase().includes(needle));
  }, [itemList, query]);

  return (
    <div className={classes.listWrap}>
      <input
        className={classes.search}
        type="search"
        value={query}
        placeholder="Search"
        aria-label="Search equipment"
        onChange={(event) => setQuery(event.target.value)}
      />
      {visibleParts.length === 0 ? (
        <p className={classes.empty}>No matches.</p>
      ) : (
        <ul className={classes.partList}>
          {visibleParts.map((part) => {
        const selected = equippedItems.some((layer) => layer.name === part.name);
        const itemId = part.equipmentRegistryKey;
        const previewStatus = itemId ? getItemSexCdnStatus(itemId, previewSex) : "na";
        const otherStatus = itemId ? getItemSexCdnStatus(itemId, otherPreviewSex) : "na";
        const previewBadge = toCdnBadgeStatus(previewStatus, { nullForNa: true });
        const otherBadge = toCdnBadgeStatus(otherStatus, { nullForNa: true });
        const checkingCdn = previewStatus === "pending" || otherStatus === "pending";
        const iconSrc = itemIconUrl(itemId ? itemById[itemId]?.imagePath : undefined);

        return (
            <li key={part.name} className={classes.partRow}>
              <button
                type="button"
                className={classnames(classes.partItem, {
                  [classes.partItemSelected]: selected,
                  [classes.partItemChecking]: checkingCdn
                })}
                aria-pressed={selected}
                onClick={() => {
                  if (selected) {
                    unequipItem(part);
                  } else {
                    equipItem(part);
                  }
                }}
              >
                <ItemIcon src={iconSrc} />
                <span className={classes.partItemLabel}>{part.name}</span>
                <span className={classes.sexMarks}>
                  {previewBadge && (
                    <span className={classes.sexMark}>
                      <span className={classes.sexMarkLabel}>
                        {previewSex === "female" ? "F" : "M"}
                      </span>
                      <CdnStatusBadge
                        status={previewBadge}
                        title={equipmentSexCdnTitle(previewSex, previewStatus)}
                        className={classes.partItemBadge}
                      />
                    </span>
                  )}
                  {otherBadge && (
                    <span className={classes.sexMark}>
                      <span className={classes.sexMarkLabel}>
                        {otherPreviewSex === "female" ? "F" : "M"}
                      </span>
                      <CdnStatusBadge
                        status={otherBadge}
                        title={equipmentSexCdnTitle(otherPreviewSex, otherStatus)}
                        className={classes.partItemBadge}
                      />
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        </ul>
      )}
    </div>
  );
};

EquipmentList.displayName = "EquipmentList";
