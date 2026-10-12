import React, { useState, useMemo } from "react";
import classnames from "classnames";

import AssetsRenderer from "../components/AssetsRenderer";
import CurrentlyEquipped from "../components/CurrentlyEquipped";
import EquipmentSelector from "../components/EquipmentSelector";
import { CharacterActions } from "../components/CharacterActions";
import classes from "../styles/App.module.scss";
import characterClasses from "../styles/components/Character.module.scss";
import { ConfigPart, ConfigPartEquipment, CharacterSex } from "../interfaces/Config";
import { DEFAULT_CHARACTER_BASE_COLOR } from "../config/characterBaseSets";
import { EquipSlot } from "../config/equipSlots";
import { useCharacterBaseSets } from "../context/CharacterBaseSetsContext";
import EquipSlotSelector from "../components/EquipSlotSelector";
import {
  derivePoseFromEquipment,
  getEquipmentPartsForSlot,
  weaponOccupiesBothHands
} from "../utils/equipmentPose";
import { useEquipmentValidation } from "./equipmentSets/equipmentValidationContext";
import { useLoadEquipmentFromUrlHash } from "../hooks/useLoadEquipmentFromUrlHash";
import { useRandomizeCharacter } from "../hooks/useRandomizeCharacter";
import { useEquipmentCatalog } from "../hooks/useEquipmentCatalog";
import { cleanCharacterUrlHash } from "../utils/cleanCharacterUrlHash";
import { mergeEquipmentPartWithConfig } from "../utils/mergeEquipmentPartWithConfig";
import { saveCharacterAsPng } from "../utils/saveCharacterImage";
import { resolveBasePartsFromVariant } from "../utils/basePartsFromApi";
import { resolveEquipmentImagesWithCdn } from "../utils/equipmentCatalog";

