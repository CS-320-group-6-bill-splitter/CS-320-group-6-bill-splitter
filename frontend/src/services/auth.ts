import { apiFetch } from "./api";
import { User } from "@/types";

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name: string) =>
    apiFetch<AuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  logout: () =>
    apiFetch("/auth/logout/", { method: "POST" }),
};
