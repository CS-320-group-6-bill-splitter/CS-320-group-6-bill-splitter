"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import CreateBill from "@/components/modals/CreateBill";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [billOpen, setBillOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-20">
      {/* Members section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Members</h2>
        <div className="flex gap-2">
          {/* Member avatars will be mapped here from API data */}
          <Avatar className="h-9 w-9">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <Separator />

      {/* Bills section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bills</h2>
          <Button onClick={() => setBillOpen(true)}>Add Bill</Button>
        </div>
        <div className="grid gap-4">
          {/* Bill cards will be mapped here from API data */}
          <Card>
            <CardHeader>
              <CardTitle>Example Bill</CardTitle>
              <CardDescription>Added by John · Mar 30</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$45.00</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Debts section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Balances</h2>
        <div className="grid gap-2">
          {/* Debt summaries will be mapped here from API data */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">You owe John</span>
            <span className="text-sm font-semibold text-destructive">
              $15.00
            </span>
          </div>
        </div>
      </section>

      <CreateBill
        members={[{ name: "John Doe" }, { name: "Alex S" }, { name: "Mary K" }]}
        open={billOpen}
        onOpenChange={setBillOpen}
      />
    </div>
  );
}
