import { apiFetch } from "./api";
import { Bill } from "@/types";

export const billsService = {
  getAll: () => apiFetch<Bill[]>("/bills/"),
  getById: (id: string) => apiFetch<Bill>(`/bills/${id}/`),
  create: (data: Partial<Bill>) =>
    apiFetch<Bill>("/bills/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch(`/bills/${id}/`, { method: "DELETE" }),
};
