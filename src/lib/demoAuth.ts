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
  email: 'demo@vakildesk.local',
  username: username?.trim() || 'demo',
  role: 'admin',
  isActive: true,
  tenant_id: DEMO_TENANT_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
});

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
