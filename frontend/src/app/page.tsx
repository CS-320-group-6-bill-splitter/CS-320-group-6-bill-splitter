"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { SeaWaves } from "@/components/sea-waves";
import { ShorelineWaves } from "@/components/shoreline-waves";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
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

function LoggedOutView() {
  const { openLogin, openRegister } = useAuth();

  return (
    <div className="relative flex flex-col">
      {/* Ocean section */}
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-[hsl(195,100%,7%)] px-4 pt-16 text-center text-white">
        <SeaWaves />
        <h1 className="relative z-10 text-5xl font-bold tracking-tight">
          Split bills effortlessly
        </h1>
        <p className="relative z-10 max-w-md text-lg text-white/70">
          Create groups, add expenses, and keep track of who owes what. No more
          awkward money conversations.
        </p>
        <div className="relative z-10 flex gap-3">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={openLogin}>
            Log in
          </Button>
          <Button className="bg-white text-[#0a2463] hover:bg-white/90" onClick={openRegister}>
            Get started
          </Button>
        </div>
      </div>

      {/* Shoreline waves — positioned to overlap ocean/sand boundary */}
      <ShorelineWaves />

      {/* Sand section */}
      <div className="relative flex min-h-[50vh] flex-col items-center justify-center gap-6 bg-[#e8c87a] px-4 pt-48 pb-16 text-center text-[#0a2463]">
        <h2 className="text-3xl font-bold tracking-tight">
          Ready to dive in?
        </h2>
        <p className="max-w-md text-lg text-[#0a2463]/70">
          Create a group, invite your friends, and start splitting.
        </p>
      </div>
    </div>
  );
}

function LoggedInView() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Groups</h1>
        <Button onClick={() => setCreateOpen(true)}>Create Group</Button>
      </div>
      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Group cards will be mapped here from API data */}
        <Card className="relative cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
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
                  onClick={() => groupsService.leaveGroup("1")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href="/groups/1">
            <CardHeader>
              <CardTitle>Example Group</CardTitle>
              <CardDescription>Total: $120.00 · 5 bills</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">AS</AvatarFallback>
                </Avatar>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">MK</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-sm text-muted-foreground">
                You owe $15.00
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return user ? <LoggedInView /> : <LoggedOutView />;
}
