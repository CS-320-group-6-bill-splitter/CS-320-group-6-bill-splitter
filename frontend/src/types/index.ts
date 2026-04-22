// Core types for the bill splitter app

export interface User {
  id: number;
  email: string;
  display_name: string;
  profile_picture?: string | null;
}

export interface PendingInvitation {
  email: string;
  created_at: string;
}

export interface Household {
  id: number;
  name: string;
  members: { id: number; display_name: string }[];
  member_count: number;
  pending_invitations?: PendingInvitation[];
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

// Matches the backend HouseholdInvitationSerializer response
export interface Invite {
  token: string;
  household_id: number;
  household_name: string;
  email: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

// Combined response from GET /households/
export interface HouseholdsResponse {
  memberships: Household[];
  invitations: Invite[];
}

// Keep Group as alias for backwards compat in components
export type Group = Household;
