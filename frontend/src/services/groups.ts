import { apiFetch } from "./api";
import { Household, HouseholdSummary, HouseholdsResponse } from "@/types";

export const groupsService = {
  /** Returns memberships and pending invitations for the logged-in user. */
  getAll: () => apiFetch<HouseholdsResponse>("/households/"),

  create: (data: { name: string }) =>
    apiFetch<Household>("/households/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getById: (id: number) => apiFetch<Household>(`/households/${id}/`),

  getSummary: (id: number) =>
    apiFetch<HouseholdSummary>(`/households/${id}/summary/`),

  leave: (id: number) =>
    apiFetch<void>(`/households/${id}/leave/`, {
      method: "POST",
    }),
};
