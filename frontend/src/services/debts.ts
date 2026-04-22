import { apiFetch } from "./api";
import { Debt, DebtPayment } from "@/types";

export const debtsService = {
  // TODO: backend endpoint for listing debts by household is not yet implemented.
  // The DebtViewSet in core/views.py is broken and not registered.
  getByHousehold: (householdId: number) =>
    apiFetch<Debt[]>(`/debts/list/${householdId}/`),

  // TODO: backend endpoint for creating a payment against a debt is not yet implemented.
  // PaymentManager.create_payment exists in core/models.py but no view wires it up.
  createPayment: (debtId: number, data: { amount: number; method: string }) =>
    apiFetch<void>(`/debts/${debtId}/pay/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** List past payments for a debt — backend endpoint exists. */
  getPayments: (debtId: number) =>
    apiFetch<DebtPayment[]>(`/payments/list-debt/${debtId}/`),
};