const Playground = () => {
  const { ready, loading, error, catalog, itemEquipById, itemById, cdnBaseUrl, cdnCacheBust } =
    useEquipmentCatalog();
  const {
    ready: basePartsReady,
    loading: basePartsLoading,
    error: basePartsError,
    bundle: basePartsBundle,
    cdnBaseUrl: basePartsCdnBaseUrl,
    cdnCacheBust: basePartsCdnCacheBust
  } = useCharacterBaseSets();
  const [equippedItems, setEquippedItems] = useState<ConfigPartEquipment[]>([]);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] =
    useState<EquipSlot>("helm");
  const [changing, setChanging] = useState<boolean>(false);
  const [characterSex, setCharacterSex] = useState<CharacterSex>("male");
  const [highlightedEquipName, setHighlightedEquipName] = useState<string | null>(null);

  const { getItemSexCdnStatus } = useEquipmentValidation();
  useLoadEquipmentFromUrlHash(setEquippedItems, setChanging, catalog);
  const uploadedCatalog = useMemo(
    () =>
      catalog.filter((part) => {
        const itemId = part.equipmentRegistryKey;
        if (!itemId) return false;
        return getItemSexCdnStatus(itemId, characterSex) === "ok";
      }),
    [catalog, characterSex, getItemSexCdnStatus]
  );
  const randomize = useRandomizeCharacter(
    setEquippedItems,
    setChanging,
    uploadedCatalog
  );

  const selectedPose = useMemo(
    () => derivePoseFromEquipment(equippedItems),
    [equippedItems]
  );

  const baseVariant = basePartsBundle[characterSex]?.[DEFAULT_CHARACTER_BASE_COLOR];

  const baseCharacterAssets = useMemo<ConfigPart[]>(
    () =>
      resolveBasePartsFromVariant(
        baseVariant,
        selectedPose,
        basePartsCdnBaseUrl || cdnBaseUrl,
        basePartsCdnCacheBust || cdnCacheBust
      ),
    [baseVariant, selectedPose, basePartsCdnBaseUrl, cdnBaseUrl, basePartsCdnCacheBust, cdnCacheBust]
  );

  const equipmentPartsForSlot = useMemo(
    () =>
      getEquipmentPartsForSlot(selectedEquipmentSlot, catalog, equippedItems),
    [selectedEquipmentSlot, catalog, equippedItems]
  );

  const displayedEquipmentParts = useMemo((): ConfigPartEquipment[] => {
    return equippedItems.map((part) => {
      const key = part.equipmentRegistryKey;
      if (!key || !itemEquipById[key] || !itemById[key]) {
        return part;
      }
      const images = resolveEquipmentImagesWithCdn(
        itemEquipById[key],
        itemById[key],
        selectedPose,
        characterSex,
        cdnBaseUrl,
        equippedItems,
        cdnCacheBust
      );
      return {
        ...part,
        images: images.length > 0 ? images : part.images
      };
    });
  }, [
    equippedItems,
    selectedPose,
    characterSex,
    itemEquipById,
    itemById,
    cdnBaseUrl,
    cdnCacheBust
  ]);

  const removeEquipmentPart = (removedPart: ConfigPartEquipment) => {
    cleanCharacterUrlHash();
    setEquippedItems((prevState) => {
      const newState = [...prevState];
      const index = newState.findIndex(
        (part) => part.name === removedPart.name
      );
      if (index !== -1) newState.splice(index, 1);
      return newState;
    });
  };

  const addEquipmentPart = (newPart: ConfigPartEquipment) => {
    cleanCharacterUrlHash();
    const merged = mergeEquipmentPartWithConfig(newPart, catalog);
    const newUsesBothHands = weaponOccupiesBothHands(newPart);
    const otherHand: EquipSlot | null =
      newPart.equipSlot === "main-hand"
        ? "off-hand"
        : newPart.equipSlot === "off-hand"
          ? "main-hand"
          : null;

    setEquippedItems((prev) => {
      const withoutSameSlot = prev.filter((part) => {
        if (part.equipSlot === newPart.equipSlot) return false;
        if (!otherHand || part.equipSlot !== otherHand) return true;
        if (newUsesBothHands) return false;
        if (weaponOccupiesBothHands(part)) return false;
        return true;
      });
      return [...withoutSameSlot, merged];
    });
  };

  const save = () => saveCharacterAsPng();

  const share = () => {
    const combined = [...baseCharacterAssets, ...equippedItems];
    const base64 = btoa(JSON.stringify(combined));
    window.location.href = window.location.href.split("#")[0] + "#" + base64;
  };

  const refresh = () => {
    cleanCharacterUrlHash();
    setChanging(true);
    setTimeout(() => setChanging(false), 500);
    setEquippedItems([]);
  };

  const backgroundImageUrl = `${process.env.PUBLIC_URL || ""}/character_parts/BACKGROUND.png`;

  if (!ready || !basePartsReady || loading || basePartsLoading) {
    return (
      <div className={classes.playgroundRoot}>
        <p className={classes.loadingMessage}>Loading character data from API…</p>
      </div>
    );
  }

  if (error || basePartsError) {
    return (
      <div className={classes.playgroundRoot}>
        <p className={classes.loadingMessage}>
          Character data unavailable: {error || basePartsError}
        </p>
      </div>
    );
  }

  return (
    <div className={classes.playgroundRoot}>
      <div
        className={classes.AppBackground}
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-hidden="true"
      />
      <div className={classes.App}>
        <div className={classes.stage}>
          <CurrentlyEquipped
            items={displayedEquipmentParts}
            highlightedName={highlightedEquipName}
            onHighlight={setHighlightedEquipName}
          />
          <div
            id="character"
            className={classnames(characterClasses.Character, {
              [characterClasses.Changing]: changing
            })}
          >
            <AssetsRenderer
              partsArray={[...baseCharacterAssets, ...displayedEquipmentParts]}
              highlightedPartName={highlightedEquipName}
            />
          </div>
        </div>
        <div className={classes.Selectors}>
          <CharacterActions
            randomize={randomize}
            randomizeDisabled={uploadedCatalog.length === 0}
            save={save}
            share={share}
            refresh={refresh}
            characterSex={characterSex}
            onCharacterSexChange={setCharacterSex}
          />
          <EquipSlotSelector
            selectedEquipmentSlot={selectedEquipmentSlot}
            setSelectedEquipmentSlot={setSelectedEquipmentSlot}
          />
          <EquipmentSelector
            key={selectedEquipmentSlot}
            title="Equipment"
            itemList={equipmentPartsForSlot}
            equippedItems={equippedItems}
            equipItem={addEquipmentPart}
            unequipItem={removeEquipmentPart}
            previewSex={characterSex}
          />
        </div>
      </div>
    </div>
  );
};

Playground.displayName = "Playground";

export default Playground;
