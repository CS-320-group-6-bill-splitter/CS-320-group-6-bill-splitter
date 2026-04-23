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

export interface BillDebt {
  id: number;
  amount: string;
  paid_amount: string;
  is_resolved: boolean;
  user: {
    id: number;
    display_name: string;
    email: string;
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
  debts: BillDebt[];
}

export interface Split {
  id: string;
  bill_id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
}

// Matches backend PaymentSerializer
export interface DebtPayment {
  id: number;
  amount: string;
  date_created: string;
  user_from: string;
  user_to: string;
  bill_name: string;
  // method: TBD — backend Payment model doesn't store payment method yet
}

// Matches backend DebtSerializer
export interface Debt {
  id: number;
  amount: string;
  paid_amount: string;
  is_resolved: boolean;
  user_owing: User;
  user_owed: User;
  bill: number; // FK id (backend returns the int, not a nested object)
  bill_name: string;
  // payments are fetched separately via debtsService.getPayments
  payments?: DebtPayment[];
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
