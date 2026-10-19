import "server-only";

import { cache } from "react";
import {
  createCachedEventDetailsLoader,
  loadEventDetails,
  type EventDetailsLoadFailure,
} from "./event-details-loader";
import { API_BASE_URL } from "./site-config";

function observeLoadFailure(error: EventDetailsLoadFailure) {
  console.error("[invite-details] API load failed", {
    kind: error.kind,
    status: error.status,
  });
}

export const getEventDetails = createCachedEventDetailsLoader(
  cache,
  (slug, guest) =>
    loadEventDetails(slug, guest, {
      apiBaseUrl: API_BASE_URL,
      onFailure: observeLoadFailure,
    }),
);
