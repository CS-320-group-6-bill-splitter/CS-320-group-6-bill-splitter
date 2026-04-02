import { apiFetch } from "./api";
import { Group } from "@/types";

export const groupsService = {
  getAll: () => apiFetch<Group[]>("/groups/"),
  getById: (id: string) => apiFetch<Group>(`/groups/${id}/`),
  create: (data: Partial<Group>) =>
    apiFetch<Group>("/groups/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/groups/${id}/`, { method: "DELETE" }),
};
