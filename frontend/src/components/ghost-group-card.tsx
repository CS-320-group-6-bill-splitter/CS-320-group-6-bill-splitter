"use client";

import { useId } from "react";
import { Invite } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  POOL_PATH_A,
  POOL_PATH_B,
  POOL_WAVE_DUR,
} from "@/components/ui/card";
import { Check, X, Mail } from "lucide-react";

interface GhostGroupCardProps {
  invite: Invite;
  onAccept?: () => void;
  onDecline?: () => void;
}

// Convert a path string from a 0-100 viewBox to 0-1 normalized space, since
// SVG masks use objectBoundingBox content units (0-1) by default to scale with
// the masked element.
function scalePath(path: string, factor: number): string {
  return path.replace(/-?\d+(?:\.\d+)?/g, (n) => (parseFloat(n) * factor).toFixed(4));
}

const POOL_PATH_A_NORM = scalePath(POOL_PATH_A, 0.01);
const POOL_PATH_B_NORM = scalePath(POOL_PATH_B, 0.01);
const ANIM_VALUES_NORM = `${POOL_PATH_A_NORM};${POOL_PATH_B_NORM};${POOL_PATH_A_NORM}`;
const ANIM_VALUES_FULL = `${POOL_PATH_A};${POOL_PATH_B};${POOL_PATH_A}`;

export function GhostGroupCard({ invite, onAccept, onDecline }: GhostGroupCardProps) {
  // useId returns ":r0:" style strings — strip colons so it's a valid CSS id.
  const rawId = useId();
  const maskId = `ghost-mask-${rawId.replace(/:/g, "")}`;

  // Single inline SVG containing BOTH the mask (in <defs>, referenced by the
  // Card's mask-image via url(#id)) and the visible dashed outline. Because
  // both <animate> elements live in the same SVG document, SMIL gives them
  // a shared timeline and they stay perfectly in sync.
  const overlay = (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/70"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId} maskContentUnits="objectBoundingBox">
          <path fill="white" d={POOL_PATH_A_NORM}>
            <animate
              attributeName="d"
              dur={POOL_WAVE_DUR}
              repeatCount="indefinite"
              values={ANIM_VALUES_NORM}
            />
          </path>
        </mask>
      </defs>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
        d={POOL_PATH_A}
      >
        <animate
          attributeName="d"
          dur={POOL_WAVE_DUR}
          repeatCount="indefinite"
          values={ANIM_VALUES_FULL}
        />
      </path>
    </svg>
  );

  return (
    <Card className="opacity-75" overlay={overlay} maskUrl={`url(#${maskId})`}>
      {/* Accept / Decline buttons — top right, mirroring the dropdown position on normal cards */}
      <div className="absolute top-5 right-3 z-10 flex gap-1">
        <button
          onClick={onAccept}
          className="flex items-center justify-center rounded-md p-1 transition-colors cursor-pointer"
          style={{ color: "#22c55e" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "hsl(var(--muted))")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Accept invite"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={onDecline}
          className="flex items-center justify-center rounded-md p-1 transition-colors cursor-pointer"
          style={{ color: "#ef4444" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "hsl(var(--muted))")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          aria-label="Decline invite"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {invite.household_name}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: "50px",
              background: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            Invited
          </span>
        </CardTitle>
        <CardDescription>
          Invitation pending · {new Date(invite.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          {invite.email}
        </div>
      </CardContent>
    </Card>
  );
}
