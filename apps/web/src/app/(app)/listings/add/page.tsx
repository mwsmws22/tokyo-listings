"use client";

import type { ListingCreateParityInput } from "@/components/listing/ListingFormParity";
import { ListingFormParity } from "@/components/listing/ListingFormParity";
import { SimilarPropertiesPicker } from "@/components/listing/SimilarPropertiesPicker";
import { ListingsMapWorkspace } from "@/components/shell/ListingsMapWorkspace";
import {
  type PreviewStatus,
  createPreviewSuccessState,
  preservePreviewStateOnFailure,
} from "@/lib/listing/previewState";
import { type SimilarPropertiesDraft, similarDraftIsQueryable } from "@/lib/similarDraft";
import type { SimilarPropertiesAnchorRect } from "@/lib/similarPropertiesUi";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import type { ListingRow } from "@/types/trpc";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

function readSimilarButtonRect(node: View | null): SimilarPropertiesAnchorRect | null {
  if (!node) return null;
  const el = node as unknown as HTMLElement | null;
  if (el?.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  return null;
}

export default function AddListingsPage() {
  const [recent, setRecent] = useState<ListingRow[]>([]);
  const [prefill, setPrefill] = useState<Partial<ListingCreateParityInput> | undefined>();
  const [scrapeMeta, setScrapeMeta] = useState<{
    portal?: "athome" | "suumo" | "lifull_homes";
    fetchedAt?: Date;
  }>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarnings, setLoadWarnings] = useState<string[]>([]);
  const [loadFieldErrors, setLoadFieldErrors] = useState<Record<string, string>>({});
  const [loadPreviewStatus, setLoadPreviewStatus] = useState<PreviewStatus>(null);
  const [mapPreviewAddress, setMapPreviewAddress] = useState<string | null>(null);
  const [urlPreviewStatus, setUrlPreviewStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [similarDraft, setSimilarDraft] = useState<SimilarPropertiesDraft>({});
  const [similarPickerOpen, setSimilarPickerOpen] = useState(false);
  const [draftPin, setDraftPin] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedPropertyDefaults, setSelectedPropertyDefaults] = useState<{
    prefecture?: string | null;
    municipality?: string | null;
    town?: string | null;
    district?: number | null;
    block?: number | null;
    houseNumber?: number | null;
    propertyType?: "一戸建て" | "アパート" | null;
    interest?: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah" | null;
  } | null>(null);
  const [similarAnchorRect, setSimilarAnchorRect] = useState<SimilarPropertiesAnchorRect | null>(
    null,
  );
  const similarBtnRef = useRef<View>(null);
  const utils = trpc.useUtils();

  const similarQuery = trpc.listing.findSimilarProperties.useQuery(similarDraft, {
    enabled: similarDraftIsQueryable(similarDraft),
  });
  const similarCount = similarQuery.data?.candidates.length ?? 0;

  const listingsForMap = trpc.listing.list.useQuery({});
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);

  const createMut = trpc.listing.create.useMutation({
    onSuccess: async (row) => {
      await utils.listing.list.invalidate();
      setRecent((prev) => [row as ListingRow, ...prev]);
      setSelectedPropertyId(null);
      setSelectedPropertyDefaults(null);
      setDraftPin(null);
      setSelectedId(row.id);
      setSelectedPreview(row as ListingRow);
    },
    onError: (err) => {
      setLoadError(err.message);
    },
  });

  const { mutate: previewFromUrlMutate } = trpc.listing.previewFromUrl.useMutation({
    onMutate: () => {
      setUrlPreviewStatus("loading");
      setMapPreviewAddress(null);
    },
    onSuccess: (res) => {
      if (
        res.status === "unsupported_host" ||
        res.status === "fetch_failed" ||
        res.status === "parse_failed"
      ) {
        const preserved = preservePreviewStateOnFailure({
          prefill,
          warnings: loadWarnings,
          fieldErrors: loadFieldErrors,
          status: loadPreviewStatus,
          mapPreviewAddress,
        });
        setLoadError(res.message);
        setPrefill(preserved.prefill);
        setLoadWarnings(preserved.warnings);
        setLoadFieldErrors(preserved.fieldErrors);
        setLoadPreviewStatus(preserved.status);
        setMapPreviewAddress(preserved.mapPreviewAddress);
        setScrapeMeta({});
        setUrlPreviewStatus("error");
        return;
      }
      setLoadError(null);
      setUrlPreviewStatus("success");
      const next = createPreviewSuccessState(res);
      setLoadWarnings(next.warnings);
      setLoadFieldErrors(next.fieldErrors);
      setLoadPreviewStatus(next.status);
      setScrapeMeta({ portal: res.portal, fetchedAt: new Date() });
      setMapPreviewAddress(next.mapPreviewAddress);
      setPrefill(next.prefill);
      if (next.prefill?.latitude != null && next.prefill?.longitude != null) {
        setDraftPin({ lat: next.prefill.latitude, lng: next.prefill.longitude });
      }
    },
    onError: (err) => {
      setLoadError(err.message);
      setUrlPreviewStatus("error");
    },
  });

  const onAutoPreviewFromUrl = useCallback(
    (url: string) => {
      setLoadError(null);
      previewFromUrlMutate({ url });
    },
    [previewFromUrlMutate],
  );

  const onUrlPreviewClear = useCallback(() => {
    setUrlPreviewStatus("idle");
    setMapPreviewAddress(null);
    setLoadWarnings([]);
    setLoadFieldErrors({});
    setLoadPreviewStatus(null);
  }, []);

  const onSourceUrlTextChange = useCallback(() => {
    setUrlPreviewStatus("idle");
    setLoadError(null);
    setLoadWarnings([]);
    setLoadFieldErrors({});
    setLoadPreviewStatus(null);
    setScrapeMeta({});
    setMapPreviewAddress(null);
    setSimilarDraft({});
    setSelectedPropertyId(null);
    setSelectedPropertyDefaults(null);
    setDraftPin(null);
  }, []);

  const onDraftForSimilarChange = useCallback((draft: SimilarPropertiesDraft) => {
    setSimilarDraft(draft);
  }, []);

  const onManualAddressCommit = useCallback(
    (parts: { prefecture: string; municipality: string; town: string }) => {
      setMapPreviewAddress(`${parts.prefecture}${parts.municipality}${parts.town}`);
    },
    [],
  );

  const onSelectSimilarProperty = useCallback(
    (propertyId: string) => {
      const isDeselecting = selectedPropertyId === propertyId;
      if (isDeselecting) {
        setSelectedPropertyId(null);
        setSelectedPropertyDefaults(null);
        setSelectedId(null);
        setSelectedPreview(null);
        return;
      }

      setSelectedPropertyId(propertyId);
      const candidate = (similarQuery.data?.candidates ?? []).find((c) => c.propertyId === propertyId);
      setSelectedPropertyDefaults(
        candidate
          ? {
              prefecture: candidate.prefecture,
              municipality: candidate.municipality,
              town: candidate.town,
              district: candidate.district,
              block: candidate.block,
              houseNumber: candidate.houseNumber,
              propertyType: candidate.propertyType,
              interest: candidate.interest,
            }
          : null,
      );
      const rows = listingsForMap.data ?? [];
      const row = rows.find((r) => r.property?.id === propertyId);
      if (row) {
        setSelectedId(row.id);
        setSelectedPreview(row);
        if (row.property?.latitude != null && row.property?.longitude != null) {
          setDraftPin({ lat: row.property.latitude, lng: row.property.longitude });
        }
      }
    },
    [listingsForMap.data, selectedPropertyId, setSelectedId, setSelectedPreview, similarQuery.data],
  );

  const onAddPinChange = useCallback((lat: number, lng: number) => {
    setDraftPin({ lat, lng });
  }, []);

  const updateSimilarAnchor = useCallback(() => {
    const r = readSimilarButtonRect(similarBtnRef.current);
    if (r) setSimilarAnchorRect(r);
  }, []);

  const onSimilarPropertiesButtonPress = useCallback(() => {
    if (similarCount === 0) return;
    if (similarPickerOpen) {
      setSimilarPickerOpen(false);
      setSelectedId(null);
      setSelectedPreview(null);
      return;
    }
    if (selectedPropertyId) {
      const rows = listingsForMap.data ?? [];
      const row = rows.find((r) => r.property?.id === selectedPropertyId);
      if (row) {
        setSelectedId(row.id);
        setSelectedPreview(row);
      }
    }
    updateSimilarAnchor();
    setSimilarPickerOpen(true);
  }, [
    listingsForMap.data,
    selectedPropertyId,
    setSelectedId,
    setSelectedPreview,
    similarCount,
    similarPickerOpen,
    updateSimilarAnchor,
  ]);

  useEffect(() => {
    if (similarCount === 0) {
      setSimilarPickerOpen(false);
      setSelectedPropertyId(null);
      setSelectedPropertyDefaults(null);
    }
  }, [similarCount, setSelectedId, setSelectedPreview]);

  useEffect(() => {
    if (!similarPickerOpen) return;
    updateSimilarAnchor();
    const fn = () => updateSimilarAnchor();
    window.addEventListener("resize", fn);
    window.addEventListener("scroll", fn, true);
    return () => {
      window.removeEventListener("resize", fn);
      window.removeEventListener("scroll", fn, true);
    };
  }, [similarPickerOpen, updateSimilarAnchor]);

  useEffect(() => {
    return () => {
      setRecent([]);
      setSelectedId(null);
      setSelectedPreview(null);
    };
  }, [setSelectedId, setSelectedPreview]);

  return (
    <>
      <ListingsMapWorkspace
        addListingMapAddress={mapPreviewAddress}
        enableAddPinPlacement
        lockAddPinPlacement={Boolean(selectedPropertyId)}
        onAddPinChange={onAddPinChange}
        addDraftPin={draftPin}
        showExistingPropertyPins={false}
        leftPane={
          <ScrollView className="max-h-[45vh] md:max-h-none">
            <View className="gap-3 px-3 py-2.5">
              <Text className="text-center text-2xl font-normal text-rose-pine-text">
                Add a Listing
              </Text>
              <ListingFormParity
                initialValues={prefill}
                pending={createMut.isPending}
                requireSelections={false}
                selectedPropertyId={selectedPropertyId}
                selectedPropertyDefaults={selectedPropertyDefaults}
                onAutoPreviewFromUrl={onAutoPreviewFromUrl}
                onUrlPreviewClear={onUrlPreviewClear}
                onSourceUrlTextChange={onSourceUrlTextChange}
                onManualAddressCommit={onManualAddressCommit}
                onDraftForSimilarChange={onDraftForSimilarChange}
                similarPropertyCandidateCount={similarCount}
                similarPropertiesButtonRef={similarBtnRef}
                similarPropertiesMenuOpen={similarPickerOpen}
                onSimilarPropertiesButtonPress={
                  similarCount > 0 ? onSimilarPropertiesButtonPress : undefined
                }
                urlPreviewStatus={urlPreviewStatus}
                loadFromUrlError={loadError}
                loadFromUrlWarnings={loadWarnings}
                loadFromUrlFieldErrors={loadFieldErrors}
                loadFromUrlPreviewStatus={loadPreviewStatus}
                onSubmit={(input) =>
                  createMut.mutate({
                    ...input,
                    latitude: draftPin?.lat,
                    longitude: draftPin?.lng,
                    pinExact: draftPin ? true : undefined,
                    selectedPropertyId: selectedPropertyId ?? undefined,
                    sourcePortal: scrapeMeta.portal,
                    sourceFetchedAt: scrapeMeta.fetchedAt,
                  })
                }
              />
              {recent.length > 0 ? (
                <View className="gap-2 pt-2">
                  <Text className="text-sm font-semibold text-rose-pine-text">
                    Recent submissions
                  </Text>
                  {recent.map((row) => (
                    <Pressable
                      key={row.id}
                      className="rounded-md border border-rose-pine-highlight-med px-3 py-2"
                      onPress={() => {
                        setSelectedId((prev) => (prev === row.id ? null : row.id));
                        setSelectedPreview((prev) => (prev?.id === row.id ? null : row));
                      }}
                    >
                      <Text className="font-medium text-rose-pine-text">{row.title}</Text>
                      <Text className="text-xs text-rose-pine-muted">
                        {row.monthlyRentYen.toLocaleString()} JPY
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </ScrollView>
        }
      />
      <SimilarPropertiesPicker
        visible={similarPickerOpen}
        anchorRect={similarAnchorRect}
        candidates={similarQuery.data?.candidates ?? []}
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={onSelectSimilarProperty}
      />
    </>
  );
}
