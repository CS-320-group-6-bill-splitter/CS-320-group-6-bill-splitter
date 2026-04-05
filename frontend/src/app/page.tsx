"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { SeaWaves } from "@/components/sea-waves";
import { ShorelineWaves } from "@/components/shoreline-waves";
import { WetSandOverlay } from "@/components/wet-sand-overlay";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import { GroupCard } from "@/components/group-card";
import { Plus, ChevronDown } from "lucide-react";
import { Group } from "@/types";

const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "Example Group",
    created_by: "1",
    members: [
      { id: "1", email: "john@example.com", name: "John Doe" },
      { id: "2", email: "alex@example.com", name: "Alex S" },
      { id: "3", email: "mary@example.com", name: "Mary K" },
    ],
    created_at: "2026-03-30T00:00:00Z",
  },
];

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
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-20">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Your Groups</h1>
        <Button variant="ghost" size="icon" onClick={() => setCreateOpen(true)}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_GROUPS.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            totalAmount={120}
            billCount={5}
            balanceText="You owe $15.00"
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return user ? <LoggedInView /> : <LoggedOutView />;
}
