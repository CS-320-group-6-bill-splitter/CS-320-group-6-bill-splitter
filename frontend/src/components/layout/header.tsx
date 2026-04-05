"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import UserProfile from "@/components/modals/UserProfile";

export function Header() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const { user, logout, openLogin, openRegister } = useAuth();

  const isGroupPage = pathname.startsWith("/groups/") && params.id;
  const [profileOpen, setProfileOpen] = useState(false);
  const [overOcean, setOverOcean] = useState(!user);

  useEffect(() => {
    if (user) {
      setOverOcean(false);
      return;
    }

    function handleScroll() {
      // Ocean block height is 120vh — header is over the ocean when near top
      const threshold = window.innerHeight * 0.8;
      setOverOcean(window.scrollY < threshold);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [user]);

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center px-6 transition-all duration-300 border-b border-transparent hover:backdrop-blur-xl hover:border-white/20 hover:shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Image
            src="/Splitseas_LOGO.svg"
            alt="SplitSeas"
            width={120}
            height={40}
            className={`transition-[filter] duration-500 ${overOcean ? "[filter:brightness(0)_invert(1)_sepia(1)_saturate(3)_hue-rotate(170deg)_brightness(1.1)]" : ""}`}
          />
        </Link>
      </div>

      {/* Center section — group name when on a group page */}
      {isGroupPage && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Group
        </h1>
      )}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user.avatar_url} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" className="text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.7),0_0_2px_rgba(0,0,0,0.5)] hover:[text-shadow:none] hover:bg-[#D9F2FF] hover:text-[#012B43]" onClick={openLogin}>
              Log in
            </Button>
            <Button variant="ghost" className="text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.7),0_0_2px_rgba(0,0,0,0.5)] hover:[text-shadow:none] hover:bg-[#D9F2FF] hover:text-[#012B43]" onClick={openRegister}>
              Register
            </Button>
          </>
        )}
      </div>
    </header>
    {user && (
      <UserProfile
        user={{
          name: user.name,
          households: ["Example Group"],
        }}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    )}
  </>
  );
}
