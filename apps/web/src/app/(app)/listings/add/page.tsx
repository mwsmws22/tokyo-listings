"use client";

import type { ListingCreateParityInput } from "@/components/listing/ListingFormParity";
import { ListingFormParity } from "@/components/listing/ListingFormParity";
import { ListingsMapWorkspace } from "@/components/shell/ListingsMapWorkspace";
import {
  createPreviewSuccessState,
  preservePreviewStateOnFailure,
  type PreviewStatus,
} from "@/lib/listing/previewState";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import type { ListingRow } from "@/types/trpc";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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
  const utils = trpc.useUtils();
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
  }, []);

  useEffect(() => {
    return () => {
      setRecent([]);
      setSelectedId(null);
      setSelectedPreview(null);
    };
  }, [setSelectedId, setSelectedPreview]);

  return (
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
  );
}
