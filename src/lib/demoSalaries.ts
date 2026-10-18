// Built-in demo salary records — lets the admin-only Salary tracker
// (Expenses → Salary tab) be tested end-to-end without a real database.
// Tied to the demo team roster in demoAuth.ts (demo-user-1..4) so
// selecting a month shows realistic per-person salary rows.
//
// Shown only as a fallback when there is no real tenant/login (see
// DataContext). Once a real account logs in against a real database,
// this disappears and real salary records load instead.

import { Salary } from '../types';

const monthKey = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

type DemoSalarySeed = {
  userId: string;
  userName: string;
  amount: number;
  monthOffset: number; // 0 = current month, -1 = last month, etc.
  paid: boolean;
  notes?: string;
};

const SEEDS: DemoSalarySeed[] = [
  { userId: 'demo-user-1', userName: 'Demo Admin', amount: 60000, monthOffset: 0, paid: true, notes: 'Owner / Admin draw' },
  { userId: 'demo-user-2', userName: 'Priya Sharma', amount: 42000, monthOffset: 0, paid: true, notes: 'Manager salary' },
  { userId: 'demo-user-3', userName: 'Rahul Deshmukh', amount: 28000, monthOffset: 0, paid: false, notes: 'Pending — awaiting transfer' },
  { userId: 'demo-user-4', userName: 'Ayesha Khan', amount: 26000, monthOffset: 0, paid: true },

  { userId: 'demo-user-1', userName: 'Demo Admin', amount: 60000, monthOffset: -1, paid: true },
  { userId: 'demo-user-2', userName: 'Priya Sharma', amount: 40000, monthOffset: -1, paid: true },
  { userId: 'demo-user-3', userName: 'Rahul Deshmukh', amount: 28000, monthOffset: -1, paid: true },
  { userId: 'demo-user-4', userName: 'Ayesha Khan', amount: 25000, monthOffset: -1, paid: true },
];

export const getDemoSalaries = (): Salary[] => {
  const now = new Date();
  return SEEDS.map((s, i) => ({
    id: `demo-salary-${i + 1}`,
    userId: s.userId,
    userName: s.userName,
    amount: s.amount,
    month: monthKey(s.monthOffset),
    notes: s.notes,
    paid: s.paid,
    addedBy: 'demo-user-1',
    addedByName: 'Demo Admin',
    createdAt: now,
    updatedAt: now,
  }));
};
