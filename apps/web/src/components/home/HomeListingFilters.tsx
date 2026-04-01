"use client";

import { Pressable, Text, TextInput, View } from "react-native";

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

function formatToggleLabel(value: string): string {
  if (value === "KindaPlus") return "Kinda+";
  if (value === "KindaMinus") return "Kinda-";
  return value;
}

function ToggleGroup<T extends string>({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: readonly T[];
  selected: T | undefined;
  onSelect: (value: T | undefined) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs text-rose-pine-text">{label}</Text>
      <View className="flex-row overflow-hidden rounded-md border border-rose-pine-highlight-med">
        {values.map((value, index) => {
          const active = selected === value;
          return (
            <Pressable
              key={value}
              className={`flex-1 items-center px-2 py-1.5 ${active ? "bg-rose-pine-highlight-med/40" : "bg-rose-pine-base"} ${index > 0 ? "border-l border-rose-pine-highlight-med" : ""}`}
              onPress={() => onSelect(active ? undefined : value)}
            >
              <Text className="text-[11px] text-rose-pine-text">{formatToggleLabel(value)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function HomeListingFilters({ value, onChange }: Props) {
  const inputClass =
    "min-w-0 rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-1.5 py-1.5 text-xs text-rose-pine-text focus:outline-none focus:border-rose-pine-foam focus:ring-1 focus:ring-rose-pine-foam/30";

  const labelClass =
    "min-w-0 flex-1 text-left text-[10px] leading-tight text-rose-pine-text md:text-xs";

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <ToggleGroup
            label="Property type"
            values={options.propertyType}
            selected={value.propertyType}
            onSelect={(next) => onChange({ ...value, propertyType: next })}
          />
        </View>
        <View className="flex-1">
          <ToggleGroup
            label="Availability"
            values={options.availability}
            selected={value.availability}
            onSelect={(next) => onChange({ ...value, availability: next })}
          />
        </View>
      </View>
      <ToggleGroup
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
