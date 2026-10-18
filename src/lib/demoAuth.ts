// Demo-mode authentication — lets the whole app be browsed and shown to
// people (dashboard, cases, settings, browse-by-court, etc.) when no real
// Supabase backend is connected yet, instead of blocking behind a
// "Configuration Required" screen.
//
// This only activates when `isSupabaseConfigured()` is false (see
// supabase.ts). The moment real credentials are set, this is bypassed
// entirely and the real `authenticate_user` RPC takes over — nothing here
// runs or interferes once a real database is connected.

import { User } from '../types';

export const DEMO_TENANT_ID = 'demo-tenant-1';

export const getDemoUser = (username: string): User => ({
  id: 'demo-user-1',
  name: username?.trim() || 'Demo Admin',
  email: 'demo@vidyasagarsir.local',
  username: username?.trim() || 'demo',
  role: 'admin',
  isActive: true,
  tenant_id: DEMO_TENANT_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/** Demo team roster — gives the Admin Panel and the new Salary tracker
 *  (Expenses → Salary, admin-only) some sample team members to work with
 *  when no real database is connected. The signed-in demo admin
 *  (getDemoUser) is always included first so "added by" attribution and
 *  self-reference checks behave the same as with a real team. */
export const getDemoTeam = (adminUser: User): User[] => {
  const demoStaff: User[] = [
    {
      id: 'demo-user-2',
      name: 'Priya Sharma',
      email: 'priya.sharma@vidyasagarsir.local',
      username: 'priya.sharma',
      role: 'manager',
      isActive: true,
      tenant_id: DEMO_TENANT_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-user-3',
      name: 'Rahul Deshmukh',
      email: 'rahul.deshmukh@vidyasagarsir.local',
      username: 'rahul.deshmukh',
      role: 'user',
      isActive: true,
      tenant_id: DEMO_TENANT_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-user-4',
      name: 'Ayesha Khan',
      email: 'ayesha.khan@vidyasagarsir.local',
      username: 'ayesha.khan',
      role: 'user',
      isActive: true,
      tenant_id: DEMO_TENANT_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  return [adminUser, ...demoStaff];
};

/** Demo-mode "login" — always succeeds, no real backend call. Any
 *  username/password is accepted so the person showing the demo doesn't
 *  need to remember a specific credential. */
export const demoAuthenticate = async (
  username: string,
  _password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  if (!username?.trim()) {
    return { success: false, error: 'Enter any username to continue (demo mode).' };
  }
  return { success: true, user: getDemoUser(username) };
};
