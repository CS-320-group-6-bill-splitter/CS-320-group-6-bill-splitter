"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { groupsService } from "@/services/groups";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { SeaWaves } from "@/components/sea-waves";
import { ShorelineWaves } from "@/components/shoreline-waves";
import { WetSandOverlay } from "@/components/wet-sand-overlay";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import { GroupCard } from "@/components/group-card";
import { GhostGroupCard } from "@/components/ghost-group-card";
import { Plus, ChevronDown } from "lucide-react";
import { Household, Bill, Invite } from "@/types";
import { billsService } from "@/services/bills";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function LoggedOutView() {
  const { openLogin, openRegister } = useAuth();
  const isAnimating = useRef(false);
  const currentSection = useRef(0); // 0 = ocean, 1 = sand

  const smoothScroll = useCallback((target: number, duration: number) => {
    const start = window.scrollY;
    const distance = target - start;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutSine(progress);

      window.scrollTo(0, start + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating.current = false;
      }
    }

    requestAnimationFrame(step);
  }, []);

  const scrollToSand = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    currentSection.current = 1;
    const scrollTarget = document.body.scrollHeight - window.innerHeight;
    smoothScroll(scrollTarget, 3000);
  }, [smoothScroll]);

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (isAnimating.current) return;

      const target = e.deltaY > 0 ? 1 : 0;
      if (target === currentSection.current) return;

      isAnimating.current = true;
      currentSection.current = target;

      const scrollTarget = target === 1 ? document.body.scrollHeight - window.innerHeight : 0;
      smoothScroll(scrollTarget, 3000);
    }

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [smoothScroll]);

  const [dryLine, setDryLine] = useState(150);
  const [isDrying, setIsDrying] = useState(false);
  const dryingRef = useRef<number | null>(null);
  const lastScroll = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const goingDown = window.scrollY > lastScroll.current;
      lastScroll.current = window.scrollY;

      // Make wet when scrolling down
      if (progress > 0.1 && goingDown && !isDrying) {
        setDryLine(0);
        if (dryingRef.current) cancelAnimationFrame(dryingRef.current);
      }

      // Start drying at 60% of scroll, only going down
      if (progress > 0.3 && goingDown && !isDrying) {
        setIsDrying(true);
      }

      // Reset at top
      if (progress < 0.05) {
        setIsDrying(false);
        setDryLine(150);
        if (dryingRef.current) cancelAnimationFrame(dryingRef.current);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDrying]);

  useEffect(() => {
    if (!isDrying) return;

    const startTime = performance.now();

    function dry(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 3000, 1);
      const eased = easeInOutSine(progress);
      setDryLine(eased * 150);

      if (progress < 1) {
        dryingRef.current = requestAnimationFrame(dry);
      } else {
        setIsDrying(false);
      }
    }

    dryingRef.current = requestAnimationFrame(dry);

    return () => {
      if (dryingRef.current) cancelAnimationFrame(dryingRef.current);
    };
  }, [isDrying]);

  return (
    <div className="relative">
      {/* Sand — fixed behind everything */}
      <div className="fixed inset-0 z-0 flex flex-col items-center justify-center gap-6 bg-[#e8c87a] px-4 text-center text-[#0a2463]">
        {/* Wet sand overlay with wavy edge */}
        <WetSandOverlay dryLine={dryLine} />
        <h2 className="relative z-10 text-3xl font-bold tracking-tight">
          Ready to dive in?
        </h2>
        <p className="relative z-10 max-w-md text-lg text-[#0a2463]/70">
          Create a group, invite your friends, and start splitting.
        </p>
        <div className="relative z-10 flex gap-3">
          <Button variant="ghost" className="text-[#0a2463] hover:bg-[#0a2463]/10" onClick={openLogin}>
            Log in
          </Button>
          <Button className="bg-[#012B43] text-[#D9F2FF] hover:bg-[#014060]" onClick={openRegister}>
            Get started
          </Button>
        </div>
      </div>

      {/* Ocean block */}
      <div className="relative z-[2]" style={{ height: "120vh" }}>
        <div className="relative h-full bg-[hsl(195,100%,7%)] overflow-visible">
          <SeaWaves />
          <ShorelineWaves />
        </div>

        {/* Text clip container — clipPath constrains the fixed text to this box */}
        <div className="absolute inset-0" style={{ clipPath: "inset(0 0 0 0)" }}>
          <div className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-6 px-4 text-center pointer-events-none">
            <h1 className="text-5xl font-bold tracking-tight text-[#D9F2FF] [text-shadow:0_2px_8px_#012B43,0_0_20px_#012B43,0_0_4px_#012B43]">
              Split bills effortlessly
            </h1>
            <p className="max-w-md text-lg text-[#D9F2FF] [text-shadow:0_2px_8px_#012B43,0_0_20px_#012B43,0_0_4px_#012B43]">
              Create groups, add expenses, and keep track of who owes what. No more
              awkward money conversations.
            </p>
            <button
              onClick={scrollToSand}
              className="pointer-events-auto mt-4 animate-bounce text-[#D9F2FF] hover:text-white transition-colors cursor-pointer [filter:drop-shadow(0_2px_8px_#012B43)_drop-shadow(0_0_20px_#012B43)_drop-shadow(0_0_4px_#012B43)]"
            >
              <ChevronDown className="h-10 w-10" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer so sand is visible after ocean scrolls away */}
      <div className="relative z-0 h-screen pointer-events-none" />
    </div>
  );
}

