import React from "react";
import { NavLink } from "react-router-dom";

import CdnCheckProgress from "../../components/CdnCheckProgress";
import CdnStatusBadge from "../../components/CdnStatusBadge";
import {
  baseSetCdnTitle,
  toCdnBadgeStatus
} from "../../utils/cdnStatusPresentation";
import { useCharacterBaseSets } from "../../context/CharacterBaseSetsContext";
import { useCharacterBaseSetValidation } from "./characterBaseSetValidationContext";
import classes from "../equipmentSets/EquipmentSetSidebar.module.scss";

const CharacterSetSidebar = () => {
  const { sets } = useCharacterBaseSets();
  const { getSetCdnStatus, cdnChecking, cdnCheckProgress } =
    useCharacterBaseSetValidation();

  const showProgress =
    cdnChecking || cdnCheckProgress.checked < cdnCheckProgress.total;

  return (
    <aside className={classes.aside} aria-label="Character base sets">
      <div className={classes.asideHeader}>Base sets</div>
      {showProgress && (
        <CdnCheckProgress
          checked={cdnCheckProgress.checked}
          total={cdnCheckProgress.total}
        />
      )}
      <nav className={classes.nav}>
        <ul className={classes.list}>
          {sets.map((set) => {
            const setStatus = getSetCdnStatus(set.id);
            return (
              <li key={set.id}>
                <NavLink
                  to={`/character-sets/${set.id}`}
                  className={({ isActive }) =>
                    [classes.link, isActive ? classes.linkActive : ""].join(" ")
                  }
                >
                  <span className={classes.linkLabel}>{set.label}</span>
                  <CdnStatusBadge
                    status={toCdnBadgeStatus(setStatus) ?? "error"}
                    title={baseSetCdnTitle(setStatus)}
                  />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

CharacterSetSidebar.displayName = "CharacterSetSidebar";

export default CharacterSetSidebar;
