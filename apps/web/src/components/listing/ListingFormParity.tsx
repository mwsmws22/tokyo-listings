"use client";

import { PreferenceToggleGroup } from "@/components/listing/ListingPreferenceToggles";
import { canonicalizeListingUrl } from "@/lib/canonicalizeListingUrl";
import type { PreviewStatus } from "@/lib/listing/previewState";
import type { SimilarPropertiesDraft } from "@/lib/similarDraft";
import { isSupportedListingHostUrl } from "@/lib/supportedListingHosts";
import { trpc } from "@/lib/trpc/client";
import { listingCreateSchema } from "@tokyo-listings/validators/listing";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export type ListingCreateParityInput = {
  title: string;
  monthlyRentYen: number;
  addressText: string;
  sourceUrl?: string;
  sourcePortal?: "athome" | "suumo" | "lifull_homes";
  sourceFetchedAt?: Date;
  reikinMonths?: number;
  securityDepositMonths?: number;
  squareM?: number;
  closestStation?: string;
  walkingTimeMin?: number;
  availability?: "募集中" | "契約済";
  propertyType?: "一戸建て" | "アパート";
  interest?: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah";
  prefecture?: string;
  municipality?: string;
  town?: string;
  district?: number;
  block?: number;
  houseNumber?: number;
  selectedPropertyId?: string;
  latitude?: number;
  longitude?: number;
  pinExact?: boolean;
};

type Props = {
  onSubmit: (input: ListingCreateParityInput) => void;
  pending: boolean;
  initialValues?: Partial<ListingCreateParityInput>;
  submitLabel?: string;
  secondaryAction?: {
    label: string;
    onPress: () => void;
    destructive?: boolean;
    disabled?: boolean;
  };
  /** When true, show the similar-properties control (add page). Hidden on edit flows. */
  showSimilarPropertiesButton?: boolean;
  /** Debounced snapshot of structured address + ㎡ for similar-property search. */
  onDraftForSimilarChange?: (draft: SimilarPropertiesDraft) => void;
  similarPropertyCandidateCount?: number;
  /** Toggle similar-properties panel (add page). */
  onSimilarPropertiesButtonPress?: () => void;
  /** Ref for the 🏢 control — used to anchor the floating panel over the map. */
  similarPropertiesButtonRef?: RefObject<View | null>;
  /** When the similar-properties panel is open (visual pressed state). */
  similarPropertiesMenuOpen?: boolean;
  /** When selected, submit associates listing to this property. */
  selectedPropertyId?: string | null;
  selectedPropertyDefaults?: {
    prefecture?: string | null;
    municipality?: string | null;
    town?: string | null;
    district?: number | null;
    block?: number | null;
    houseNumber?: number | null;
    propertyType?: "一戸建て" | "アパート" | null;
    interest?: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah" | null;
  } | null;
  requireSelections?: boolean;
  /** Debounced server-side preview when `sourceUrl` is a supported portal host. */
  onAutoPreviewFromUrl?: (url: string) => void;
  /** Reset URL field border when the URL is empty or not a supported host. */
  onUrlPreviewClear?: () => void;
  /** User edited listing URL text — clear scrape result borders / state in parent. */
  onSourceUrlTextChange?: () => void;
  /** Manual address geocode trigger on blur (pref/city/town only). */
  onManualAddressCommit?: (parts: { prefecture: string; municipality: string; town: string }) => void;
  urlPreviewStatus?: "idle" | "loading" | "success" | "error";
  loadFromUrlError?: string | null;
  loadFromUrlWarnings?: string[];
  loadFromUrlFieldErrors?: Record<string, string>;
  loadFromUrlDebugCapture?: {
    captureId: string;
    htmlPath: string;
    jsonPath: string;
  } | null;
  loadFromUrlPreviewStatus?: PreviewStatus;
};

const inputClass =
  "min-w-0 rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-foam focus:ring-1 focus:ring-rose-pine-foam/30";

const labelClass =
  "min-w-0 flex-1 text-left text-[10px] leading-tight text-rose-pine-text md:text-xs";

