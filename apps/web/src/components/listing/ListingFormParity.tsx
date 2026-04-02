"use client";

import { listingCreateSchema } from "@tokyo-listings/validators/listing";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  PreferenceToggleGroup,
} from "@/components/listing/ListingPreferenceToggles";

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
  "min-w-0 rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-foam focus:ring-1 focus:ring-rose-pine-foam/30";

const labelClass =
  "min-w-0 flex-1 text-left text-[10px] leading-tight text-rose-pine-text md:text-xs";

const fieldCell = `${inputClass} min-w-[3.25rem] shrink grow basis-0`;

const interestOptions = ["Top", "Extremely", "KindaPlus", "KindaMinus", "Nah"] as const;
const availabilityOptions = ["募集中", "契約済"] as const;
const propertyTypeOptions = ["一戸建て", "アパート"] as const;

export function ListingFormParity({ onSubmit, pending }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
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

    return {
      title: form.title.trim() || fallbackTitle || "Listing",
      monthlyRentYen: Number.parseInt(form.monthlyRentYen, 10),
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
      district: form.district || undefined,
      block: form.block || undefined,
      houseNumber: form.houseNumber || undefined,
    };
  }, [form]);

  function submit() {
    if (!form.propertyType || !form.availability || !form.interest) {
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

  function setCoordinates() {
    setPinMessage("Pin placement is enabled from map interaction after selecting the listing.");
  }

  return (
    <View className="gap-2">
      <Text className="text-xs text-rose-pine-text">Listing URL</Text>
      <View className="flex-row gap-1">
        <TextInput
          className={`${inputClass} flex-1`}
          placeholder="Enter URL"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.sourceUrl}
          onChangeText={(sourceUrl) => setForm((s) => ({ ...s, sourceUrl }))}
        />
        <Pressable
          className="w-[84px] items-center justify-center rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-2 py-1.5"
          onPress={() => setPinMessage("DB duplicate check will be added in ingest phase.")}
        >
          <Text className="text-xs font-semibold text-rose-pine-text">Check DB</Text>
        </Pressable>
      </View>
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
          inputMode="numeric"
          placeholder="万円"
          placeholderTextColor="var(--color-rose-pine-muted)"
          value={form.monthlyRentYen}
          onChangeText={(monthlyRentYen) => setForm((s) => ({ ...s, monthlyRentYen }))}
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
            className={fieldCell}
            placeholder="都 / 県"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.prefecture}
            onChangeText={(prefecture) => setForm((s) => ({ ...s, prefecture }))}
          />
          <TextInput
            className={fieldCell}
            placeholder="市 / 区"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.municipality}
            onChangeText={(municipality) => setForm((s) => ({ ...s, municipality }))}
          />
          <TextInput
            className={fieldCell}
            placeholder="町"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.town}
            onChangeText={(town) => setForm((s) => ({ ...s, town }))}
          />
          <TextInput
            className={fieldCell}
            placeholder="丁目"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.district}
            onChangeText={(district) => setForm((s) => ({ ...s, district }))}
          />
          <TextInput
            className={fieldCell}
            placeholder="番"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.block}
            onChangeText={(block) => setForm((s) => ({ ...s, block }))}
          />
          <TextInput
            className={fieldCell}
            placeholder="号"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={form.houseNumber}
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
            onSelect={(propertyType) => setForm((s) => ({ ...s, propertyType }))}
          />
        </View>
      </View>
      <View className="gap-1.5">
        <View className="flex-1">
          <PreferenceToggleGroup
            label="Interest"
            values={interestOptions}
            selected={form.interest}
            onSelect={(interest) => setForm((s) => ({ ...s, interest }))}
          />
        </View>
      </View>
      {error ? <Text className="text-sm text-rose-pine-love">{error}</Text> : null}
      {pinMessage ? <Text className="text-xs text-rose-pine-muted">{pinMessage}</Text> : null}
      <View className="mt-[15px] flex-row justify-center gap-2 pt-0">
        <Pressable
          className="items-center rounded-lg bg-rose-pine-foam px-4 py-2.5 active:opacity-80 disabled:opacity-50"
          disabled={pending}
          onPress={submit}
        >
          <Text className="text-xs font-semibold text-rose-pine-base">
            {pending ? "Saving…" : "Submit"}
          </Text>
        </Pressable>
        <Pressable
          className="items-center rounded-lg bg-rose-pine-foam px-4 py-2.5 active:opacity-80"
          disabled={pending}
          onPress={setCoordinates}
        >
          <Text className="text-xs font-semibold text-rose-pine-base">Set Coordinates</Text>
        </Pressable>
      </View>
    </View>
  );
}
