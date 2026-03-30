"use client";

import { listingCreateSchema } from "@tokyo-listings/validators/listing";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export type ListingCreateParityInput = {
  title: string;
  monthlyRentYen: number;
  addressText: string;
  sourceUrl?: string;
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
  district?: string;
  block?: string;
  houseNumber?: string;
};

type Props = {
  onSubmit: (input: ListingCreateParityInput) => void;
  pending: boolean;
};

const inputClass =
  "rounded-lg border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-3 text-rose-pine-text";

const interestOptions = ["Top", "Extremely", "KindaPlus", "KindaMinus", "Nah"] as const;

export function ListingFormParity({ onSubmit, pending }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    monthlyRentYen: "",
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

  const normalized = useMemo(() => {
    const toNumber = (value: string): number | undefined => {
      if (!value.trim()) return undefined;
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      title: form.title,
      monthlyRentYen: Number.parseInt(form.monthlyRentYen, 10),
      addressText: form.addressText,
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
      district: form.district || undefined,
      block: form.block || undefined,
      houseNumber: form.houseNumber || undefined,
    };
  }, [form]);

  function submit() {
    const parsed = listingCreateSchema.safeParse(normalized);
    if (!parsed.success) {
      setError(parsed.error.issues.map((e) => e.message).join("; "));
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  }

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-rose-pine-text">Add listing</Text>
      <TextInput
        className={inputClass}
        placeholder="Title"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={form.title}
        onChangeText={(title) => setForm((s) => ({ ...s, title }))}
      />
      <TextInput
        className={inputClass}
        inputMode="numeric"
        placeholder="Monthly rent (JPY)"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={form.monthlyRentYen}
        onChangeText={(monthlyRentYen) => setForm((s) => ({ ...s, monthlyRentYen }))}
      />
      <TextInput
        className={`${inputClass} min-h-[70px]`}
        multiline
        placeholder="Address text"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={form.addressText}
        onChangeText={(addressText) => setForm((s) => ({ ...s, addressText }))}
      />
      <TextInput
        className={inputClass}
        placeholder="Source URL (optional)"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={form.sourceUrl}
        onChangeText={(sourceUrl) => setForm((s) => ({ ...s, sourceUrl }))}
      />
      <View className="flex-row gap-2">
        <TextInput
          className={`${inputClass} flex-1`}
          inputMode="decimal"
          placeholder="礼金"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.reikinMonths}
          onChangeText={(reikinMonths) => setForm((s) => ({ ...s, reikinMonths }))}
        />
        <TextInput
          className={`${inputClass} flex-1`}
          inputMode="decimal"
          placeholder="敷金"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.securityDepositMonths}
          onChangeText={(securityDepositMonths) =>
            setForm((s) => ({ ...s, securityDepositMonths }))
          }
        />
      </View>
      <View className="flex-row gap-2">
        <TextInput
          className={`${inputClass} flex-1`}
          inputMode="decimal"
          placeholder="Area ㎡"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.squareM}
          onChangeText={(squareM) => setForm((s) => ({ ...s, squareM }))}
        />
        <TextInput
          className={`${inputClass} flex-1`}
          inputMode="numeric"
          placeholder="Walk min"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.walkingTimeMin}
          onChangeText={(walkingTimeMin) => setForm((s) => ({ ...s, walkingTimeMin }))}
        />
      </View>
      <TextInput
        className={inputClass}
        placeholder="Closest station"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={form.closestStation}
        onChangeText={(closestStation) => setForm((s) => ({ ...s, closestStation }))}
      />
      <View className="flex-row gap-2">
        <Pressable
          className={`rounded-md border px-3 py-2 ${form.availability === "募集中" ? "border-rose-pine-foam" : "border-rose-pine-highlight-med"}`}
          onPress={() => setForm((s) => ({ ...s, availability: "募集中" }))}
        >
          <Text className="text-rose-pine-text">募集中</Text>
        </Pressable>
        <Pressable
          className={`rounded-md border px-3 py-2 ${form.availability === "契約済" ? "border-rose-pine-foam" : "border-rose-pine-highlight-med"}`}
          onPress={() => setForm((s) => ({ ...s, availability: "契約済" }))}
        >
          <Text className="text-rose-pine-text">契約済</Text>
        </Pressable>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          className={`rounded-md border px-3 py-2 ${form.propertyType === "一戸建て" ? "border-rose-pine-foam" : "border-rose-pine-highlight-med"}`}
          onPress={() => setForm((s) => ({ ...s, propertyType: "一戸建て" }))}
        >
          <Text className="text-rose-pine-text">一戸建て</Text>
        </Pressable>
        <Pressable
          className={`rounded-md border px-3 py-2 ${form.propertyType === "アパート" ? "border-rose-pine-foam" : "border-rose-pine-highlight-med"}`}
          onPress={() => setForm((s) => ({ ...s, propertyType: "アパート" }))}
        >
          <Text className="text-rose-pine-text">アパート</Text>
        </Pressable>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {interestOptions.map((option) => (
          <Pressable
            key={option}
            className={`rounded-md border px-3 py-2 ${form.interest === option ? "border-rose-pine-foam" : "border-rose-pine-highlight-med"}`}
            onPress={() => setForm((s) => ({ ...s, interest: option }))}
          >
            <Text className="text-rose-pine-text">{option}</Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-2">
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="Prefecture"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.prefecture}
          onChangeText={(prefecture) => setForm((s) => ({ ...s, prefecture }))}
        />
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="Municipality"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.municipality}
          onChangeText={(municipality) => setForm((s) => ({ ...s, municipality }))}
        />
      </View>
      <View className="flex-row gap-2">
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="Town"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.town}
          onChangeText={(town) => setForm((s) => ({ ...s, town }))}
        />
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="District"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.district}
          onChangeText={(district) => setForm((s) => ({ ...s, district }))}
        />
      </View>
      <View className="flex-row gap-2">
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="Block"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.block}
          onChangeText={(block) => setForm((s) => ({ ...s, block }))}
        />
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="House number"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.houseNumber}
          onChangeText={(houseNumber) => setForm((s) => ({ ...s, houseNumber }))}
        />
      </View>
      {error ? <Text className="text-sm text-rose-pine-love">{error}</Text> : null}
      <Pressable
        className="items-center rounded-lg bg-rose-pine-highlight-med px-4 py-3 active:opacity-80 disabled:opacity-50"
        disabled={pending}
        onPress={submit}
      >
        <Text className="font-semibold text-rose-pine-text">
          {pending ? "Saving…" : "Create listing"}
        </Text>
      </Pressable>
    </View>
  );
}
