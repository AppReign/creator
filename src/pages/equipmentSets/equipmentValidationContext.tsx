import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useCreatorEquipment } from "../../context/CreatorEquipmentContext";
import type { CharacterSex } from "../../interfaces/Config";
import type { EquipmentSetBundle } from "../../types/equipmentSet";
import { buildEquipmentCdnUrl } from "../../utils/apiCharacterDisplay";
import { checkCdnImageUrls } from "../../utils/checkCdnImage";
import { rollupCdnStatusFromCounts, type CdnRollupStatus } from "../../utils/cdnRollupStatus";
import { extractRequiredCharacterImages } from "../../utils/extractCharacterDisplayImages";
import type { BundleValidationResult } from "../../utils/validateEquipmentBundle";
import { validateEquipmentBundle } from "../../utils/validateEquipmentBundle";

export type ValidationMap = Record<string, BundleValidationResult>;

export type EquipmentImageLoadState = "loading" | "ok" | "error";

type SexUrlMap = Record<CharacterSex, string[]>;

type ItemCdnPlan = {
  itemId: string;
  equipSet: string;
  urls: string[];
  urlsBySex: SexUrlMap;
};

type ValidationContextValue = {
  validationBySet: ValidationMap;
  bundles: readonly EquipmentSetBundle[];
  cdnChecking: boolean;
  cdnCheckProgress: { checked: number; total: number };
  getUrlStatus: (url: string) => EquipmentImageLoadState;
  getItemCdnStatus: (itemId: string) => CdnRollupStatus;
  getItemSexCdnStatus: (itemId: string, sex: CharacterSex) => CdnRollupStatus;
  getSetCdnStatus: (equipSet: string) => CdnRollupStatus;
};

const ValidationContext = createContext<ValidationContextValue>({
  validationBySet: {},
  bundles: [],
  cdnChecking: false,
  cdnCheckProgress: { checked: 0, total: 0 },
  getUrlStatus: () => "loading",
  getItemCdnStatus: () => "na",
  getItemSexCdnStatus: () => "na",
  getSetCdnStatus: () => "na"
});

function buildItemCdnPlans(
  bundles: readonly EquipmentSetBundle[],
  itemById: Record<string, { id: string; itemSetSegment: string; normalizedItemId: string }>,
  cdnBaseUrl: string,
  cdnCacheBust?: string
): ItemCdnPlan[] {
  const plans: ItemCdnPlan[] = [];
  for (const bundle of bundles) {
    for (const item of bundle.items) {
      const creatorItem = itemById[item.id];
      if (!creatorItem || !item.characterDisplay) continue;
      const refs = extractRequiredCharacterImages(item);
      const urls = new Set<string>();
      const urlsBySex: SexUrlMap = { male: [], female: [] };
      for (const ref of refs) {
        const url = buildEquipmentCdnUrl(creatorItem, ref, cdnBaseUrl, cdnCacheBust);
        if (urls.has(url)) continue;
        urls.add(url);
        urlsBySex[ref.sex].push(url);
      }
      plans.push({
        itemId: item.id,
        equipSet: bundle.equipSet,
        urls: Array.from(urls),
        urlsBySex
      });
    }
  }
  return plans;
}

export { type CdnRollupStatus } from "../../utils/cdnRollupStatus";

