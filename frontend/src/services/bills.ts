import { apiFetch } from "./api";
import { Bill } from "@/types";

export type BillStatus = "unresolved" | "resolved";

export const billsService = {
  getByHousehold: (householdId: number, status: BillStatus = "unresolved") =>
    apiFetch<Bill[]>(`/bills/list/${status}/${householdId}/`),

  create: (
    householdId: number,
    body: { name: string; amount: number; debts: Record<number, number> }
  ) =>
    apiFetch<Bill>(`/bills/create/${householdId}/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** Bills where you are owed and the other user has a debt on the bill. */
  getByHouseholdAndUser: (householdId: number, otherUserId: number) =>
    apiFetch<{ bills: Bill[]; they_owe_me: number }>(
      `/bills/list/${householdId}/by-user/${otherUserId}/`
    ),
};