/**
 * Server-side geocoding via Google Geocoding API (`GOOGLE_MAPS_API_KEY_SERVER`).
 */

export type GeocodeResult = {
  lat: number;
  lng: number;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY_SERVER;
  if (!key?.trim()) {
    return null;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as {
    status: string;
    results?: { geometry?: { location?: { lat: number; lng: number } } }[];
  };

  if (data.status !== "OK" || !data.results?.length) {
    return null;
  }

  const loc = data.results[0]?.geometry?.location;
  if (loc === undefined || loc === null) {
    return null;
  }

  return { lat: loc.lat, lng: loc.lng };
}
