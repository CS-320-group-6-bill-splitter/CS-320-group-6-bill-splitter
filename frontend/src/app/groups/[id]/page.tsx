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
  const mockBills: Bill[] = [
    {
      id: -1,
      name: "Mock Dinner Bill",
      amount: "100.00",
      date_created: new Date().toISOString(),
      users_owing: [
        { id: 101, display_name: "artichoke", email: "a@example.com" },
        { id: 102, display_name: "bart", email: "b@example.com" },
        { id: 103, display_name: "chad", email: "c@example.com" },
      ],
    },
  ];
  const [summary, setSummary] = useState<HouseholdSummary>({});
  const [loading, setLoading] = useState(true);

  // Dummy debt data (replace with debtsService.getByHousehold(groupId) once backend is ready)
  const debts: Debt[] = [
    {
      id: 1,
      amount: "24.50",
      user_owing: { id: 10, email: "you@example.com", display_name: "You" },
      bill: { id: 101, name: "Groceries", user_owed: { id: 11, email: "alice@example.com", display_name: "Alice" }, date_created: "2026-04-10T00:00:00Z" },
      is_resolved: false,
      payments: [
        { id: 1, amount: "5.00", user_paying: { id: 10, email: "you@example.com", display_name: "You" }, date: "2026-04-11T00:00:00Z", method: "Venmo" },
        { id: 2, amount: "7.50", user_paying: { id: 10, email: "you@example.com", display_name: "You" }, date: "2026-04-13T00:00:00Z", method: "Cash" },
      ],
    },
    {
      id: 2,
      amount: "45.00",
      user_owing: { id: 10, email: "you@example.com", display_name: "You" },
      bill: { id: 102, name: "Electric Bill", user_owed: { id: 12, email: "bob@example.com", display_name: "Bob" }, date_created: "2026-04-08T00:00:00Z" },
      is_resolved: false,
      payments: [
        { id: 3, amount: "20.00", user_paying: { id: 10, email: "you@example.com", display_name: "You" }, date: "2026-04-09T00:00:00Z", method: "Zelle" },
      ],
    },
    {
      id: 3,
      amount: "15.75",
      user_owing: { id: 10, email: "you@example.com", display_name: "You" },
      bill: { id: 103, name: "Internet", user_owed: { id: 13, email: "charlie@example.com", display_name: "Charlie" }, date_created: "2026-04-05T00:00:00Z" },
      is_resolved: false,
      payments: [],
    },
  ];

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
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBillClose(open: boolean) {
    setBillOpen(open);
    if (!open) fetchData();
  }

  const visibleBills = bills.length > 0 ? bills : mockBills;
  const selectedVisibleBill = visibleBills.find((b) => b.id === selectedBillId) ?? null;

  function buildDebtorsForBill(bill: Bill): Debtor[] {
    const total = Number(bill.amount) || 0;
    const users = bill.users_owing ?? [];
    if (users.length === 0) return [];

    const equalShare = total / users.length;
    const paidMap = mockPaidByBill[bill.id] ?? {};

    return users.map((u) => ({
      id: u.id,
      name: u.display_name,
      totalOwed: equalShare,
      paidAmount: paidMap[u.id] ?? 0,
    }));
  }

  function handleChangePaid(billId: number, debtorId: number, nextPaid: number) {
    setMockPaidByBill((prev) => ({
      ...prev,
      [billId]: {
        ...(prev[billId] ?? {}),
        [debtorId]: nextPaid,
      },
    }));
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Bills</h2>
            <Button size="sm" onClick={() => setBillOpen(true)}>Add Bill</Button>
          </div>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills yet.</p>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {bills.map((bill) => (
                <Card
                  key={bill.id}
                  className="cursor-pointer transition hover:shadow-md border border-black"
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
          {bills.length === 0 && (
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {mockBills.map((bill) => (
                <Card
                  key={bill.id}
                  className="cursor-pointer transition hover:shadow-md"
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
          <h2 className="text-lg font-semibold">Your Debts</h2>
          {debts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No debts yet.</p>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {debts.map((debt) => (
                <Card
                  key={debt.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setSelectedDebt(debt)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">{debt.bill.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(debt.bill.date_created).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex flex-col gap-1">
                    <p className="text-xl font-bold">${parseFloat(debt.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      Owed to: {debt.bill.user_owed.display_name}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
          onChangePaid={(debtorId, nextPaid) =>
            handleChangePaid(selectedVisibleBill.id, debtorId, nextPaid)
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
        open={selectedDebt !== null}
        onOpenChange={(open: boolean) => { if (!open) setSelectedDebt(null); }}
        onPaymentSubmitted={fetchData}
      />
    </div>
  );
}
