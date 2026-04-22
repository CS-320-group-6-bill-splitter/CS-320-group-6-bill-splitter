import { apiFetch } from "./api";
import { Debt, DebtPayment } from "@/types";

export const debtsService = {
  /** List debts the logged-in user owes within a household. */
  getByHousehold: (householdId: number, statusFilter?: "paid" | "unpaid") => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    return apiFetch<Debt[]>(`/debts/list/${householdId}/${qs}`);
  },

  /** Get a single debt by id. */
  getById: (householdId: number, debtId: number) =>
    apiFetch<Debt>(`/debts/detail/${householdId}/${debtId}/`),

  /** Create a payment against a debt. Backend expects `{amount}`. */
  createPayment: (householdId: number, debtId: number, data: { amount: number }) =>
    apiFetch<DebtPayment>(`/debts/pay/${householdId}/${debtId}/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** List past payments for a debt. */
  getPayments: (debtId: number) =>
    apiFetch<DebtPayment[]>(`/payments/list-debt/${debtId}/`),
};
