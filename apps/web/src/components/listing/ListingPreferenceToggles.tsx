import { Pressable, Text, View } from "react-native";

const selectedButtonClass = "bg-rose-pine-iris/70";
const unselectedButtonClass = "bg-rose-pine-base";
const borderClass = "border-rose-pine-highlight-med";
const selectedTextClass = "text-rose-pine-base font-semibold";
const unselectedTextClass = "text-rose-pine-text";

export function formatPreferenceLabel(value: string): string {
  if (value === "KindaPlus") return "Kinda+";
  if (value === "KindaMinus") return "Kinda-";
  return value;
}

export function PreferenceToggleGroup<T extends string>({
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
      <View className={`flex-row overflow-hidden rounded-md border ${borderClass}`}>
        {values.map((value, index) => {
          const active = selected === value;
          return (
            <Pressable
              key={value}
              className={`flex-1 items-center px-2 py-1.5 ${active ? selectedButtonClass : unselectedButtonClass} ${index > 0 ? `border-l ${borderClass}` : ""}`}
              onPress={() => onSelect(active ? undefined : value)}
            >
              <Text className={`text-[11px] ${active ? selectedTextClass : unselectedTextClass}`}>
                {formatPreferenceLabel(value)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
