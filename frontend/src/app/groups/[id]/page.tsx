"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateBill from "@/components/modals/CreateBill";
import BillDetailView, { Debtor } from "@/components/modals/BillDetailView";
import DebtDetail from "@/components/modals/DebtDetail";
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
  const { id } = use(params);
  const groupId = Number(id);
  const [billOpen, setBillOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [group, setGroup] = useState<Household | null>(null);
  const [billsByStatus, setBillsByStatus] = useState<Record<BillStatus, Bill[]>>({
    unresolved: [],
    resolved: [],
  });
  const [debtsByStatus, setDebtsByStatus] = useState<Record<DebtStatus, Debt[]>>({
    unresolved: [],
    resolved: [],
  });
  const [summary, setSummary] = useState<HouseholdSummary>({});
  const [loading, setLoading] = useState(true);

  const [billsView, setBillsView] = useState<BillStatus>("unresolved");
  const [debtsView, setDebtsView] = useState<DebtStatus>("unresolved");

  // Render the currently-selected status from cache; toggling between Active
  // and Resolved is a pure state read with no network round-trip.
  const bills = billsByStatus[billsView];
  const debts = debtsByStatus[debtsView];

  const { user: authUser } = useAuth();
  const [memberPanelMember, setMemberPanelMember] = useState<{
    id: number;
    display_name: string;
  } | null>(null);
  const [memberPanelBills, setMemberPanelBills] = useState<Bill[]>([]);
  const [memberPanelDebts, setMemberPanelDebts] = useState<Debt[]>([]);
  const [memberPanelLoading, setMemberPanelLoading] = useState(false);

  const pendingInvites = (group?.pending_invitations ?? []).map((inv) => inv.email);

  // Fetch both Active and Resolved buckets in parallel and cache them. Toggling
  // the filter is then a free local state read; no fetch required.
  const fetchBills = useCallback(() => {
    Promise.all([
      billsService.getByHousehold(groupId, "unresolved"),
      billsService.getByHousehold(groupId, "resolved"),
    ])
      .then(([unresolved, resolved]) =>
        setBillsByStatus({ unresolved, resolved })
      )
      .catch(() => setBillsByStatus({ unresolved: [], resolved: [] }));
  }, [groupId]);

  const fetchDebts = useCallback(() => {
    Promise.all([
      debtsService.getByHousehold(groupId, "unresolved"),
      debtsService.getByHousehold(groupId, "resolved"),
    ])
      .then(([unresolved, resolved]) =>
        setDebtsByStatus({ unresolved, resolved })
      )
      .catch(() => setDebtsByStatus({ unresolved: [], resolved: [] }));
  }, [groupId]);

  const fetchData = useCallback(() => {
    groupsService.getById(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
    fetchBills();
    fetchDebts();
  }, [groupId, fetchBills, fetchDebts]);

  // Initial group load — kept separate so it doesn't re-trigger the full-page
  // loading spinner when bills/debts refetch.
  useEffect(() => {
    setLoading(true);
    groupsService.getById(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [groupId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  useEffect(() => {
    if (!memberPanelMember) {
      setMemberPanelBills([]);
      setMemberPanelDebts([]);
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
      })
      .catch(() => {
        if (cancelled) return;
        setMemberPanelBills([]);
        setMemberPanelDebts([]);
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
    return debts.map((d) => ({
      id: d.user_owing.id,
      debtId: d.id,
      name: d.user_owing.display_name,
      totalOwed: parseFloat(d.amount),
      paidAmount: parseFloat(d.paid_amount),
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
          <div
            className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden"
            style={{
              backgroundColor: "#7a6528",
              boxShadow:
                "0 0 24px 8px rgba(122, 101, 40, 0.45), 0 0 60px 20px rgba(122, 101, 40, 0.25), 0 0 120px 40px rgba(122, 101, 40, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.15)",
            }}
          >
            {bills.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-[#fdf6e3]/60">
                  {billsView === "unresolved" ? "No active bills." : "No resolved bills."}
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto text-[#fdf6e3] py-2">
                {bills.map((bill, idx) => (
                  <div
                    key={bill.id}
                    onClick={() => setSelectedBillId(bill.id)}
                    className="relative cursor-pointer px-6 py-4 hover:bg-white/5 transition-colors flex items-start justify-between gap-4"
                  >
                    {idx > 0 && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute top-0 left-[15%] right-[15%] h-px bg-[#fdf6e3]/15"
                      />
                    )}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="text-base font-medium truncate">{bill.name}</div>
                      <div className="text-xs text-[#fdf6e3]/70">
                        {new Date(bill.date_created).toLocaleDateString()}
                      </div>
                      {bill.users_owing.length > 0 && (
                        <div className="text-xs text-[#fdf6e3]/70 truncate">
                          Owed by: {bill.users_owing.map((u) => u.display_name).join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-bold shrink-0">${bill.amount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div
            className="flex-1 min-h-0 flex flex-col rounded-lg overflow-hidden"
            style={{
              backgroundColor: "#7a6528",
              boxShadow:
                "0 0 24px 8px rgba(122, 101, 40, 0.45), 0 0 60px 20px rgba(122, 101, 40, 0.25), 0 0 120px 40px rgba(122, 101, 40, 0.1), inset 0 0 40px rgba(0, 0, 0, 0.15)",
            }}
          >
            {debts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-[#fdf6e3]/60">
                  {debtsView === "unresolved" ? "No active debts." : "No resolved debts."}
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto text-[#fdf6e3] py-2">
                {debts.map((debt, idx) => {
                  const remaining = parseFloat(debt.amount) - parseFloat(debt.paid_amount);
                  return (
                    <div
                      key={debt.id}
                      onClick={() => setSelectedDebt(debt)}
                      className="relative cursor-pointer px-6 py-4 hover:bg-white/5 transition-colors flex items-start justify-between gap-4"
                    >
                      {idx > 0 && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute top-0 left-[15%] right-[15%] h-px bg-[#fdf6e3]/15"
                        />
                      )}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="text-base font-medium truncate">{debt.bill_name}</div>
                        <div className="text-xs text-[#fdf6e3]/70">
                          {debt.is_resolved ? "Paid" : "Outstanding"}
                        </div>
                        <div className="text-xs text-[#fdf6e3]/70 truncate">
                          Owed to {debt.user_owed.display_name}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="text-xl font-bold">${remaining.toFixed(2)}</div>
                        <div className="text-xs text-[#fdf6e3]/70">
                          of ${parseFloat(debt.amount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedVisibleBill && (
        <BillDetailView
          billName={selectedVisibleBill.name}
          totalAmount={Number(selectedVisibleBill.amount) || 0}
          debtors={buildDebtorsForBill(selectedVisibleBill)}
          splitDebtors={buildSplitAgreementDebtorsForBill(selectedVisibleBill)}
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

      {memberPanelMember && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4"
          role="presentation"
        >
          <div
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-hidden rounded-lg border bg-background p-6 shadow-lg"
            role="dialog"
            aria-labelledby="member-panel-title"
          >
            {/* Close button — the only way to exit this modal */}
            <button
              onClick={() => setMemberPanelMember(null)}
              aria-label="Close"
              className="absolute right-3 top-3 cursor-pointer text-xl font-bold leading-none text-foreground origin-center transition-transform duration-150 hover:scale-125"
            >
              &times;
            </button>
            <div className="flex items-start justify-between gap-2 pr-8">
              <div>
                <h3 id="member-panel-title" className="text-lg font-semibold">
                  With {parseMemberName(memberPanelMember.display_name)}
                </h3>
              </div>
            </div>
            {memberPanelLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (() => {
              // Compute unpaid totals from the fetched data so payments made
              // are subtracted. Backend's they_owe_me / i_owe_them sum the
              // gross debt.amount for unresolved debts and ignore paid_amount.
              const theyOweRemaining = memberPanelBills.reduce((sum, b) => {
                const theirDebt = b.debts?.find(
                  (d) => d.user_owing.id === memberPanelMember.id
                );
                if (!theirDebt) return sum;
                const owed = parseFloat(theirDebt.amount) || 0;
                const paid = parseFloat(theirDebt.paid_amount) || 0;
                return sum + Math.max(0, owed - paid);
              }, 0);
              const iOweRemaining = memberPanelDebts.reduce((sum, d) => {
                const owed = parseFloat(d.amount) || 0;
                const paid = parseFloat(d.paid_amount) || 0;
                return sum + Math.max(0, owed - paid);
              }, 0);
              return (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">They owe you (unpaid)</p>
                    <p className="text-lg font-semibold">
                      ${theyOweRemaining.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">You owe them (unpaid)</p>
                    <p className="text-lg font-semibold">
                      ${iOweRemaining.toFixed(2)}
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
                          const owed = parseFloat(
                            String(theirDebt?.amount ?? b.amount)
                          );
                          const paid = parseFloat(
                            String(theirDebt?.paid_amount ?? "0")
                          );
                          const remaining = Number.isFinite(owed)
                            ? Math.max(0, owed - (paid || 0))
                            : NaN;
                          const shareLabel = Number.isFinite(remaining)
                            ? remaining.toFixed(2)
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
                        {memberPanelDebts.map((d) => {
                          const owed = parseFloat(d.amount) || 0;
                          const paid = parseFloat(d.paid_amount) || 0;
                          const remaining = Math.max(0, owed - paid);
                          return (
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
                                ${remaining.toFixed(2)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
