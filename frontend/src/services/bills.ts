import { apiFetch } from "./api";
import { Bill } from "@/types";

export const billsService = {
  getByHousehold: (householdId: number) =>
    apiFetch<Bill[]>(`/bills/list/${householdId}/`),

  create: (
    householdId: number,
    body: { name: string; amount: number; debts: Record<number, number> }
  ) =>
    apiFetch<Bill>(`/bills/create/${householdId}/`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};