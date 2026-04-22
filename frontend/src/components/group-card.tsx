"use client";

import { useState } from "react";
import Link from "next/link";
import { Household } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AvatarWithTooltip } from "@/components/avatar-with-tooltip";
import { GhostAvatar } from "@/components/ghost-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserPlus, LogOut } from "lucide-react";
import { groupsService } from "@/services/groups";
import InviteMember from "@/components/modals/InviteMember";

interface GroupCardProps {
  group: Household;
  totalAmount?: number;
  billCount?: number;
  balanceText?: string;
  pendingInvites?: string[];
  onLeave?: () => void;
  onInvite?: (email: string) => void;
}

export function GroupCard({
  group,
  totalAmount = 0,
  billCount = 0,
  balanceText,
  pendingInvites = [],
  onLeave,
  onInvite,
}: GroupCardProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <Card className="relative cursor-pointer">
        <div
          className="absolute top-5 right-3 z-10"
          onClick={(e) => e.preventDefault()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-md p-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite members
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => groupsService.leave(group.id).then(() => onLeave?.())}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Leave group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link href={`/groups/${group.id}`}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            {(billCount > 0 || totalAmount > 0) && (
              <CardDescription>
                {billCount > 0 && `${billCount} bill${billCount !== 1 ? "s" : ""}`}
                {billCount > 0 && totalAmount > 0 && " · "}
                {totalAmount > 0 && `$${totalAmount.toFixed(2)}`}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-3">
            {(group.members.length > 0 || pendingInvites.length > 0) && (
              <div className="flex items-center gap-2">
                {group.members.slice(0, 3).map((member, i) => (
                  <AvatarWithTooltip key={i} name={member.display_name} className="h-10 w-10 text-sm" />
                ))}
                {group.members.length > 3 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    +{group.members.length - 3} other{group.members.length - 3 !== 1 ? "s" : ""}
                  </span>
                )}
                {pendingInvites.map((email, i) => (
                  <GhostAvatar key={`ghost-${i}`} email={email} className="h-10 w-10 text-sm" />
                ))}
              </div>
            )}
            {balanceText && (
              <p className="text-sm text-muted-foreground">{balanceText}</p>
            )}
          </CardContent>
        </Link>
      </Card>

      <InviteMember
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSend={onInvite}
      />
    </>
  );
}
