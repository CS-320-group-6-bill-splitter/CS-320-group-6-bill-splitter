import { apiFetch } from "./api";
import { Invite } from "@/types";

export const invitesService = {
  /** Send an invitation by email to a household. */
  send: (householdId: number, email: string) =>
    apiFetch<Invite>(`/households/${householdId}/invite/`, {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /** Respond to a pending invitation (accept or decline) using its token. */
  respond: (token: string, action: "accept" | "decline") =>
    apiFetch<{ message: string }>(`/invitations/${token}/respond/`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  accept: (token: string) =>
    apiFetch<{ message: string }>(`/invitations/${token}/respond/`, {
      method: "POST",
      body: JSON.stringify({ action: "accept" }),
    }),

  decline: (token: string) =>
    apiFetch<{ message: string }>(`/invitations/${token}/respond/`, {
      method: "POST",
      body: JSON.stringify({ action: "decline" }),
    }),
};