const fieldCell = `${inputClass} min-w-[3.25rem] shrink grow basis-0`;
/** Single bold border when address rows are read-only (similar-property association). */
const associationLockedFieldCell =
  "min-w-[3.25rem] shrink grow basis-0 rounded-md border-2 border-rose-pine-muted bg-rose-pine-overlay px-1.5 py-1.5 text-xs text-rose-pine-muted opacity-90 focus:outline-none focus:border-rose-pine-muted focus:ring-0";

/** Listing URL: idle/loading = same focus ring as other fields; success/error keep semantic border on focus. */
const urlFieldIdleOrLoadingClass =
  "min-w-0 flex-1 rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-foam focus:ring-1 focus:ring-rose-pine-foam/30";

const urlFieldSuccessClass =
  "min-w-0 flex-1 rounded-md border-2 border-rose-pine-pine bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-pine focus:ring-1 focus:ring-rose-pine-foam/35";

const urlFieldErrorClass =
  "min-w-0 flex-1 rounded-md border-2 border-rose-pine-love bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-love focus:ring-1 focus:ring-rose-pine-foam/35";

/** Same emphasis as error — URL already saved for another listing. */
const urlFieldDuplicateClass = urlFieldErrorClass;

function urlFieldClassForPreviewStatus(
  status: "idle" | "loading" | "success" | "error",
  sourceUrlTaken: boolean,
): string {
  if (sourceUrlTaken) {
    return urlFieldDuplicateClass;
  }
  if (status === "success") {
    return urlFieldSuccessClass;
  }
  if (status === "error") {
    return urlFieldErrorClass;
  }
  return urlFieldIdleOrLoadingClass;
}

const interestOptions = ["Top", "Extremely", "KindaPlus", "KindaMinus", "Nah"] as const;
const availabilityOptions = ["募集中", "契約済"] as const;
const propertyTypeOptions = ["一戸建て", "アパート"] as const;

function toInputValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Display rent as 万円 (e.g. 12.5); API still uses integer yen. */
function yenToManInput(yen: number | undefined): string {
  if (yen === undefined || !Number.isFinite(yen)) {
    return "";
  }
  const man = yen / 10_000;
  return man.toFixed(2).replace(/\.?0+$/, "");
}

function parseManToYen(manStr: string): number | undefined {
  const t = manStr.trim().replace(/,/g, "");
  if (!t) {
    return undefined;
  }
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return Math.round(n * 10_000);
}

