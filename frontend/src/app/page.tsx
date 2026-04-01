"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

function LoggedOutView() {
  return (
    <div className="flex flex-col">
      {/* Ocean section */}
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a2463] px-4 pt-16 text-center text-white">
        <h1 className="text-5xl font-bold tracking-tight">
          Split bills effortlessly
        </h1>
        <p className="max-w-md text-lg text-white/70">
          Create groups, add expenses, and keep track of who owes what. No more
          awkward money conversations.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            Log in
          </Button>
          <Button className="bg-white text-[#0a2463] hover:bg-white/90">
            Get started
          </Button>
        </div>

        {/* Wave divider */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,160 C360,80 720,220 1080,120 C1260,80 1380,140 1440,120 L1440,200 L0,200 Z"
            fill="#e8c87a"
          />
          <path
            d="M0,180 C320,120 640,200 960,140 C1120,110 1320,170 1440,150 L1440,200 L0,200 Z"
            fill="#d4a843"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Sand section */}
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 bg-[#e8c87a] px-4 text-center text-[#0a2463]">
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
