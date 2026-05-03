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
import { billsService, type BillStatus } from "@/services/bills";
import { debtsService, type DebtStatus } from "@/services/debts";
import { Household, Bill, Debt, HouseholdSummary } from "@/types";
import { parseMemberName } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

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
  const [billsView, setBillsView] = useState<BillStatus>("unresolved");
  const [debtsView, setDebtsView] = useState<DebtStatus>("unresolved");

  const { user: authUser } = useAuth();
  const [memberPanelMember, setMemberPanelMember] = useState<{
    id: number;
    display_name: string;
  } | null>(null);
  const [memberPanelBills, setMemberPanelBills] = useState<Bill[]>([]);
  const [memberPanelDebts, setMemberPanelDebts] = useState<Debt[]>([]);
  const [memberPanelTheyOwe, setMemberPanelTheyOwe] = useState<number | null>(null);
  const [memberPanelIOwe, setMemberPanelIOwe] = useState<number | null>(null);
  const [memberPanelLoading, setMemberPanelLoading] = useState(false);

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

  useEffect(() => {
    if (!memberPanelMember) {
      setMemberPanelBills([]);
      setMemberPanelDebts([]);
      setMemberPanelTheyOwe(null);
      setMemberPanelIOwe(null);
      return;
    }
    let cancelled = false;
    setMemberPanelLoading(true);
    Promise.all([
      billsService.getByHouseholdAndUser(groupId, memberPanelMember.id),
      debtsService.getByHouseholdAndUser(groupId, memberPanelMember.id),
    ])
      .then(([billsRes, debtsRes]) => {
        if (cancelled) return;
        setMemberPanelBills(billsRes.bills ?? []);
        setMemberPanelDebts(debtsRes.debts ?? []);
        setMemberPanelTheyOwe(Number(billsRes.they_owe_me) || 0);
        setMemberPanelIOwe(Number(debtsRes.i_owe_them) || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setMemberPanelBills([]);
        setMemberPanelDebts([]);
        setMemberPanelTheyOwe(null);
        setMemberPanelIOwe(null);
      })
      .finally(() => {
        if (!cancelled) setMemberPanelLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId, memberPanelMember]);

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
      id: d.user_owing.id,
      debtId: d.id,
      name: d.user_owing.display_name,
      totalOwed: parseFloat(d.amount),
      paidAmount: overrideMap[d.user_owing.id] ?? parseFloat(d.paid_amount),
    }));
  }

  /** Split agreement: include the payer’s share (bill total minus sum of debts), named from `user_owed`. */
  function buildSplitAgreementDebtorsForBill(bill: Bill): Debtor[] {
    const debtRows = buildDebtorsForBill(bill);
    const raw = bill.debts ?? [];
    if (raw.length === 0) return debtRows;

    const billTotal = parseFloat(String(bill.amount)) || 0;
    const owedSum = debtRows.reduce((s, r) => s + r.totalOwed, 0);
    const payerShare = Math.max(0, billTotal - owedSum);
    const creditor = raw[0].user_owed;
    if (payerShare <= 0.001 || !creditor) return debtRows;

    const payerRow: Debtor = {
      id: creditor.id,
      debtId: -1,
      name: creditor.display_name,
      totalOwed: payerShare,
      paidAmount: payerShare,
    };
    return [payerRow, ...debtRows];
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
    <div className="flex h-screen flex-col gap-4 px-24 py-6 pt-20 overflow-hidden">
      {/* Members section */}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Members ({group.member_count})
        </h2>
        <div className="flex gap-2">
        {group.members.map((member, i) => {
          const isYou = authUser != null && member.id === authUser.id;
          if (isYou) {
            return (
              <span
                key={member.id ?? i}
                className="inline-flex cursor-default rounded-full opacity-100"
                title="You"
              >
                <AvatarWithTooltip name={member.display_name} />
              </span>
            );
          }
          return (
            <button
              key={member.id ?? i}
              type="button"
              className="rounded-full border-0 bg-transparent p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={`Bills & debts with ${parseMemberName(member.display_name)}`}
              onClick={() =>
                setMemberPanelMember({ id: member.id, display_name: member.display_name })
              }
            >
              <AvatarWithTooltip name={member.display_name} />
            </button>
          );
        })}
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
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pt-6 pb-10">
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
            <div className="grid grid-cols-2 gap-3 overflow-y-auto pt-6 pb-10">
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
          splitDebtors={buildSplitAgreementDebtorsForBill(selectedVisibleBill)}
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

      {memberPanelMember && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setMemberPanelMember(null)}
          role="presentation"
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-lg border bg-background p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="member-panel-title"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 id="member-panel-title" className="text-lg font-semibold">
                  With {parseMemberName(memberPanelMember.display_name)}
                </h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setMemberPanelMember(null)}>
                Close
              </Button>
            </div>
            {memberPanelLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">They owe you (unpaid)</p>
                    <p className="text-lg font-semibold">
                      ${(memberPanelTheyOwe ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">You owe them (unpaid)</p>
                    <p className="text-lg font-semibold">
                      ${(memberPanelIOwe ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Related bills</h4>
                    {memberPanelBills.length === 0 ? (
                      <p className="text-xs text-muted-foreground">None.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {memberPanelBills.map((b) => {
                          const theirDebt = b.debts?.find(
                            (d) => d.user_owing.id === memberPanelMember.id
                          );
                          const share = parseFloat(
                            String(theirDebt?.amount ?? b.amount)
                          );
                          const shareLabel = Number.isFinite(share)
                            ? share.toFixed(2)
                            : String(b.amount);
                          return (
                          <li
                            key={b.id}
                            className="flex cursor-pointer justify-between rounded-md border px-3 py-2 hover:bg-muted/50"
                            onClick={() => {
                              setMemberPanelMember(null);
                              setSelectedBillId(b.id);
                            }}
                          >
                            <span>{b.name}</span>
                            <span className="font-medium">${shareLabel}</span>
                          </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Related debts</h4>
                    {memberPanelDebts.length === 0 ? (
                      <p className="text-xs text-muted-foreground">None.</p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {memberPanelDebts.map((d) => (
                          <li
                            key={d.id}
                            className="flex cursor-pointer justify-between rounded-md border px-3 py-2 hover:bg-muted/50"
                            onClick={() => {
                              setMemberPanelMember(null);
                              setSelectedDebt(d);
                            }}
                          >
                            <span>{d.bill_name}</span>
                            <span className="text-muted-foreground">
                              ${parseFloat(d.amount).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