function parseAddressInteger(value: string): number | undefined {
  const ascii = value
    .trim()
    .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  if (!ascii) return undefined;
  const n = Number.parseInt(ascii, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function canonicalizeIfSupported(urlText: string): string {
  const trimmed = urlText.trim();
  if (!trimmed) return urlText;
  if (!isSupportedListingHostUrl(trimmed)) return urlText;
  try {
    return canonicalizeListingUrl(trimmed);
  } catch {
    return urlText;
  }
}

export function ListingFormParity({
  onSubmit,
  pending,
  initialValues,
  submitLabel = "Submit",
  secondaryAction,
  showSimilarPropertiesButton = true,
  onDraftForSimilarChange,
  similarPropertyCandidateCount = 0,
  onSimilarPropertiesButtonPress,
  similarPropertiesButtonRef,
  similarPropertiesMenuOpen = false,
  selectedPropertyId = null,
  selectedPropertyDefaults = null,
  requireSelections = true,
  onAutoPreviewFromUrl,
  onUrlPreviewClear,
  onSourceUrlTextChange,
  onManualAddressCommit,
  urlPreviewStatus = "idle",
  loadFromUrlError = null,
  loadFromUrlWarnings = [],
  loadFromUrlFieldErrors = {},
  loadFromUrlDebugCapture = null,
  loadFromUrlPreviewStatus = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  /** One automatic preview per canonical URL until the user edits the field. */
  const lastPreviewCanonicalRef = useRef<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    monthlyRentMan: "",
    addressText: "",
    sourceUrl: "",
    reikinMonths: "",
    securityDepositMonths: "",
    squareM: "",
    closestStation: "",
    walkingTimeMin: "",
    availability: undefined as "募集中" | "契約済" | undefined,
    propertyType: undefined as "一戸建て" | "アパート" | undefined,
    interest: undefined as (typeof interestOptions)[number] | undefined,
    prefecture: "",
    municipality: "",
    town: "",
    district: "",
    block: "",
    houseNumber: "",
  });

  const [debouncedSourceUrl, setDebouncedSourceUrl] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSourceUrl(form.sourceUrl.trim()), 550);
    return () => clearTimeout(id);
  }, [form.sourceUrl]);

  const conflictQueryEnabled =
    Boolean(debouncedSourceUrl) && isSupportedListingHostUrl(debouncedSourceUrl);
  const conflictQuery = trpc.listing.sourceUrlConflict.useQuery(
    { url: debouncedSourceUrl },
    { enabled: conflictQueryEnabled },
  );
  const sourceUrlTaken = conflictQueryEnabled && conflictQuery.data?.exists === true;
  const blockSubmitForUrlConflict =
    sourceUrlTaken ||
    (conflictQueryEnabled && (conflictQuery.isLoading || conflictQuery.isFetching));

  const propertyAssociationActive = Boolean(selectedPropertyId);
  const defaults = selectedPropertyDefaults;
  const districtLocked = propertyAssociationActive && defaults?.district != null;
  const blockLocked = propertyAssociationActive && defaults?.block != null;
  const houseLocked = propertyAssociationActive && defaults?.houseNumber != null;
  const propertyTypeLockedFull = propertyAssociationActive && defaults?.propertyType != null;
  const interestLockedFull = propertyAssociationActive && defaults?.interest != null;
  const commitManualAddress = () => {
    const prefecture = form.prefecture.trim();
    const municipality = form.municipality.trim();
    const town = form.town.trim();
    if (!prefecture || !municipality || !town) return;
    onManualAddressCommit?.({ prefecture, municipality, town });
  };
  useEffect(() => {
    if (!propertyAssociationActive || !selectedPropertyDefaults) return;
    setForm((s) => ({
      ...s,
      prefecture: selectedPropertyDefaults.prefecture ?? s.prefecture,
      municipality: selectedPropertyDefaults.municipality ?? s.municipality,
      town: selectedPropertyDefaults.town ?? s.town,
      district: toInputValue(selectedPropertyDefaults.district),
      block: toInputValue(selectedPropertyDefaults.block),
      houseNumber: toInputValue(selectedPropertyDefaults.houseNumber),
      propertyType: selectedPropertyDefaults.propertyType ?? s.propertyType,
      interest: selectedPropertyDefaults.interest ?? s.interest,
    }));
  }, [propertyAssociationActive, selectedPropertyDefaults]);

  function resetScrapedFieldsKeepingSourceUrl(sourceUrl: string) {
    setForm({
      title: "",
      monthlyRentMan: "",
      addressText: "",
      sourceUrl,
      reikinMonths: "",
      securityDepositMonths: "",
      squareM: "",
      closestStation: "",
      walkingTimeMin: "",
      availability: undefined,
      propertyType: undefined,
      interest: undefined,
      prefecture: "",
      municipality: "",
      town: "",
      district: "",
      block: "",
      houseNumber: "",
    });
  }

  useEffect(() => {
    if (!initialValues) return;
    setForm((s) => ({
      ...s,
      title: initialValues.title ?? "",
      monthlyRentMan:
        initialValues.monthlyRentYen !== undefined && initialValues.monthlyRentYen !== null
          ? yenToManInput(initialValues.monthlyRentYen)
          : "",
      addressText: initialValues.addressText ?? "",
      ...(initialValues.sourceUrl !== undefined ? { sourceUrl: initialValues.sourceUrl } : {}),
      reikinMonths: toInputValue(initialValues.reikinMonths),
      securityDepositMonths: toInputValue(initialValues.securityDepositMonths),
      squareM: toInputValue(initialValues.squareM),
      closestStation: initialValues.closestStation ?? "",
      walkingTimeMin: toInputValue(initialValues.walkingTimeMin),
      availability: initialValues.availability,
      propertyType: initialValues.propertyType,
      interest: initialValues.interest,
      prefecture: initialValues.prefecture ?? "",
      municipality: initialValues.municipality ?? "",
      town: initialValues.town ?? "",
      district: toInputValue(initialValues.district),
      block: toInputValue(initialValues.block),
      houseNumber: toInputValue(initialValues.houseNumber),
    }));
  }, [initialValues]);

  useEffect(() => {
    if (sourceUrlTaken) {
      lastPreviewCanonicalRef.current = null;
      onUrlPreviewClear?.();
    }
  }, [sourceUrlTaken, onUrlPreviewClear]);

  useEffect(() => {
    const url = debouncedSourceUrl;
    if (!onAutoPreviewFromUrl) {
      return;
    }
    if (!url || !isSupportedListingHostUrl(url)) {
      onUrlPreviewClear?.();
      lastPreviewCanonicalRef.current = null;
      return;
    }
    if (conflictQueryEnabled && (conflictQuery.isLoading || conflictQuery.isFetching)) {
      return;
    }
    if (sourceUrlTaken) {
      return;
    }
    let canonicalKey: string;
    try {
      canonicalKey = canonicalizeListingUrl(url);
    } catch {
      lastPreviewCanonicalRef.current = null;
      return;
    }
    if (lastPreviewCanonicalRef.current === canonicalKey) {
      return;
    }
    lastPreviewCanonicalRef.current = canonicalKey;
    onAutoPreviewFromUrl(url);
  }, [
    debouncedSourceUrl,
    onAutoPreviewFromUrl,
    onUrlPreviewClear,
    conflictQueryEnabled,
    conflictQuery.isLoading,
    conflictQuery.isFetching,
    sourceUrlTaken,
  ]);

  useEffect(() => {
    if (!onDraftForSimilarChange) return;
    const id = setTimeout(() => {
      const toNum = (s: string): number | undefined => {
        const t = s.trim();
        if (!t) return undefined;
        const n = Number(t);
        return Number.isFinite(n) ? n : undefined;
      };
      onDraftForSimilarChange({
        prefecture: form.prefecture,
        municipality: form.municipality,
        town: form.town,
        district: parseAddressInteger(form.district),
        block: parseAddressInteger(form.block),
        houseNumber: parseAddressInteger(form.houseNumber),
        squareM: toNum(form.squareM),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [
    onDraftForSimilarChange,
    form.prefecture,
    form.municipality,
    form.town,
    form.district,
    form.block,
    form.houseNumber,
    form.squareM,
  ]);

  const normalized = useMemo(() => {
    const toNumber = (value: string): number | undefined => {
      if (!value.trim()) return undefined;
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };
    const fallbackTitle = [form.prefecture, form.municipality, form.town, form.propertyType]
      .filter((v) => v && v.trim().length > 0)
      .join(" ")
      .trim();
    const fallbackAddress = [
      form.prefecture,
      form.municipality,
      form.town,
      form.district,
      form.block,
      form.houseNumber,
    ]
      .filter((v) => v && v.trim().length > 0)
      .join(" ")
      .trim();

    const rentYen = parseManToYen(form.monthlyRentMan);
    return {
      title: form.title.trim() || fallbackTitle || "Listing",
      monthlyRentYen: rentYen ?? Number.NaN,
      addressText: form.addressText.trim() || fallbackAddress || "Tokyo",
      sourceUrl: form.sourceUrl || undefined,
      reikinMonths: toNumber(form.reikinMonths),
      securityDepositMonths: toNumber(form.securityDepositMonths),
      squareM: toNumber(form.squareM),
      closestStation: form.closestStation || undefined,
      walkingTimeMin: toNumber(form.walkingTimeMin),
      availability: form.availability,
      propertyType: form.propertyType,
      interest: form.interest,
      prefecture: form.prefecture || undefined,
      municipality: form.municipality || undefined,
      town: form.town || undefined,
      district: parseAddressInteger(form.district),
      block: parseAddressInteger(form.block),
      houseNumber: parseAddressInteger(form.houseNumber),
      selectedPropertyId: selectedPropertyId ?? undefined,
    };
  }, [form, selectedPropertyId]);

  function submit() {
    if (requireSelections && (!form.propertyType || !form.availability || !form.interest)) {
      setError("Please select Property Type, Availability, and Interest before submitting.");
      return;
    }
    const parsed = listingCreateSchema.safeParse(normalized);
    if (!parsed.success) {
      setError(parsed.error.issues.map((e) => e.message).join("; "));
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  }

  const showMoreInfoHint =
    Boolean(loadFromUrlDebugCapture) &&
    loadFromUrlError === "Could not fetch the listing page. Please retry or enter fields manually.";

  const openDebugPath = (path: string) => {
    if (typeof window === "undefined") return;
    window.open(path, "_blank", "noopener,noreferrer");
  };

  const openDiagnostics = () => {
    if (!loadFromUrlDebugCapture) return;
    openDebugPath(`/api/scrape-debug/${loadFromUrlDebugCapture.captureId}/diagnostics`);
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1.5">
        <Text className="text-xs text-rose-pine-text">Listing URL</Text>
        <View className="h-[10px] w-[10px] shrink-0 items-center justify-center overflow-visible">
          {urlPreviewStatus === "loading" ||
          (conflictQueryEnabled && (conflictQuery.isLoading || conflictQuery.isFetching)) ? (
            <ActivityIndicator
              color="#9ccfd8"
              size="small"
              style={{ transform: [{ scale: 0.42 }] }}
            />
          ) : null}
        </View>
      </View>
      <View className="flex-row gap-1">
        <TextInput
          className={urlFieldClassForPreviewStatus(urlPreviewStatus, sourceUrlTaken)}
          placeholder="Enter URL"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.sourceUrl}
          onChangeText={(sourceUrl) => {
            const normalizedUrl = canonicalizeIfSupported(sourceUrl);
            lastPreviewCanonicalRef.current = null;
            resetScrapedFieldsKeepingSourceUrl(normalizedUrl);
            onSourceUrlTextChange?.();
          }}
        />
        {showSimilarPropertiesButton ? (
          <View
            ref={similarPropertiesButtonRef}
            collapsable={false}
            className={`h-[34px] w-[44px] select-none rounded-md outline-none ${
              similarPropertyCandidateCount <= 0 || !onSimilarPropertiesButtonPress
                ? "border border-rose-pine-highlight-med bg-rose-pine-overlay opacity-50"
                : similarPropertiesMenuOpen
                  ? "border border-rose-pine-foam bg-rose-pine-surface ring-1 ring-rose-pine-foam/30"
                  : "border border-rose-pine-highlight-med bg-rose-pine-surface"
            }`}
          >
            <Pressable
              accessibilityLabel="Similar properties"
              accessibilityState={{ expanded: similarPropertiesMenuOpen }}
              className="h-full w-full select-none items-center justify-center px-1 outline-none active:opacity-90"
              disabled={similarPropertyCandidateCount <= 0 || !onSimilarPropertiesButtonPress}
              onPress={() => onSimilarPropertiesButtonPress?.()}
            >
              <Text className="text-lg leading-none select-none" selectable={false}>
                🏢
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {sourceUrlTaken ? (
        <Text className="text-xs text-rose-pine-love">
          A listing with this source URL already exists.
        </Text>
      ) : null}
      {showMoreInfoHint ? (
        <View className="flex-row flex-wrap items-center gap-1">
          <Text className="text-xs text-rose-pine-love">Could not fetch the listing page.</Text>
          <Pressable onPress={openDiagnostics}>
            <Text className="text-xs text-rose-pine-foam underline">More info.</Text>
          </Pressable>
        </View>
      ) : null}
      {loadFromUrlError && !showMoreInfoHint ? (
        <Text className="text-xs text-rose-pine-love">{loadFromUrlError}</Text>
      ) : null}
      {loadFromUrlPreviewStatus === "partial" ? (
        <Text className="text-xs text-rose-pine-gold">
          Partial preview loaded. Some fields need manual review.
        </Text>
      ) : null}
      {loadFromUrlWarnings.length > 0 ? (
        <Text className="text-xs text-rose-pine-muted">{loadFromUrlWarnings.join(" · ")}</Text>
      ) : null}
      {Object.keys(loadFromUrlFieldErrors).length > 0 ? (
        <Text className="text-xs text-rose-pine-muted">
          {Object.entries(loadFromUrlFieldErrors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(" · ")}
        </Text>
      ) : null}
      <View className="hidden">
        <TextInput
          className={inputClass}
          placeholder="Title"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.title}
          onChangeText={(title) => setForm((s) => ({ ...s, title }))}
        />
      </View>
      <View className="hidden">
        <TextInput
          className={inputClass}
          placeholder="Address text"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.addressText}
          onChangeText={(addressText) => setForm((s) => ({ ...s, addressText }))}
        />
      </View>
      <View className="min-w-0 flex-row flex-nowrap gap-1 pt-0.5">
        <Text className={labelClass} numberOfLines={1}>
          Monthly Rent
        </Text>
        <Text className={labelClass} numberOfLines={1}>
          礼金
        </Text>
        <Text className={labelClass} numberOfLines={1}>
          敷金
        </Text>
      </View>
      <View className="min-w-0 flex-row flex-nowrap gap-1">
        <TextInput
          className={fieldCell}
          inputMode="decimal"
          placeholder="万円"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.monthlyRentMan}
          onChangeText={(monthlyRentMan) => setForm((s) => ({ ...s, monthlyRentMan }))}
        />
        <TextInput
          className={fieldCell}
          inputMode="decimal"
          placeholder="家賃の何ヶ月分"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.reikinMonths}
          onChangeText={(reikinMonths) => setForm((s) => ({ ...s, reikinMonths }))}
        />
        <TextInput
          className={fieldCell}
          inputMode="decimal"
          placeholder="家賃の何ヶ月分"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.securityDepositMonths}
          onChangeText={(securityDepositMonths) =>
            setForm((s) => ({ ...s, securityDepositMonths }))
          }
        />
      </View>
      <View className="min-w-0 flex-row flex-nowrap gap-1 pt-0.5">
        <Text className={labelClass} numberOfLines={1}>
          面積
        </Text>
        <Text className={labelClass} numberOfLines={1}>
          Station
        </Text>
        <Text className={labelClass} numberOfLines={1}>
          Walk
        </Text>
      </View>
      <View className="min-w-0 flex-row flex-nowrap gap-1">
        <TextInput
          className={fieldCell}
          inputMode="decimal"
          placeholder="m²"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.squareM}
          onChangeText={(squareM) => setForm((s) => ({ ...s, squareM }))}
        />
        <TextInput
          className={fieldCell}
          placeholder="Station Name"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.closestStation}
          onChangeText={(closestStation) => setForm((s) => ({ ...s, closestStation }))}
        />
        <TextInput
          className={fieldCell}
          inputMode="numeric"
          placeholder="Minutes"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.walkingTimeMin}
          onChangeText={(walkingTimeMin) => setForm((s) => ({ ...s, walkingTimeMin }))}
        />
      </View>
      <View className="min-w-0 gap-1.5">
        <View className="min-w-0 flex-row flex-nowrap gap-1 pt-0.5">
          <Text accessibilityLabel="Prefecture" className={labelClass} numberOfLines={1}>
            Pref
          </Text>
          <Text accessibilityLabel="City" className={labelClass} numberOfLines={1}>
            City
          </Text>
          <Text accessibilityLabel="Town" className={labelClass} numberOfLines={1}>
            Town
          </Text>
          <Text accessibilityLabel="District" className={labelClass} numberOfLines={1}>
            Dist
          </Text>
          <Text accessibilityLabel="Block" className={labelClass} numberOfLines={1}>
            Block
          </Text>
          <Text accessibilityLabel="House number" className={labelClass} numberOfLines={1}>
            House
          </Text>
        </View>
        <View className="min-w-0 flex-row flex-nowrap gap-1 overflow-x-auto">
          <TextInput
            className={propertyAssociationActive ? associationLockedFieldCell : fieldCell}
            placeholder="都 / 県"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.prefecture}
            editable={!propertyAssociationActive}
            onBlur={commitManualAddress}
            onChangeText={(prefecture) => setForm((s) => ({ ...s, prefecture }))}
          />
          <TextInput
            className={propertyAssociationActive ? associationLockedFieldCell : fieldCell}
            placeholder="市 / 区"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.municipality}
            editable={!propertyAssociationActive}
            onBlur={commitManualAddress}
            onChangeText={(municipality) => setForm((s) => ({ ...s, municipality }))}
          />
          <TextInput
            className={propertyAssociationActive ? associationLockedFieldCell : fieldCell}
            placeholder="町"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.town}
            editable={!propertyAssociationActive}
            onBlur={commitManualAddress}
            onChangeText={(town) => setForm((s) => ({ ...s, town }))}
          />
          <TextInput
            className={districtLocked ? associationLockedFieldCell : fieldCell}
            placeholder="丁目"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.district}
            editable={!districtLocked}
            onChangeText={(district) => setForm((s) => ({ ...s, district }))}
          />
          <TextInput
            className={blockLocked ? associationLockedFieldCell : fieldCell}
            placeholder="番"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.block}
            editable={!blockLocked}
            onChangeText={(block) => setForm((s) => ({ ...s, block }))}
          />
          <TextInput
            className={houseLocked ? associationLockedFieldCell : fieldCell}
            placeholder="号"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.houseNumber}
            editable={!houseLocked}
            onChangeText={(houseNumber) => setForm((s) => ({ ...s, houseNumber }))}
          />
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <PreferenceToggleGroup
            label="Availability"
            values={availabilityOptions}
            selected={form.availability}
            onSelect={(availability) => setForm((s) => ({ ...s, availability }))}
          />
        </View>
        <View className="flex-1">
          <PreferenceToggleGroup
            label="Property type"
            values={propertyTypeOptions}
            selected={form.propertyType}
            onSelect={
              propertyTypeLockedFull
                ? () => {}
                : (propertyType) => setForm((s) => ({ ...s, propertyType }))
            }
          />
        </View>
      </View>
      <View className="gap-1.5">
        <View className="flex-1">
          <PreferenceToggleGroup
            label="Interest"
            values={interestOptions}
            selected={form.interest}
            onSelect={
              interestLockedFull
                ? () => {}
                : (interest) => setForm((s) => ({ ...s, interest }))
            }
          />
        </View>
      </View>
      {error ? <Text className="text-sm text-rose-pine-love">{error}</Text> : null}
      <View className="mt-[15px] flex-row justify-center gap-2 pt-0">
        <Pressable
          className="items-center rounded-lg bg-rose-pine-foam px-4 py-2.5 active:opacity-80 disabled:opacity-50"
          disabled={pending || blockSubmitForUrlConflict}
          onPress={submit}
        >
          <Text className="text-xs font-semibold text-rose-pine-base">
            {pending ? "Saving…" : submitLabel}
          </Text>
        </Pressable>
        {secondaryAction ? (
          <Pressable
            className={`items-center rounded-lg px-4 py-2.5 active:opacity-80 ${secondaryAction.destructive ? "bg-rose-pine-love" : "bg-rose-pine-foam"}`}
            disabled={pending || secondaryAction.disabled}
            onPress={secondaryAction.onPress}
          >
            <Text
              className={`text-xs font-semibold ${secondaryAction.destructive ? "text-rose-pine-base" : "text-rose-pine-base"}`}
            >
              {secondaryAction.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
