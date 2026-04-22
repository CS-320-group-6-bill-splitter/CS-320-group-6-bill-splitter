"use client";

import { Invite } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AvatarWithTooltip } from "@/components/avatar-with-tooltip";
import { Check, X } from "lucide-react";

interface GhostGroupCardProps {
  invite: Invite;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function GhostGroupCard({ invite, onAccept, onDecline }: GhostGroupCardProps) {
  const { household } = invite;

  return (
    <Card
      className="relative transition-colors border-2 border-dashed border-muted-foreground/40 opacity-75"
    >
      {/* Accept / Decline buttons — top right, mirroring the dropdown position on normal cards */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
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
          {household.name}
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
          {household.member_count} member{household.member_count !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {household.members.length > 0 && (
          <div className="flex items-center gap-1">
            {household.members.map((member, i) => (
              <AvatarWithTooltip key={i} name={member} className="h-7 w-7 text-xs" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
