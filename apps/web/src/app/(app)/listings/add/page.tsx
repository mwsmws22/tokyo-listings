"use client";

import type { ListingCreateParityInput } from "@/components/listing/ListingFormParity";
import { ListingFormParity } from "@/components/listing/ListingFormParity";
import { ListingsMapWorkspace } from "@/components/shell/ListingsMapWorkspace";
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
    },
    onSuccess: (res) => {
      if (
        res.status === "unsupported_host" ||
        res.status === "fetch_failed" ||
        res.status === "parse_failed"
      ) {
        setLoadError(res.message);
        setLoadWarnings([]);
        setScrapeMeta({});
        setUrlPreviewStatus("error");
        return;
      }
      setLoadError(null);
      setUrlPreviewStatus("success");
      setLoadWarnings(res.status === "partial" ? res.draft.warnings : []);
      setScrapeMeta({ portal: res.portal, fetchedAt: new Date() });
      const d = res.draft;
      setPrefill({
        title: d.title ?? "",
        monthlyRentYen: d.monthlyRentYen,
        addressText: d.addressText ?? "",
        reikinMonths: d.reikinMonths,
        securityDepositMonths: d.securityDepositMonths,
        squareM: d.squareM,
        closestStation: d.closestStation ?? "",
        walkingTimeMin: d.walkingTimeMin,
        availability: d.availability,
        propertyType: d.propertyType,
        prefecture: d.prefecture ?? "",
        municipality: d.municipality ?? "",
        town: d.town ?? "",
        district: d.district ?? "",
        block: d.block ?? "",
        houseNumber: d.houseNumber ?? "",
      });
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
              urlPreviewStatus={urlPreviewStatus}
              loadFromUrlError={loadError}
              loadFromUrlWarnings={loadWarnings}
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
