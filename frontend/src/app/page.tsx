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
import DebtDetail from "@/components/modals/DebtDetail";
import { Plus, ChevronDown } from "lucide-react";
import { Household, Debt, Invite } from "@/types";
import { debtsService } from "@/services/debts";
import { invitesService } from "@/services/invites";
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
      <div className="sand-bg fixed inset-0 z-0 flex flex-col items-center justify-center gap-6 bg-[#e8c87a] px-4 text-center text-[#0a2463]">
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

type RecentDebt = Debt & { householdName: string; householdId: number };

function LoggedInView() {
  const { refreshGroups } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [groups, setGroups] = useState<Household[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]);
  const [recentDebts, setRecentDebts] = useState<RecentDebt[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<RecentDebt | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(() => {
    setLoading(true);
    groupsService.getAll()
      .then(({ memberships, invitations }) => {
        setGroups(memberships);
        setIncomingInvites(invitations);
        // Fetch debts the user owes from all households and merge
        Promise.all(
          memberships.map((group) =>
            debtsService.getByHousehold(group.id)
              .then((debts) => debts.map((d) => ({ ...d, householdName: group.name, householdId: group.id })))
              .catch(() => [] as RecentDebt[])
          )
        ).then((allDebts) => {
          const merged = allDebts
            .flat()
            .filter((d) => !d.is_resolved)
            .sort((a, b) => b.id - a.id)
            .slice(0, 3);
          setRecentDebts(merged);
        });
      })
      .catch(() => {
        setGroups([]);
        setIncomingInvites([]);
      })
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
          <div className="flex items-center gap-2 px-6">
            <h1 className="text-2xl font-bold">Your Groups</h1>
            <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          ) : groups.length === 0 && incomingInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups yet. Create one to get started!</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 overflow-y-auto px-6 pt-6 pb-10">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  pendingInvites={(group.pending_invitations ?? []).map((inv) => inv.email)}
                  onLeave={handleLeave}
                  onInvite={(email) =>
                    invitesService.send(group.id, email)
                      .then(() => fetchGroups())
                      .catch((err) => console.error("Failed to send invite:", err))
                  }
                />
              ))}
              {incomingInvites
                .filter((inv) => inv.status === "pending")
                .map((invite) => (
                  <GhostGroupCard
                    key={`invite-${invite.token}`}
                    invite={invite}
                    onAccept={() =>
                      invitesService.accept(invite.token)
                        .then(() => {
                          fetchGroups();
                          refreshGroups();
                        })
                        .catch((err) => console.error("Failed to accept:", err))
                    }
                    onDecline={() =>
                      invitesService.decline(invite.token)
                        .then(() => fetchGroups())
                        .catch((err) => console.error("Failed to decline:", err))
                    }
                  />
                ))}
            </div>
          )}
        </section>

        {/* Recent Debts section — right side */}
        <section className="flex w-80 shrink-0 flex-col gap-4">
          <h2 className="text-2xl font-bold px-6">Recent Debts</h2>
          {recentDebts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent debts.</p>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto px-6 pt-6 pb-10">
              {recentDebts.map((debt) => {
                const remaining = parseFloat(debt.amount) - parseFloat(debt.paid_amount);
                return (
                  <Card
                    key={debt.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedDebt(debt)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{debt.bill_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {debt.householdName} · Owed to {debt.user_owed.display_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold">${remaining.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        of ${parseFloat(debt.amount).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <DebtDetail
        debt={selectedDebt}
        householdId={selectedDebt?.householdId ?? 0}
        open={selectedDebt !== null}
        onOpenChange={(open) => { if (!open) setSelectedDebt(null); }}
        onPaymentSubmitted={fetchGroups}
      />
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <LoggedInView /> : <LoggedOutView />;
}
