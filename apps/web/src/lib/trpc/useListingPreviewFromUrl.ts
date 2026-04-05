import { trpc } from "@/lib/trpc/client";

/** TanStack Query mutation wrapper for `listing.previewFromUrl`. */
export function useListingPreviewFromUrl() {
  return trpc.listing.previewFromUrl.useMutation();
}
