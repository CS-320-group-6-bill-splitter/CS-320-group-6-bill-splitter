import { apiFetch } from "./api";
import { Bill } from "@/types";

export const billsService = {
  getByHousehold: (householdId: number) =>
    apiFetch<Bill[]>(`/bills/list/${householdId}/`),
};
