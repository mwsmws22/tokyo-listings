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
  }, []);

  const onDraftForSimilarChange = useCallback((draft: SimilarPropertiesDraft) => {
    setSimilarDraft(draft);
  }, []);

  const onSelectSimilarProperty = useCallback(
    (propertyId: string) => {
      const rows = listingsForMap.data ?? [];
      const row = rows.find((r) => r.property?.id === propertyId);
      if (row) {
        setSelectedId(row.id);
        setSelectedPreview(row);
      }
    },
    [listingsForMap.data, setSelectedId, setSelectedPreview],
  );

  const updateSimilarAnchor = useCallback(() => {
    const r = readSimilarButtonRect(similarBtnRef.current);
    if (r) setSimilarAnchorRect(r);
  }, []);

  const onSimilarPropertiesButtonPress = useCallback(() => {
    if (similarCount === 0) return;
    if (similarPickerOpen) {
      setSimilarPickerOpen(false);
      return;
    }
    updateSimilarAnchor();
    setSimilarPickerOpen(true);
  }, [similarCount, similarPickerOpen, updateSimilarAnchor]);

  useEffect(() => {
    if (similarCount === 0) {
      setSimilarPickerOpen(false);
    }
  }, [similarCount]);

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
        leftPane={
          <ScrollView className="max-h-[45vh] md:max-h-none">
            <View className="gap-3 px-3 py-2.5">
              <Text className="text-center text-2xl font-normal text-rose-pine-text">
                Add a Listing
              </Text>
              <ListingFormParity
                initialValues={prefill}
                pending={createMut.isPending}
                onAutoPreviewFromUrl={onAutoPreviewFromUrl}
                onUrlPreviewClear={onUrlPreviewClear}
                onSourceUrlTextChange={onSourceUrlTextChange}
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
        onSelectProperty={onSelectSimilarProperty}
      />
    </>
  );
}
