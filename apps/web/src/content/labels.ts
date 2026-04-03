/**
 * JP/EN copy and unit hints — single glossary for the web app (constitution).
 */

/** Near Tokyo Station — default map center */
export const defaultMapCenter = { lat: 35.681236, lng: 139.767125 } as const;

/** Comfortable city block view */
export const defaultMapZoom = 14;

export const units = {
  /** Japanese yen */
  jpy: "JPY",
  /** Square metres */
  sqm: "㎡",
} as const;

export const listingsPageLabels = {
  headingEn: "Listings",
  headingJp: "物件",
  sidebarHintEn: "Create or edit a listing, then view it on the map.",
  sidebarHintJp: "物件を作成・編集して地図で確認できます。",
} as const;

export const mapLabels = {
  titleEn: "Map",
  titleJp: "地図",
  emptyTitleEn: "No listings yet",
  emptyTitleJp: "まだ物件がありません",
  emptyBodyEn: "Add a listing to see it here. Rent is shown in JPY; floor area uses ㎡.",
  emptyBodyJp: "物件を追加するとここに表示されます。家賃は JPY、面積は ㎡ で表記します。",
  addListingEn: "Add listing",
  addListingJp: "物件を追加",
} as const;
