"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { SeaWaves } from "@/components/sea-waves";
import { ShorelineWaves } from "@/components/shoreline-waves";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Groups</h1>
        <Button>Create Group</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Group cards will be mapped here from API data */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle>Example Group</CardTitle>
            <CardDescription>3 members · 5 bills</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return user ? <LoggedInView /> : <LoggedOutView />;
}
