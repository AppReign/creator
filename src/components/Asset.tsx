import React from "react";

import classes from "../styles/components/Asset.module.scss";
import { ConfigImage } from "../interfaces/Config";
import { zIndexValue } from "../layers/zIndex";
import { getImageSrc } from "../utils/imageSrcResolver";

function resolveZIndex(image: ConfigImage): number {
  return "layer" in image ? zIndexValue(image.layer) : image.zIndex;
}

interface AssetProps {
  image: ConfigImage;
  emphasis?: "highlight" | "dim";
}

const Asset = ({image, emphasis}: AssetProps) => {
  const src = getImageSrc(image);
  const zIndex = resolveZIndex(image) + (emphasis === "highlight" ? 1000 : 0);
  
  return (
    <div
      className={[
        classes.Asset,
        emphasis === "highlight" ? classes.highlighted : "",
        emphasis === "dim" ? classes.dimmed : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ zIndex }}
      data-part={image.filename}
    >
      <img
        className={"characterLayer"}
        src={src}
        alt={image.filename}
      />
    </div>
  );
};

Asset.displayName = "Asset";

export default Asset;
