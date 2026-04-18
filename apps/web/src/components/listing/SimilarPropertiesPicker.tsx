"use client";

import {
  type SimilarPropertiesAnchorRect,
  computeSimilarPanelLeft,
  computeSimilarPanelMaxHeight,
} from "@/lib/similarPropertiesUi";
import { formatAddressPartsForDisplay, toFullWidthDash } from "@/lib/addressDisplay";
import type { FindSimilarPropertyCandidate } from "@tokyo-listings/validators/listing";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";

const MIN_PANEL_WIDTH = 280;

type Props = {
  visible: boolean;
  anchorRect: SimilarPropertiesAnchorRect | null;
  candidates: FindSimilarPropertyCandidate[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string) => void;
};

function formatAddressLine(c: FindSimilarPropertyCandidate): string {
  return formatAddressPartsForDisplay(c);
}

function formatSquareM(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return "—";
  return `${m}㎡`;
}

function formatAreaDiff(m: number | null): string | null {
  if (m == null || !Number.isFinite(m)) return null;
  return `${Number(m.toFixed(2))}㎡`;
}

export { similarPropertiesIconDisabled } from "@/lib/similarPropertiesUi";

export function SimilarPropertiesPicker({
  visible,
  anchorRect,
  candidates,
  selectedPropertyId,
  onSelectProperty,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-6)).current;
  const [mounted, setMounted] = useState(false);
  const [layout, setLayout] = useState({ left: 0, top: 0, maxHeight: 360 });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!visible || !anchorRect || typeof window === "undefined") {
      return;
    }
    const left = anchorRect.left + anchorRect.width + 8;
    const top = anchorRect.top;
    const maxHeight = computeSimilarPanelMaxHeight(anchorRect.top, window.innerHeight);
    setLayout({ left, top, maxHeight });
  }, [visible, anchorRect]);

  useEffect(() => {
    if (visible) {
      translateX.setValue(-6);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 100,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateX.setValue(-6);
    }
  }, [visible, opacity, translateX]);

  if (
    !mounted ||
    typeof document === "undefined" ||
    !visible ||
    !anchorRect ||
    candidates.length === 0
  ) {
    return null;
  }

  const panel = (
    <View
      pointerEvents="box-none"
      className="fixed z-[10050] flex w-max flex-col overflow-hidden rounded-lg border border-rose-pine-highlight-med bg-rose-pine-base shadow-xl"
      style={{
        left: layout.left,
        top: layout.top,
        minWidth: MIN_PANEL_WIDTH,
        maxWidth: window.innerWidth - 24,
        maxHeight: layout.maxHeight,
      }}
    >
      <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }}>
        <ScrollView style={{ maxHeight: layout.maxHeight }} className="px-1 py-1">
          {candidates.map((c, index) => {
            const rank = index + 1;
            const address = formatAddressLine(c);
            const isSelected = selectedPropertyId === c.propertyId;
            const sq = formatSquareM(c.averageSquareM);
            const delta =
              c.areaDiffAbs != null && Number.isFinite(c.areaDiffAbs)
                ? toFullWidthDash(`±${formatAreaDiff(c.areaDiffAbs)}`)
                : null;
            return (
              <Pressable
                key={c.propertyId}
                className={`mb-0.5 flex-row items-center gap-1 rounded px-1.5 py-0.5 select-none active:opacity-90 ${
                  isSelected
                    ? "border border-rose-pine-foam bg-rose-pine-foam/10"
                    : "border border-transparent bg-rose-pine-surface/80"
                }`}
                onPress={() => onSelectProperty(c.propertyId)}
              >
                <Text
                  className="w-5 shrink-0 text-[10px] font-semibold tabular-nums text-rose-pine-foam"
                  selectable={false}
                >
                  #{rank}
                </Text>
                <Text
                  className="min-w-0 flex-1 text-[10px] leading-snug text-rose-pine-text"
                  style={{ marginRight: 20 }}
                  numberOfLines={1}
                  selectable={false}
                >
                  {address}
                </Text>
                <Text
                  className="shrink-0 text-right text-[10px] leading-snug tabular-nums"
                  style={{ marginLeft: 0 }}
                  numberOfLines={1}
                  selectable={false}
                >
                  <Text className="font-medium text-rose-pine-text">{sq}</Text>
                  {delta ? (
                    <Text className="font-normal text-rose-pine-muted"> · {delta}</Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );

  return createPortal(panel, document.body);
}
