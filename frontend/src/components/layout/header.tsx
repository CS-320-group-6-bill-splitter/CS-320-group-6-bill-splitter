"use client";

import Image from "next/image";
import Link from "next/link";
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
import { LogOut } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const { user, logout, openLogin, openRegister } = useAuth();

  const isGroupPage = pathname.startsWith("/groups/") && params.id;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center px-6 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      {/* Left section */}
      <div className="flex items-center gap-3">
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
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
