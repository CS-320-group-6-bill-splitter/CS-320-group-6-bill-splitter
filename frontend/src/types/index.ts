// Core types for the bill splitter app

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  members: User[];
  created_at: string;
}

export interface Bill {
  id: string;
  title: string;
  total_amount: number;
  group_id: string;
  created_by: string;
  splits: Split[];
  created_at: string;
}

export interface Split {
  id: string;
  bill_id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
}
