import React from "react";

import Asset from "./Asset";
import { ConfigImage, ConfigPart } from "../interfaces/Config";

interface AssetsRendererProps {
  partsArray: ConfigPart[];
  highlightedPartName?: string | null;
}

const AssetsRenderer = ({partsArray, highlightedPartName}: AssetsRendererProps) => {
  return (
    <React.Fragment>
      {partsArray.map((part: ConfigPart) =>
        part.images.map((image: ConfigImage, index: number) => (
          <Asset
            key={`${part.name}-${index}`}
            image={image}
            emphasis={
              !highlightedPartName
                ? undefined
                : part.name === highlightedPartName
                  ? "highlight"
                  : "dim"
            }
          />
        ))
      )}
    </React.Fragment>
  );
};

AssetsRenderer.displayName = "AssetsRenderer";

export default AssetsRenderer;
