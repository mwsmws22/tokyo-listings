"use client";

import { Text, TextInput, View } from "react-native";
import {
  PreferenceToggleGroup,
} from "@/components/listing/ListingPreferenceToggles";

export type HomeListingFiltersState = {
  propertyType?: "一戸建て" | "アパート";
  availability?: "募集中" | "契約済";
  interest?: "Top" | "Extremely" | "KindaPlus" | "KindaMinus" | "Nah";
  prefecture: string;
  municipality: string;
  town: string;
  district: string;
  block: string;
};

type Props = {
  value: HomeListingFiltersState;
  onChange: (next: HomeListingFiltersState) => void;
};

const options = {
  propertyType: ["一戸建て", "アパート"] as const,
  availability: ["募集中", "契約済"] as const,
  interest: ["Top", "Extremely", "KindaPlus", "KindaMinus", "Nah"] as const,
};

export function HomeListingFilters({ value, onChange }: Props) {
  const inputClass =
    "min-w-0 rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-foam focus:ring-1 focus:ring-rose-pine-foam/30";

  const labelClass =
    "min-w-0 flex-1 text-left text-[10px] leading-tight text-rose-pine-text md:text-xs";

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <PreferenceToggleGroup
            label="Property type"
            values={options.propertyType}
            selected={value.propertyType}
            onSelect={(next) => onChange({ ...value, propertyType: next })}
          />
        </View>
        <View className="flex-1">
          <PreferenceToggleGroup
            label="Availability"
            values={options.availability}
            selected={value.availability}
            onSelect={(next) => onChange({ ...value, availability: next })}
          />
        </View>
      </View>
      <PreferenceToggleGroup
        label="Interest"
        values={options.interest}
        selected={value.interest}
        onSelect={(next) => onChange({ ...value, interest: next })}
      />
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
        </View>
        {/* Single row: min-w-0 + flex-1 on each field prevents flex overflow in the sidebar */}
        <View className="min-w-0 flex-row flex-nowrap gap-1 overflow-x-auto">
          <TextInput
            className={`${inputClass} min-w-[3.25rem] shrink grow basis-0`}
            placeholder="都 / 県"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={value.prefecture}
            onChangeText={(prefecture) => onChange({ ...value, prefecture })}
          />
          <TextInput
            className={`${inputClass} min-w-[3.25rem] shrink grow basis-0`}
            placeholder="市 / 区"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={value.municipality}
            onChangeText={(municipality) => onChange({ ...value, municipality })}
          />
          <TextInput
            className={`${inputClass} min-w-[3.25rem] shrink grow basis-0`}
            placeholder="町"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={value.town}
            onChangeText={(town) => onChange({ ...value, town })}
          />
          <TextInput
            className={`${inputClass} min-w-[3.25rem] shrink grow basis-0`}
            placeholder="丁目"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={value.district}
            onChangeText={(district) => onChange({ ...value, district })}
          />
          <TextInput
            className={`${inputClass} min-w-[3.25rem] shrink grow basis-0`}
            placeholder="番"
            placeholderTextColor="var(--color-rose-pine-muted)"
            value={value.block}
            onChangeText={(block) => onChange({ ...value, block })}
          />
        </View>
      </View>
    </View>
  );
}
