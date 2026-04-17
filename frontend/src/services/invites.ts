import { apiFetch } from "./api";
import { Invite } from "@/types";

// Endpoints TBD — update paths once backend views are implemented
export const invitesService = {
  /** Invites sent to others for households the user owns/belongs to */
  getOutgoing: (householdId: number) =>
    apiFetch<Invite[]>(`/households/${householdId}/invites/`),

  /** Invites the current user has received */
  getIncoming: () =>
    apiFetch<Invite[]>(`/invites/incoming/`),

  send: (householdId: number, email: string) =>
    apiFetch<Invite>(`/households/${householdId}/invites/`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  accept: (inviteId: number) =>
    apiFetch<void>(`/invites/${inviteId}/accept/`, { method: "POST" }),

  decline: (inviteId: number) =>
    apiFetch<void>(`/invites/${inviteId}/decline/`, { method: "POST" }),
};
