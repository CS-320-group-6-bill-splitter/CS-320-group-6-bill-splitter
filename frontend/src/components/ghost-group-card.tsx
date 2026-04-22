"use client";

import { Invite } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Check, X, Mail } from "lucide-react";

interface GhostGroupCardProps {
  invite: Invite;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function GhostGroupCard({ invite, onAccept, onDecline }: GhostGroupCardProps) {
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
