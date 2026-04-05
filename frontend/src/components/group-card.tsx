"use client";

import Link from "next/link";
import { Group } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, UserPlus, LogOut } from "lucide-react";
import { groupsService } from "@/services/groups";

interface GroupCardProps {
  group: Group;
  totalAmount?: number;
  billCount?: number;
  balanceText?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function GroupCard({
  group,
  totalAmount = 0,
  billCount = 0,
  balanceText,
}: GroupCardProps) {
  return (
    <Card className="relative cursor-pointer hover:bg-muted/50 transition-colors">
      <div
        className="absolute top-2 right-2 z-10"
        onClick={(e) => e.preventDefault()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite members
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => groupsService.leaveGroup(group.id)}
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
          <CardDescription>
            Total: ${totalAmount.toFixed(2)} · {billCount} bill
            {billCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {group.members.length > 0 && (
            <div className="flex items-center gap-1">
              {group.members.map((member) => (
                <Avatar key={member.id} className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
          {balanceText && (
            <p className="text-sm text-muted-foreground">{balanceText}</p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
