import { apiFetch } from "./api";

interface LoginResponse {
  message: string;
  display_name: string;
  profile_picture: string | null;
}

interface RegisterResponse {
  message: string;
  display_name: string;
}

export const authService = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, display_name: string) =>
    apiFetch<RegisterResponse>("/register/", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name }),
    }),

  logout: () =>
    apiFetch<{ message: string }>("/logout/", { method: "POST" }),

  me: () =>
    apiFetch<{ id: number; email: string; display_name: string; profile_picture: string | null }>("/me/"),
};
