"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CreateBill from "@/components/modals/CreateBill";
import BillDetailView, { Debtor } from "@/components/modals/BillDetailView";
import DebtDetail from "@/components/modals/DebtDetail";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AvatarWithTooltip } from "@/components/avatar-with-tooltip";
import { GhostAvatar } from "@/components/ghost-avatar";
import { groupsService } from "@/services/groups";
import { billsService } from "@/services/bills";
import { debtsService } from "@/services/debts";
import { Household, Bill, Debt, HouseholdSummary } from "@/types";
import { parseMemberName } from "@/lib/utils";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [mockPaidByBill, setMockPaidByBill] = useState<Record<number, Record<number, number>>>({});
  const { id } = use(params);
  const groupId = Number(id);
  const [billOpen, setBillOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [group, setGroup] = useState<Household | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<HouseholdSummary>({});
  const [loading, setLoading] = useState(true);

  const [debts, setDebts] = useState<Debt[]>([]);

  const pendingInvites = (group?.pending_invitations ?? []).map((inv) => inv.email);

  const fetchData = useCallback(() => {
    setLoading(true);
    groupsService.getById(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
    billsService.getByHousehold(groupId)
      .then(setBills)
      .catch(() => setBills([]));
    debtsService.getByHousehold(groupId)
      .then(setDebts)
      .catch(() => setDebts([]));
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBillClose(open: boolean) {
    setBillOpen(open);
    if (!open) fetchData();
  }

  const selectedVisibleBill = bills.find((b) => b.id === selectedBillId) ?? null;

  function buildDebtorsForBill(bill: Bill): Debtor[] {
    const debts = bill.debts ?? [];
    if (debts.length === 0) return [];

    const overrideMap = mockPaidByBill[bill.id] ?? {};

    return debts.map((d) => ({
      id: d.user.id,
      debtId: d.id,
      name: d.user.display_name,
      totalOwed: parseFloat(d.amount),
      paidAmount: overrideMap[d.user.id] ?? parseFloat(d.paid_amount),
    }));
  }

  async function handleChangePaid(billId: number, debtor: Debtor, nextPaid: number) {
    // Optimistic UI update
    setMockPaidByBill((prev) => ({
      ...prev,
      [billId]: {
        ...(prev[billId] ?? {}),
        [debtor.id]: nextPaid,
      },
    }));

    // Mock bill (no real backend record) — local only
    if (debtor.debtId < 0) return;

    const delta = nextPaid - debtor.paidAmount;
    if (delta === 0) return;
    if (delta < 0) {
      // Recording a negative payment isn't supported by the backend yet.
      console.warn("Reducing paid amount is not supported");
      return;
    }

    try {
      await debtsService.createPayment(groupId, debtor.debtId, { amount: delta });
      await fetchData();
      // Clear the optimistic override now that real data is fresh
      setMockPaidByBill((prev) => {
        const next = { ...prev };
        if (next[billId]) {
          const { [debtor.id]: _omit, ...rest } = next[billId];
          next[billId] = rest;
        }
        return next;
      });
    } catch (e) {
      console.error("Failed to record payment:", e);
      // Roll back optimistic update
      setMockPaidByBill((prev) => {
        const next = { ...prev };
        if (next[billId]) {
          const { [debtor.id]: _omit, ...rest } = next[billId];
          next[billId] = rest;
        }
        return next;
      });
      alert(e instanceof Error ? e.message : "Could not record payment");
    }
  }
  async function handleCreateBillSaved(bill: {
    expenseName: string;
    amount: number;
    paidBy: string;
    splits: { name: string; amount: number; percent: number }[];
  }) {
    const debts: Record<number, number> = {};
    for (const split of bill.splits) {
      if (split.name === bill.paidBy) continue;
      const member = group?.members.find((m) => m.display_name === split.name);
      if (member) debts[member.id] = split.amount;
    }
    try {
      await billsService.create(groupId, {
        name: bill.expenseName,
        amount: bill.amount,
        debts,
      });
      await fetchData();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Could not create bill");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center pt-20">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-1 items-center justify-center pt-20">
        <p className="text-sm text-muted-foreground">Group not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-6 pt-20 overflow-hidden">
      {/* Members section */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Members ({group.member_count})
        </h2>
        <div className="flex gap-2">
        {group.members.map((member, i) => (
        <AvatarWithTooltip key={i} name={member.display_name} />
          ))}
          {pendingInvites.map((email, i) => (
            <GhostAvatar key={`ghost-${i}`} email={email} />
          ))}
        </div>
      </section>

      {/* Bills and Balances side by side */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Bills section */}
        <section className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold">Your Bills</h2>
            <Button size="sm" onClick={() => setBillOpen(true)}>Add Bill</Button>
          </div>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto px-6 pt-6 pb-10">
              {bills.map((bill) => (
                <Card
                  key={bill.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedBillId(bill.id)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{bill.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(bill.date_created).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex flex-col gap-1">
                    <p className="text-xl font-bold">${bill.amount}</p>
                    {bill.users_owing.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Owed by: {bill.users_owing.map((u) => u.display_name).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Your Debts section */}
        <section className="flex flex-1 flex-col gap-3">
          <h2 className="text-lg font-semibold px-6">Your Debts</h2>
          {debts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No debts yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto px-6 pt-6 pb-10">
              {debts.map((debt) => {
                const remaining = parseFloat(debt.amount) - parseFloat(debt.paid_amount);
                return (
                  <Card
                    key={debt.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedDebt(debt)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{debt.bill_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {debt.is_resolved ? "Paid" : "Outstanding"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex flex-col gap-1">
                      <p className="text-xl font-bold">${remaining.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        of ${parseFloat(debt.amount).toFixed(2)} · Owed to {debt.user_owed.display_name}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedVisibleBill && (
        <BillDetailView
          billName={selectedVisibleBill.name}
          totalAmount={Number(selectedVisibleBill.amount) || 0}
          debtors={buildDebtorsForBill(selectedVisibleBill)}
          onClose={() => setSelectedBillId(null)}
          onChangePaid={(debtor, nextPaid) =>
            handleChangePaid(selectedVisibleBill.id, debtor, nextPaid)
          }
        />
      )}

        <CreateBill
        members={group.members.map((m) => ({ name: m.display_name }))}
        open={billOpen}
        onOpenChange={handleBillClose}
        onSave={handleCreateBillSaved}
      />

      <DebtDetail
        debt={selectedDebt}
        householdId={groupId}
        open={selectedDebt !== null}
        onOpenChange={(open: boolean) => { if (!open) setSelectedDebt(null); }}
        onPaymentSubmitted={fetchData}
      />
    </div>
  );
}
