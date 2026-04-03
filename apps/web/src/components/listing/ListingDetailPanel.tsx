"use client";

import {
  type ListingCreateParityInput,
  ListingFormParity,
} from "@/components/listing/ListingFormParity";
import { formatAreaSqm, formatMonthsJa, formatRentYen } from "@/lib/listing-display";
import { trpc } from "@/lib/trpc/client";
import { selectedListingIdAtom, selectedListingPreviewAtom } from "@/state/selectedListing";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

function valueOrNA(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

export function ListingDetailPanel() {
  const [tab, setTab] = useState<"info" | "edit">("info");
  const selectedId = useAtomValue(selectedListingIdAtom);
  const setSelectedId = useSetAtom(selectedListingIdAtom);
  const setSelectedPreview = useSetAtom(selectedListingPreviewAtom);
  const preview = useAtomValue(selectedListingPreviewAtom);
  const listQuery = trpc.listing.list.useQuery({});
  const utils = trpc.useUtils();
  const listings = listQuery.data ?? [];
  const fallbackId = listings[0]?.id ?? null;
  const effectiveSelectedId = selectedId ?? fallbackId;
  const detailsQuery = trpc.listing.getById.useQuery(
    { id: effectiveSelectedId ?? "" },
    { enabled: Boolean(effectiveSelectedId) },
  );
  const row =
    detailsQuery.data ??
    preview ??
    (effectiveSelectedId ? listings.find((item) => item.id === effectiveSelectedId) : null);
  const selectedIndex = effectiveSelectedId
    ? listings.findIndex((item) => item.id === effectiveSelectedId)
    : -1;
  const updateMut = trpc.listing.update.useMutation({
    onSuccess: async () => {
      await utils.listing.list.invalidate();
      if (effectiveSelectedId) await utils.listing.getById.invalidate({ id: effectiveSelectedId });
      setTab("info");
    },
  });
  const deleteMut = trpc.listing.delete.useMutation({
    onSuccess: async () => {
      await utils.listing.list.invalidate();
      setSelectedId(null);
      setSelectedPreview(null);
      setTab("info");
    },
  });

  const editInitialValues = useMemo<Partial<ListingCreateParityInput>>(
    () => ({
      title: row?.title,
      monthlyRentYen: row?.monthlyRentYen,
      addressText: row?.addressText,
      sourceUrl: row?.sourceUrl ?? undefined,
      reikinMonths: row?.reikinMonths ? Number(row.reikinMonths) : undefined,
      securityDepositMonths: row?.securityDepositMonths
        ? Number(row.securityDepositMonths)
        : undefined,
      squareM: row?.squareM ? Number(row.squareM) : undefined,
      closestStation: row?.closestStation ?? undefined,
      walkingTimeMin: row?.walkingTimeMin ?? undefined,
      availability: row?.availability ?? undefined,
      propertyType: row?.property?.propertyType ?? undefined,
      interest: row?.property?.interest ?? undefined,
      prefecture: row?.property?.prefecture ?? undefined,
      municipality: row?.property?.municipality ?? undefined,
      town: row?.property?.town ?? undefined,
      district: row?.property?.district ?? undefined,
      block: row?.property?.block ?? undefined,
      houseNumber: row?.property?.houseNumber ?? undefined,
    }),
    [row],
  );

  if (!effectiveSelectedId) {
    return (
      <View className="gap-2">
        <Text className="font-semibold text-rose-pine-text">Listing details</Text>
        <Text className="text-sm text-rose-pine-muted">No listings available.</Text>
      </View>
    );
  }

  if (!row) {
    return <Text className="text-sm text-rose-pine-muted">Loading details…</Text>;
  }

  function selectListing(id: string) {
    setSelectedId(id);
    const match = listings.find((item) => item.id === id) ?? null;
    setSelectedPreview(match);
  }

  return (
    <View className="min-h-0 flex-1 gap-3">
      <View className="flex-row items-center justify-between border-b border-rose-pine-highlight-med pb-2">
        <Text className="text-base font-semibold text-rose-pine-text">
          Property #{selectedIndex >= 0 ? selectedIndex + 1 : "?"}
        </Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => setTab("info")}>
            <Text
              className={`text-sm ${tab === "info" ? "font-semibold text-rose-pine-foam" : "text-rose-pine-muted"}`}
            >
              Info
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab("edit")}>
            <Text
              className={`text-sm ${tab === "edit" ? "font-semibold text-rose-pine-foam" : "text-rose-pine-muted"}`}
            >
              Edit
            </Text>
          </Pressable>
        </View>
      </View>

      {tab === "info" ? (
        <>
          <Text className="text-center text-sm font-semibold text-rose-pine-text">Basic Info</Text>
          <View className="overflow-hidden rounded-md border border-rose-pine-highlight-med">
            <View className="flex-row">
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                Monthly Rent
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {formatRentYen(row.monthlyRentYen)}
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                礼金
              </Text>
              <Text className="w-1/4 border-b border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {formatMonthsJa(row.reikinMonths)}
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                敷金
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {formatMonthsJa(row.securityDepositMonths)}
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                面積
              </Text>
              <Text className="w-1/4 border-b border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {formatAreaSqm(row.squareM)}
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                Closest Station
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {valueOrNA(row.closestStation)}
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                Walking Time
              </Text>
              <Text className="w-1/4 border-b border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {valueOrNA(row.walkingTimeMin)}分
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                Availability
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {valueOrNA(row.availability)}
              </Text>
              <Text className="w-1/4 border-b border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                Interest
              </Text>
              <Text className="w-1/4 border-b border-rose-pine-highlight-med px-2 py-1 text-xs text-rose-pine-text">
                {valueOrNA(row.property?.interest)}
              </Text>
            </View>
            <View className="flex-row">
              <Text className="w-1/4 border-r border-rose-pine-highlight-med bg-rose-pine-overlay px-2 py-1 text-xs text-rose-pine-subtle">
                Address
              </Text>
              <Text className="w-3/4 px-2 py-1 text-xs text-rose-pine-text">
                {valueOrNA(row.addressText)}
              </Text>
            </View>
          </View>

          <Text className="text-center text-sm font-semibold text-rose-pine-text">Listings</Text>
          <ScrollView className="min-h-0 flex-1">
            <View className="overflow-hidden rounded-md border border-rose-pine-highlight-med">
              {listings.map((item, index) => (
                <Pressable
                  key={item.id}
                  className={`px-2.5 py-2 ${item.id === effectiveSelectedId ? "border-l-2 border-l-rose-pine-foam bg-rose-pine-foam/10" : "bg-rose-pine-base"} ${index < listings.length - 1 ? "border-b border-rose-pine-highlight-med" : ""}`}
                  onPress={() => selectListing(item.id)}
                >
                  <Text className="text-[11px] text-rose-pine-text" numberOfLines={1}>
                    {valueOrNA(item.sourceUrl)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <ScrollView className="min-h-0 flex-1">
          <Text className="pb-2 text-center text-sm font-semibold text-rose-pine-text">
            Edit Listing
          </Text>
          <ListingFormParity
            pending={updateMut.isPending}
            initialValues={editInitialValues}
            submitLabel="Update"
            showCheckDbButton={false}
            secondaryAction={{
              label: "Delete Listing",
              onPress: () => deleteMut.mutate({ id: effectiveSelectedId }),
              destructive: true,
              disabled: deleteMut.isPending,
            }}
            onSubmit={(input) =>
              updateMut.mutate({
                id: effectiveSelectedId,
                ...input,
              })
            }
          />
        </ScrollView>
      )}
    </View>
  );
}
