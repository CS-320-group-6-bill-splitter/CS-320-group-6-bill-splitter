"use client";

import { useAuth } from "@/context/auth-context";
import { ShorelineWaves } from "@/components/shoreline-waves";

// Renders the animated shoreline-wave band behind the global header on
// logged-in pages — same effect you see in the logged-out homepage when
// scrolled down, where the lighter shoreline waves sit behind the transparent
// header and transition to sand below. The logged-out homepage has its own
// ocean+waves treatment and intentionally does not render this.
//
// Positioning trick: ShorelineWaves' inner div is `absolute` with
// `bottom: -200, height: 400`, so its canvas spans `parent_bottom - 200`
// to `parent_bottom + 200`. To replicate the logged-out scrolled state —
// where the wave wrapper spans viewport Y -200 to 200 — we anchor it to a
// zero-height absolute element at viewport Y 0 (the top of the clipping
// outer). That way `parent_bottom` for the wave wrapper resolves to 0,
// and the canvas spans -200..200, putting the lighter shoreline waves at
// canvas Y ~200..280 right inside the visible 0..80 strip. `overflow: hidden`
// clips anything below the page content boundary.
export function HeaderShoreline() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none overflow-hidden"
      style={{ top: 0, height: 80, zIndex: 40 }}
    >
      <div
        className="absolute left-0 right-0"
        style={{ top: 0, height: 0 }}
      >
        <ShorelineWaves />
      </div>
    </div>
  );
}
