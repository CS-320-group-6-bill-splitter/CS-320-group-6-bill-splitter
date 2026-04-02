"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/types";
import { authService } from "@/services/auth";
import { LoginModal } from "@/components/modals/login-modal";
import { RegisterModal } from "@/components/modals/register-modal";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  openLogin: () => void;
  openRegister: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "1",
    email: "test@example.com",
    name: "John Doe",
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  async function login(email: string, password: string) {
    const res = await authService.login(email, password);
    setUser(res.user);
  }

  async function register(email: string, password: string, name: string) {
    const res = await authService.register(email, password, name);
    setUser(res.user);
  }

  function logout() {
    authService.logout().catch(() => {});
    setUser(null);
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
      value={{ user, login, register, logout, openLogin, openRegister }}
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
