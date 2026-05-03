import { apiFetch } from "./api";
import { Debt, DebtPayment } from "@/types";

export type DebtStatus = "unresolved" | "resolved";

export const debtsService = {
  /** List debts the logged-in user owes within a household. */
  getByHousehold: (householdId: number, status: DebtStatus = "unresolved") =>
    apiFetch<Debt[]>(`/debts/list/${status}/${householdId}/`),

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

  /** Debts you owe to the other user in this household. */
  getByHouseholdAndUser: (householdId: number, otherUserId: number) =>
    apiFetch<{ debts: Debt[]; i_owe_them: number }>(
      `/debts/list/${householdId}/by-user/${otherUserId}/`
    ),
};
