import { apiFetch } from "./api";
import { Household, HouseholdSummary } from "@/types";

export const groupsService = {
  getAll: () => apiFetch<Household[]>("/households/"),

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