function LoggedInView() {
  const { refreshGroups } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [groups, setGroups] = useState<Household[]>([]);
  const [recentBills, setRecentBills] = useState<(Bill & { householdName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Dummy incoming invites (replace with invitesService.getIncoming() once backend is ready)
  const incomingInvites: Invite[] = [
    {
      id: 1,
      email: "you@example.com",
      household: { id: 999, name: "Beach House Trip", members: ["[USER] Sarah (sarah@example.com)", "[USER] Mike (mike@example.com)"], member_count: 2 },
      status: "pending",
    },
  ];

  // Dummy outgoing pending invite emails per group (replace with invitesService.getOutgoing() once backend is ready)
  // Uses the first loaded group's ID to attach demo pending invites
  const firstGroupId = groups[0]?.id;
  const pendingInvitesByGroup: Record<number, string[]> = firstGroupId
    ? { [firstGroupId]: ["pending@example.com", "invited@example.com"] }
    : {};

  const fetchGroups = useCallback(() => {
    setLoading(true);
    groupsService.getAll()
      .then((g) => {
        setGroups(g);
        // Fetch bills from all households and merge
        Promise.all(
          g.map((group) =>
            billsService.getByHousehold(group.id)
              .then((bills) => bills.map((b) => ({ ...b, householdName: group.name })))
              .catch(() => [] as (Bill & { householdName: string })[])
          )
        ).then((allBills) => {
          const merged = allBills
            .flat()
            .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
            .slice(0, 3);
          setRecentBills(merged);
        });
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  function handleCreateClose(open: boolean) {
    setCreateOpen(open);
    if (!open) {
      fetchGroups();
      refreshGroups();
    }
  }

  function handleLeave() {
    fetchGroups();
    refreshGroups();
  }

  return (
    <div className="flex h-screen flex-col gap-6 p-6 pt-20 overflow-hidden">
      <CreateGroupModal open={createOpen} onOpenChange={handleCreateClose} />
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Groups section — left side */}
        <section className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Your Groups</h1>
            <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups yet. Create one to get started!</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 overflow-y-auto pr-1">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  pendingInvites={pendingInvitesByGroup[group.id] ?? []}
                  onLeave={handleLeave}
                  onInvite={(email) => {
                    // TODO: call invitesService.send(group.id, email) once backend is ready
                    console.log(`Invite ${email} to group ${group.id}`);
                  }}
                />
              ))}
              {incomingInvites
                .filter((inv) => inv.status === "pending")
                .map((invite) => (
                  <GhostGroupCard
                    key={`invite-${invite.id}`}
                    invite={invite}
                    onAccept={() => {
                      // TODO: call invitesService.accept(invite.id) once backend is ready
                      console.log(`Accept invite ${invite.id}`);
                    }}
                    onDecline={() => {
                      // TODO: call invitesService.decline(invite.id) once backend is ready
                      console.log(`Decline invite ${invite.id}`);
                    }}
                  />
                ))}
            </div>
          )}
        </section>

        {/* Recent Bills section — right side */}
        <section className="flex w-80 shrink-0 flex-col gap-4">
          <h2 className="text-2xl font-bold">Recent Bills</h2>
          {recentBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent bills.</p>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {recentBills.map((bill) => (
                <Card key={bill.id}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{bill.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {bill.householdName} · {new Date(bill.date_created).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xl font-bold">${bill.amount}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <LoggedInView /> : <LoggedOutView />;
}
