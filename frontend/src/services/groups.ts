import { apiFetch } from "./api";
import { Group, User } from "@/types";

export const groupsService = {
  getAll: () => apiFetch<Group[]>("/groups/"),

  create: (data: Partial<Group>) =>
    apiFetch<Group>("/groups/create/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getGroupSummary: (id: string) => apiFetch<Group>(`/groups/${id}/`),

  getGroupMembers: (id: string) => apiFetch<User[]>(`/groups/${id}/members/`),

  leaveGroup: (id: string) =>
    apiFetch<{ detail: string }>(`/groups/${id}/leave/`, {
      method: "POST",
    }),
};
