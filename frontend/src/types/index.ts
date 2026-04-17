// Core types for the bill splitter app

export interface User {
  id: number;
  email: string;
  display_name: string;
  profile_picture?: string | null;
}

export interface Household {
  id: number;
  name: string;
  members: string[];
  member_count: number;
}

export interface HouseholdSummary {
  [memberId: string]: {
    display_name: string;
    they_owe_me: number;
    i_owe_them: number;
  };
}

export interface Bill {
  id: number;
  name: string;
  amount: string;
  date_created: string;
  users_owing: {
    id: number;
    display_name: string;
    email: string;
  }[];
}

export interface Split {
  id: string;
  bill_id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
}

export interface DebtPayment {
  id: number;
  amount: string;
  user_paying: User;
  date: string;
  method: string;
}

export interface Debt {
  id: number;
  amount: string;
  user_owing: User;
  bill: {
    id: number;
    name: string;
    user_owed: User;
    date_created: string;
  };
  is_resolved: boolean;
  payments: DebtPayment[];
}

export interface Invite {
  id: number;
  email: string;
  household: Household;
  status: "pending" | "accepted" | "declined";
}

// Keep Group as alias for backwards compat in components
export type Group = Household;
