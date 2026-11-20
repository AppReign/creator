import React from "react";

import classes from "./CdnStatusBadge.module.scss";

export type CdnBadgeStatus = "pending" | "ok" | "partial" | "error" | "issue";

type CdnStatusBadgeProps = {
  status: CdnBadgeStatus;
  title?: string;
  size?: "sm" | "md";
  className?: string;
};

const DEFAULT_TIP: Record<CdnBadgeStatus, string> = {
  ok: "Uploaded. All sprites are there.",
  partial: "Partly uploaded. Some sprites are missing.",
  error: "Not uploaded.",
  issue: "No sprite info for this yet.",
  pending: "Checking if the sprites are uploaded."
};

const CdnStatusBadge = ({
  status,
  title,
  size = "sm",
  className
}: CdnStatusBadgeProps) => {
  const tip = title || DEFAULT_TIP[status];

  return (
    <span
      className={[classes.badge, classes[size], className].filter(Boolean).join(" ")}
      data-status={status}
      aria-busy={status === "pending"}
      aria-label={tip}
    >
      {status === "pending" ? (
        <span className={classes.spinner} aria-hidden />
      ) : status === "ok" ? (
        "✓"
      ) : status === "partial" ? (
        "!"
      ) : (
        "✗"
      )}
      <span className={classes.tip} role="tooltip">
        {tip}
      </span>
    </span>
  );
};

CdnStatusBadge.displayName = "CdnStatusBadge";

export default CdnStatusBadge;
