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
  onClear: () => void;
};

const options = {
  propertyType: ["一戸建て", "アパート"] as const,
  availability: ["募集中", "契約済"] as const,
  interest: ["Top", "Extremely", "KindaPlus", "KindaMinus", "Nah"] as const,
};

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
    <View className="gap-2">
      <Text className="text-sm font-semibold text-rose-pine-text">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {values.map((value) => {
          const active = selected === value;
          return (
            <Pressable
              key={value}
              className={`rounded-md border px-2 py-1 ${active ? "border-rose-pine-foam bg-rose-pine-surface" : "border-rose-pine-highlight-med"}`}
              onPress={() => onSelect(active ? undefined : value)}
            >
              <Text className="text-xs text-rose-pine-text">{value}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function HomeListingFilters({ value, onChange, onClear }: Props) {
  const inputClass =
    "rounded-md border border-rose-pine-highlight-med bg-rose-pine-surface px-3 py-2 text-rose-pine-text";

  return (
    <View className="gap-3">
      <Text className="text-lg font-semibold text-rose-pine-text">Filters</Text>
      <ToggleGroup
        label="Property type"
        values={options.propertyType}
        selected={value.propertyType}
        onSelect={(next) => onChange({ ...value, propertyType: next })}
      />
      <ToggleGroup
        label="Availability"
        values={options.availability}
        selected={value.availability}
        onSelect={(next) => onChange({ ...value, availability: next })}
      />
      <ToggleGroup
        label="Interest"
        values={options.interest}
        selected={value.interest}
        onSelect={(next) => onChange({ ...value, interest: next })}
      />
      <TextInput
        className={inputClass}
        placeholder="Prefecture"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={value.prefecture}
        onChangeText={(prefecture) => onChange({ ...value, prefecture })}
      />
      <TextInput
        className={inputClass}
        placeholder="Municipality"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={value.municipality}
        onChangeText={(municipality) => onChange({ ...value, municipality })}
      />
      <TextInput
        className={inputClass}
        placeholder="Town"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={value.town}
        onChangeText={(town) => onChange({ ...value, town })}
      />
      <TextInput
        className={inputClass}
        placeholder="District"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={value.district}
        onChangeText={(district) => onChange({ ...value, district })}
      />
      <TextInput
        className={inputClass}
        placeholder="Block"
        placeholderTextColor="var(--color-rose-pine-muted)"
        value={value.block}
        onChangeText={(block) => onChange({ ...value, block })}
      />
      <Pressable
        className="items-center rounded-md border border-rose-pine-highlight-med px-3 py-2"
        onPress={onClear}
      >
        <Text className="text-sm font-semibold text-rose-pine-text">Clear filters</Text>
      </Pressable>
    </View>
  );
}
