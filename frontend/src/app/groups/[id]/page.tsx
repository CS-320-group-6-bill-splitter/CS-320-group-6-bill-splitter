"use client";

import { use, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CreateBill from "@/components/modals/CreateBill";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AvatarWithTooltip } from "@/components/avatar-with-tooltip";
import { groupsService } from "@/services/groups";
import { billsService } from "@/services/bills";
import { Household, HouseholdSummary, Bill } from "@/types";
import { parseMemberName } from "@/lib/utils";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const groupId = Number(id);
  const [billOpen, setBillOpen] = useState(false);
  const [group, setGroup] = useState<Household | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<HouseholdSummary>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    groupsService.getById(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
    billsService.getByHousehold(groupId)
      .then(setBills)
      .catch(() => setBills([]));
    groupsService.getSummary(groupId)
      .then(setSummary)
      .catch(() => setSummary({}));
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleBillClose(open: boolean) {
    setBillOpen(open);
    if (!open) fetchData();
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
            <AvatarWithTooltip key={i} name={member} />
          ))}
        </div>
      </section>

      {/* Bills and Balances side by side */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Bills section */}
        <section className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bills</h2>
            <Button size="sm" onClick={() => setBillOpen(true)}>Add Bill</Button>
          </div>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills yet.</p>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              {bills.map((bill) => (
                <Card key={bill.id}>
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

        {/* Balances section */}
        <section className="flex flex-1 flex-col gap-3">
          <h2 className="text-lg font-semibold">Balances</h2>
          {Object.keys(summary).length === 0 ? (
            <p className="text-sm text-muted-foreground">No balances yet.</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {Object.entries(summary).map(([memberId, data]) => {
                const net = data.they_owe_me - data.i_owe_them;
                if (net === 0) return null;
                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm">
                      {net > 0
                        ? `${data.display_name} owes you`
                        : `You owe ${data.display_name}`}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        net > 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      ${Math.abs(net).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <CreateBill
        members={group.members.map((m) => ({ name: parseMemberName(m) }))}
        open={billOpen}
        onOpenChange={handleBillClose}
      />
    </div>
  );
}
