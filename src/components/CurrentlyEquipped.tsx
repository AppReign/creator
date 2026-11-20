import React, { useMemo } from "react";

import { EQUIP_SLOTS } from "../config/equipSlots";
import { ConfigPartEquipment } from "../interfaces/Config";
import classes from "../styles/components/CurrentlyEquipped.module.scss";

type CurrentlyEquippedProps = {
  items: ConfigPartEquipment[];
  highlightedName: string | null;
  onHighlight: (name: string | null) => void;
};

function slotOrder(item: ConfigPartEquipment): number {
  const index = EQUIP_SLOTS.indexOf(item.equipSlot);
  return index === -1 ? EQUIP_SLOTS.length : index;
}

const CurrentlyEquipped = ({
  items,
  highlightedName,
  onHighlight
}: CurrentlyEquippedProps) => {
  const ordered = useMemo(
    () =>
      [...items].sort((a, b) => {
        const slotDiff = slotOrder(a) - slotOrder(b);
        if (slotDiff !== 0) return slotDiff;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }),
    [items]
  );

  return (
    <section className={classes.panel} aria-label="Currently equipped">
      <h2 className={classes.title}>Currently equipped</h2>
      {ordered.length === 0 ? (
        <p className={classes.empty}>Nothing equipped.</p>
      ) : (
        <ul className={classes.list}>
          {ordered.map((item) => {
            const active = highlightedName === item.name;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  className={active ? `${classes.label} ${classes.labelActive}` : classes.label}
                  aria-pressed={active}
                  onMouseEnter={() => onHighlight(item.name)}
                  onMouseLeave={() => onHighlight(null)}
                  onFocus={() => onHighlight(item.name)}
                  onBlur={() => onHighlight(null)}
                >
                  <span className={classes.slot}>{item.equipSlot}</span>
                  <span className={classes.name}>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

CurrentlyEquipped.displayName = "CurrentlyEquipped";

export default CurrentlyEquipped;