export function EquipmentValidationProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { ready, bundles, itemById, cdnBaseUrl, cdnCacheBust } = useCreatorEquipment();
  const [cdnChecking, setCdnChecking] = useState(false);
  const [urlStatus, setUrlStatus] = useState<Record<string, EquipmentImageLoadState>>({});
  const checkGeneration = useRef(0);

  const validationBySet = useMemo(() => {
    if (!ready) return {};
    const map: ValidationMap = {};
    for (const bundle of bundles) {
      map[bundle.equipSet] = validateEquipmentBundle(bundle);
    }
    return map;
  }, [ready, bundles]);

  const itemPlans = useMemo(() => {
    if (!ready || !cdnBaseUrl) return [];
    return buildItemCdnPlans(bundles, itemById, cdnBaseUrl, cdnCacheBust);
  }, [ready, bundles, itemById, cdnBaseUrl, cdnCacheBust]);

  const itemUrlsById = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const plan of itemPlans) {
      map[plan.itemId] = plan.urls;
    }
    return map;
  }, [itemPlans]);

  const itemUrlsBySex = useMemo(() => {
    const map: Record<string, SexUrlMap> = {};
    for (const plan of itemPlans) {
      map[plan.itemId] = plan.urlsBySex;
    }
    return map;
  }, [itemPlans]);

  const setItemsBySet = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const bundle of bundles) {
      map[bundle.equipSet] = bundle.items.map((item) => item.id);
    }
    return map;
  }, [bundles]);

  useEffect(() => {
    if (!ready || !cdnBaseUrl || !itemPlans.length) {
      setUrlStatus({});
      setCdnChecking(false);
      return;
    }

    const generation = ++checkGeneration.current;
    const allUrls = Array.from(new Set(itemPlans.flatMap((plan) => plan.urls)));
    const initial: Record<string, EquipmentImageLoadState> = {};
    for (const url of allUrls) {
      initial[url] = "loading";
    }
    setUrlStatus(initial);
    setCdnChecking(true);

    void checkCdnImageUrls(allUrls, (url, result) => {
      if (generation !== checkGeneration.current) return;
      setUrlStatus((prev) => ({
        ...prev,
        [url]: result === "ok" ? "ok" : "error"
      }));
    }).finally(() => {
      if (generation === checkGeneration.current) {
        setCdnChecking(false);
      }
    });
  }, [ready, cdnBaseUrl, itemPlans]);

  const cdnCheckProgress = useMemo(() => {
    const statuses = Object.values(urlStatus);
    const total = statuses.length;
    const checked = statuses.filter((status) => status !== "loading").length;
    return { checked, total };
  }, [urlStatus]);

  const getUrlStatus = useMemo(
    () =>
      (url: string): EquipmentImageLoadState =>
        urlStatus[url] ?? "loading",
    [urlStatus]
  );

  const statusForItemUrls = useMemo(() => {
    return (itemId: string, urls: string[]): CdnRollupStatus => {
      const validationRow = Object.values(validationBySet)
        .flatMap((bundle) => bundle.items)
        .find((row) => row.item.id === itemId);
      if (!validationRow?.done) {
        return "issue";
      }
      if (!urls.length) return "na";

      let ok = 0;
      let error = 0;
      let pending = 0;
      for (const url of urls) {
        const status = urlStatus[url] ?? "loading";
        if (status === "ok") ok++;
        else if (status === "error") error++;
        else pending++;
      }
      return rollupCdnStatusFromCounts(urls.length, ok, error, pending);
    };
  }, [validationBySet, urlStatus]);

  const getItemCdnStatus = useMemo(() => {
    return (itemId: string): CdnRollupStatus => {
      const urls = itemUrlsById[itemId] ?? [];
      const status = statusForItemUrls(itemId, urls);
      if (!urls.length && status === "na") return "issue";
      return status;
    };
  }, [statusForItemUrls, itemUrlsById]);

  const getItemSexCdnStatus = useMemo(() => {
    return (itemId: string, sex: CharacterSex): CdnRollupStatus =>
      statusForItemUrls(itemId, itemUrlsBySex[itemId]?.[sex] ?? []);
  }, [statusForItemUrls, itemUrlsBySex]);

  const getSetCdnStatus = useMemo(() => {
    return (equipSet: string): CdnRollupStatus => {
      const validation = validationBySet[equipSet];
      if (!validation) return "na";

      const itemIds = setItemsBySet[equipSet] ?? [];
      if (!itemIds.length) return "na";

      let hasPending = false;
      let hasError = false;
      let hasIssue = false;
      let okItems = 0;

      for (const itemId of itemIds) {
        const status = getItemCdnStatus(itemId);
        if (status === "pending") hasPending = true;
        else if (status === "error") hasError = true;
        else if (status === "issue") hasIssue = true;
        else if (status === "ok") okItems++;
      }

      if (hasError || hasIssue) return "error";
      if (hasPending) return "pending";
      if (okItems === itemIds.length) return "ok";
      return "error";
    };
  }, [validationBySet, setItemsBySet, getItemCdnStatus]);

  const value = useMemo(
    () => ({
      validationBySet,
      bundles,
      cdnChecking,
      cdnCheckProgress,
      getUrlStatus,
      getItemCdnStatus,
      getItemSexCdnStatus,
      getSetCdnStatus
    }),
    [
      validationBySet,
      bundles,
      cdnChecking,
      cdnCheckProgress,
      getUrlStatus,
      getItemCdnStatus,
      getItemSexCdnStatus,
      getSetCdnStatus
    ]
  );

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useEquipmentValidation(): ValidationContextValue {
  return useContext(ValidationContext);
}
