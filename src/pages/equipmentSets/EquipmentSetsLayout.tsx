import React from "react";
import { Outlet } from "react-router-dom";

import { useCreatorEquipment } from "../../context/CreatorEquipmentContext";
import EquipmentSetSidebar from "./EquipmentSetSidebar";
import classes from "./EquipmentSetsLayout.module.scss";

const EquipmentSetsLayout = () => {
  const { ready, loading, error } = useCreatorEquipment();

  return (
    <div className={classes.layout}>
      <EquipmentSetSidebar />
      <section className={classes.main}>
        {!ready || loading ? (
          <p className={classes.loading}>Loading equipment from API…</p>
        ) : error ? (
          <p className={classes.loading}>Equipment unavailable: {error}</p>
        ) : (
          <Outlet />
        )}
      </section>
    </div>
  );
};

EquipmentSetsLayout.displayName = "EquipmentSetsLayout";

export default EquipmentSetsLayout;
