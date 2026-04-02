"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, LogOut } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const { user, logout, openLogin, openRegister } = useAuth();

  const isGroupPage = pathname.startsWith("/groups/") && params.id;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center px-6 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {isGroupPage && (
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        )}
        <Link href="/">
          <Image
            src="/splitseas_logo.png"
            alt="SplitSeas"
            width={120}
            height={40}
          />
        </Link>
      </div>

      {/* Center section — group name when on a group page */}
      <div className="flex-1 text-center">
        {isGroupPage && (
          <h1 className="text-lg font-semibold">
            {/* Group name will be passed via context or fetched */}
            Group
          </h1>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={openLogin}>
              Log in
            </Button>
            <Button onClick={openRegister}>Register</Button>
          </>
        )}
      </div>
    </header>
  );
}
