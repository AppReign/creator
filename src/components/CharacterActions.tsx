import React from "react";
import classnames from "classnames";

import { CharacterSex } from "../interfaces/Config";
import classes from "../styles/components/CharacterActions.module.scss";

interface CharacterActionsProps {
  randomize: () => void;
  randomizeDisabled?: boolean;
  save: () => void;
  share: () => void;
  refresh: () => void;
  characterSex: CharacterSex;
  onCharacterSexChange: (sex: CharacterSex) => void;
}

export const CharacterActions = ({
  randomize,
  randomizeDisabled = false,
  save,
  share,
  refresh,
  characterSex,
  onCharacterSexChange
}: CharacterActionsProps) => {
  return (
    <div className={classes.actions}>
      <button
        type="button"
        className={classnames(classes.action, {
          [classes.active]: characterSex === "male"
        })}
        onClick={() => onCharacterSexChange("male")}
      >
        male
      </button>
      <button
        type="button"
        className={classnames(classes.action, {
          [classes.active]: characterSex === "female"
        })}
        onClick={() => onCharacterSexChange("female")}
      >
        female
      </button>
      <button
        type="button"
        className={classes.action}
        onClick={refresh}
      >
        refresh
      </button>
      <button
        type="button"
        className={classes.action}
        onClick={save}
      >
        save
      </button>
      <span className={classes.tipWrap}>
        <button
          type="button"
          className={classes.action}
          onClick={randomize}
          disabled={randomizeDisabled}
          aria-describedby="random-uploaded-tip"
        >
          random
        </button>
        <span className={classes.tip} id="random-uploaded-tip" role="tooltip">
          {`Picks random gear that is fully uploaded for ${characterSex}. Slots with nothing uploaded stay empty.`}
        </span>
      </span>
      <button
        type="button"
        className={classes.action}
        onClick={share}
      >
        share
      </button>
    </div>
  );
};

CharacterActions.displayName = "CharacterActions";
