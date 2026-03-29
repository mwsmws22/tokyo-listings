"use client";

import { Pressable, Text, View } from "react-native";

type Props = {
  selectedListingId: string | null;
  adjustPin: boolean;
  onAdjustPinChange: (value: boolean) => void;
};

export function PinAdjustControls({ selectedListingId, adjustPin, onAdjustPinChange }: Props) {
  const canAdjust = selectedListingId !== null;

  return (
    <View className="gap-2 border-t border-rose-pine-highlight-med pt-3">
      <Text className="text-sm font-semibold text-rose-pine-text">Pin position</Text>
      <Text className="text-xs text-rose-pine-muted">
        Select a listing with coordinates on the map, enable adjust, then drag its marker. Save is
        automatic when you release the pin.
      </Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: adjustPin, disabled: !canAdjust }}
        className={`self-start rounded-lg border px-3 py-2 ${
          canAdjust ? "border-rose-pine-foam" : "border-rose-pine-highlight-med opacity-50"
        }`}
        disabled={!canAdjust}
        onPress={() => {
          onAdjustPinChange(!adjustPin);
        }}
      >
        <Text className="text-sm text-rose-pine-text">
          {adjustPin ? "Adjust mode: on" : "Adjust mode: off"}
        </Text>
      </Pressable>
    </View>
  );
}
