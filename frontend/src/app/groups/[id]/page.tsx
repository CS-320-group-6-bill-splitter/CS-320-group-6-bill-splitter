"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
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
import { billsService, type BillStatus } from "@/services/bills";
import { debtsService, type DebtStatus } from "@/services/debts";
import { Household, Bill, Debt, HouseholdSummary } from "@/types";
import { parseMemberName } from "@/lib/utils";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const { id } = use(params);
  const groupId = Number(id);
  const [billOpen, setBillOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [group, setGroup] = useState<Household | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<HouseholdSummary>({});
  const [loading, setLoading] = useState(true);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [billsView, setBillsView] = useState<BillStatus>("unresolved");
  const [debtsView, setDebtsView] = useState<DebtStatus>("unresolved");

  const pendingInvites = (group?.pending_invitations ?? []).map((inv) => inv.email);

  const fetchData = useCallback(() => {
    groupsService.getById(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
    billsService.getByHousehold(groupId, billsView)
      .then(setBills)
      .catch(() => setBills([]));
    debtsService.getByHousehold(groupId, debtsView)
      .then(setDebts)
      .catch(() => setDebts([]));
  }, [groupId, billsView, debtsView]);

  // Initial group load — kept separate so toggling filters doesn't re-trigger
  // the full-page loading spinner.
  useEffect(() => {
    setLoading(true);
    groupsService.getById(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    billsService.getByHousehold(groupId, billsView)
      .then(setBills)
      .catch(() => setBills([]));
  }, [groupId, billsView]);

  useEffect(() => {
    debtsService.getByHousehold(groupId, debtsView)
      .then(setDebts)
      .catch(() => setDebts([]));
  }, [groupId, debtsView]);

  function handleBillClose(open: boolean) {
    setBillOpen(open);
    if (!open) fetchData();
  }

  const selectedVisibleBill = bills.find((b) => b.id === selectedBillId) ?? null;

  function buildDebtorsForBill(bill: Bill): Debtor[] {
    const debts = bill.debts ?? [];
    return debts.map((d) => ({
      id: d.user_owing.id,
      debtId: d.id,
      name: d.user_owing.display_name,
      totalOwed: parseFloat(d.amount),
      paidAmount: parseFloat(d.paid_amount),
    }));
  }

  async function handleRenameBill(billId: number, newName: string) {
    try {
      await billsService.rename(groupId, billId, newName);
      await fetchData();
    } catch (e) {
      console.error("Failed to rename bill:", e);
      alert(e instanceof Error ? e.message : "Could not rename bill");
    }
  }

  async function handleDeleteBill(billId: number) {
    try {
      await billsService.delete(groupId, billId);
      setSelectedBillId(null);
      await fetchData();
    } catch (e) {
      console.error("Failed to delete bill:", e);
      alert(e instanceof Error ? e.message : "Could not delete bill");
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
    <div className="flex h-screen flex-col gap-4 px-24 py-6 pt-20 overflow-hidden">
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Your Bills</h2>
            <Button variant="ghost" size="icon" onClick={() => setBillOpen(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={billsView === "unresolved" ? "default" : "outline"}
              onClick={() => setBillsView("unresolved")}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={billsView === "resolved" ? "default" : "outline"}
              onClick={() => setBillsView("resolved")}
            >
              Resolved
            </Button>
          </div>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {billsView === "unresolved" ? "No active bills." : "No resolved bills."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto px-2 pt-6 pb-10">
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
          <h2 className="text-lg font-semibold">Your Debts</h2>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={debtsView === "unresolved" ? "default" : "outline"}
              onClick={() => setDebtsView("unresolved")}
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={debtsView === "resolved" ? "default" : "outline"}
              onClick={() => setDebtsView("resolved")}
            >
              Resolved
            </Button>
          </div>
          {debts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {debtsView === "unresolved" ? "No active debts." : "No resolved debts."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto px-2 pt-6 pb-10">
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
          onRename={(newName) => handleRenameBill(selectedVisibleBill.id, newName)}
          onDelete={() => handleDeleteBill(selectedVisibleBill.id)}
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
