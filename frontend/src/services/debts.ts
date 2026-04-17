import { apiFetch } from "./api";
import { Debt } from "@/types";

// Endpoints TBD — update paths once backend serializer/views are implemented
export const debtsService = {
  getByHousehold: (householdId: number) =>
    apiFetch<Debt[]>(`/debts/list/${householdId}/`),

  createPayment: (debtId: number, data: { amount: number; method: string }) =>
    apiFetch<void>(`/debts/${debtId}/pay/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
