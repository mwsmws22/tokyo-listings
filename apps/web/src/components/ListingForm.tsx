"use client";

import { trpc } from "@/lib/trpc/client";
import type { ListingRow } from "@/types/trpc";
import { listingCreateSchema, listingUpdateSchema } from "@tokyo-listings/validators/listing";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const inputClass =
  "rounded-lg border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-3 text-rose-pine-text";

type Props = {
  editing: ListingRow | null;
  onCancelEdit: () => void;
};

export function ListingForm({ editing, onCancelEdit }: Props) {
  const [title, setTitle] = useState("");
  const [rent, setRent] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const createMut = trpc.listing.create.useMutation({
    onSuccess: async () => {
      await utils.listing.list.invalidate();
      setTitle("");
      setRent("");
      setAddress("");
      setError(null);
    },
    onError: (e) => {
      setError(e.message);
    },
  });

  const updateMut = trpc.listing.update.useMutation({
    onSuccess: async () => {
      await utils.listing.list.invalidate();
      setError(null);
      onCancelEdit();
    },
    onError: (e) => {
      setError(e.message);
    },
  });

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setRent(String(editing.monthlyRentYen));
      setAddress(editing.addressText);
    } else {
      setTitle("");
      setRent("");
      setAddress("");
    }
    setError(null);
  }, [editing]);

  async function onSubmit() {
    setError(null);
    if (editing) {
      const rentNum = Number.parseInt(rent, 10);
      const parsed = listingUpdateSchema.safeParse({
        id: editing.id,
        title,
        monthlyRentYen: Number.isFinite(rentNum) ? rentNum : undefined,
        addressText: address,
      });
      if (!parsed.success) {
        setError(parsed.error.issues.map((e) => e.message).join("; "));
        return;
      }
      updateMut.mutate(parsed.data);
      return;
    }

    const rentNum = Number.parseInt(rent, 10);
    const parsed = listingCreateSchema.safeParse({
      title,
      monthlyRentYen: rentNum,
      addressText: address,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((e) => e.message).join("; "));
      return;
    }
    createMut.mutate(parsed.data);
  }

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <View className="gap-3 border-b border-rose-pine-highlight-med pb-4">
      <Text className="text-lg font-semibold text-rose-pine-text">
        {editing ? "Edit listing" : "New listing"}
      </Text>
      <View className="gap-2">
        <Text className="font-semibold text-rose-pine-text">Title</Text>
        <TextInput
          className={inputClass}
          placeholder="e.g. 1K near station"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={title}
          onChangeText={setTitle}
        />
      </View>
      <View className="gap-2">
        <Text className="font-semibold text-rose-pine-text">Monthly rent (JPY)</Text>
        <TextInput
          className={inputClass}
          inputMode="numeric"
          placeholder="120000"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={rent}
          onChangeText={setRent}
        />
      </View>
      <View className="gap-2">
        <Text className="font-semibold text-rose-pine-text">Address</Text>
        <TextInput
          className={`${inputClass} min-h-[88px]`}
          multiline
          placeholder="Full address in Japanese or English"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={address}
          onChangeText={setAddress}
        />
      </View>
      {error ? (
        <Text className="text-rose-pine-love" role="alert">
          {error}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          className="flex-1 items-center rounded-lg bg-rose-pine-highlight-med px-4 py-3 active:opacity-80 disabled:opacity-50"
          disabled={pending}
          onPress={() => void onSubmit()}
        >
          <Text className="font-semibold text-rose-pine-text">
            {pending ? "Saving…" : editing ? "Save changes" : "Create"}
          </Text>
        </Pressable>
        {editing ? (
          <Pressable
            className="items-center rounded-lg border border-rose-pine-highlight-med px-4 py-3 active:opacity-80"
            disabled={pending}
            onPress={onCancelEdit}
          >
            <Text className="font-semibold text-rose-pine-text">Cancel</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
