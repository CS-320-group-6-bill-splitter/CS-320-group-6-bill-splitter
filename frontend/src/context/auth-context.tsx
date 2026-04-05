"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { authService } from "@/services/auth";
import { LoginModal } from "@/components/modals/login-modal";
import { RegisterModal } from "@/components/modals/register-modal";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  groupsVersion: number;
  refreshGroups: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  openLogin: () => void;
  openRegister: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [groupsVersion, setGroupsVersion] = useState(0);

  function refreshGroups() {
    setGroupsVersion((v) => v + 1);
  }

  // Check for existing session on mount
  useEffect(() => {
    authService.me()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const [registerOpen, setRegisterOpen] = useState(false);

  async function login(email: string, password: string) {
    const res = await authService.login(email, password);
    setUser({
      id: 0,
      email,
      display_name: res.display_name,
      profile_picture: res.profile_picture,
    });
  }

  async function register(email: string, password: string, name: string) {
    const res = await authService.register(email, password, name);
    setUser({
      id: 0,
      email,
      display_name: res.display_name,
    });
  }

  function logout() {
    authService.logout().catch(() => {});
    setUser(null);
    router.push("/");
  }

  function openLogin() {
    setRegisterOpen(false);
    setLoginOpen(true);
  }

  function openRegister() {
    setLoginOpen(false);
    setRegisterOpen(true);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, groupsVersion, refreshGroups, login, register, logout, openLogin, openRegister }}
    >
      {children}
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToRegister={openRegister}
      />
      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSwitchToLogin={openLogin}
      />
    </AuthContext.Provider>
  );
}

export { type AuthContextType };

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
