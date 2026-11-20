import type { CdnBadgeStatus } from "../components/CdnStatusBadge";
import type { CharacterSex } from "../interfaces/Config";
import type { CdnRollupStatus } from "./cdnRollupStatus";

type BadgeOptions = {
  /** When true, {@code na} maps to null instead of a badge status. */
  nullForNa?: boolean;
};

export function toCdnBadgeStatus(
  status: CdnRollupStatus,
  options?: BadgeOptions
): CdnBadgeStatus | null {
  switch (status) {
    case "ok":
      return "ok";
    case "pending":
      return "pending";
    case "partial":
      return "partial";
    case "issue":
      return "issue";
    case "error":
      return "error";
    case "na":
    default:
      return options?.nullForNa ? null : "error";
  }
}

export function isCdnMissing(status: CdnRollupStatus): boolean {
  return status === "error" || status === "issue";
}

export function equipmentSetCdnTitle(status: CdnRollupStatus): string {
  switch (status) {
    case "ok":
      return "Uploaded. Every item in this set has its sprites.";
    case "pending":
      return "Checking if the sprites are uploaded.";
    case "issue":
      return "Some items have no sprite info yet.";
    case "error":
    default:
      return "Not fully uploaded. Some sprites for this set are missing.";
  }
}

export function baseSetCdnTitle(status: CdnRollupStatus): string {
  switch (status) {
    case "ok":
      return "Uploaded. All base sprites are there.";
    case "pending":
      return "Checking if the sprites are uploaded.";
    case "error":
    default:
      return "Not uploaded. Some base sprites are missing.";
  }
}

export function equipmentItemCdnTitle(status: CdnRollupStatus): string {
  switch (status) {
    case "ok":
      return "Uploaded. All sprites for this item are there.";
    case "pending":
      return "Checking if the sprites are uploaded.";
    case "partial":
      return "Partly uploaded. Some sprites are there, some are missing.";
    case "issue":
      return "No sprite info for this item yet.";
    case "error":
    case "na":
    default:
      return "Not uploaded. The sprites for this item are missing.";
  }
}

export function equipmentSexCdnTitle(sex: CharacterSex, status: CdnRollupStatus): string {
  const name = sex === "male" ? "Male" : "Female";
  switch (status) {
    case "ok":
      return `${name} uploaded. All ${sex} sprites are there.`;
    case "pending":
      return `Checking ${sex} sprites.`;
    case "partial":
      return `${name} partly uploaded. Some ${sex} sprites are missing.`;
    case "issue":
      return `No ${sex} sprite info yet.`;
    case "error":
    case "na":
    default:
      return `${name} not uploaded. ${name} sprites are missing.`;
  }
}

export function basePartCdnTitle(status: CdnRollupStatus): string {
  switch (status) {
    case "ok":
      return "Uploaded. All sprites for this part are there.";
    case "pending":
      return "Checking if the sprites are uploaded.";
    case "partial":
      return "Partly uploaded. Some sprites are there, some are missing.";
    case "error":
    default:
      return "Not uploaded. Some sprites for this part are missing.";
  }
}

export function equipmentSetBanner(status: CdnRollupStatus): {
  label: string;
  dataStatus: "pending" | "ok" | "error" | "issue";
} {
  switch (status) {
    case "ok":
      return {
        label: "All items have every sprite on CDN",
        dataStatus: "ok"
      };
    case "pending":
      return {
        label: "Checking CDN sprites…",
        dataStatus: "pending"
      };
    case "issue":
      return {
        label: "Some items missing valid characterDisplay",
        dataStatus: "issue"
      };
    case "error":
    default:
      return {
        label: "Some items missing sprites on CDN",
        dataStatus: "error"
      };
  }
}

export function baseSetBanner(status: CdnRollupStatus): {
  label: string;
  dataStatus: "pending" | "ok" | "error";
} {
  switch (status) {
    case "ok":
      return { label: "All sprites on CDN", dataStatus: "ok" };
    case "pending":
      return { label: "Checking CDN sprites…", dataStatus: "pending" };
    case "error":
    default:
      return { label: "Some sprites missing on CDN", dataStatus: "error" };
  }
}
