import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, CreateUserData, UserRole } from '../types';
import {
  authenticateUser,
  getAllUsers as getAllUsersDb,
  createUserAccount as createUserAccountDb,
  updateUserRoleDb,
  toggleUserStatusDb,
  deleteUserAccountDb,
} from '../lib/userManagement';
import { isSupabaseConfigured } from '../lib/supabase';
import { demoAuthenticate, getDemoUser, getDemoTeam } from '../lib/demoAuth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'lf_cached_user';

// Read user from localStorage cache for instant load on refresh
const getCachedUser = (): User | null => {
  try {
    const cached = localStorage.getItem(CACHED_USER_KEY);
    if (!cached) return null;
    const p = JSON.parse(cached);
    if (!p?.id) return null;
    return {
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    };
  } catch {
    return null;
  }
};

const cacheUser = (u: User | null) => {
  if (u) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(CACHED_USER_KEY);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cached = getCachedUser();
  // DEMO MODE: no real Supabase project connected and nobody has "logged
  // in" yet in this browser — skip the login page entirely and drop
  // straight into the app as a demo admin. Once a real database is
  // connected, isSupabaseConfigured() is true and this has no effect, so
  // the real login screen/flow behaves exactly as before.
  const initialUser = cached || (!isSupabaseConfigured() ? getDemoUser('Demo Admin') : null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist the auto-created demo session the same way a real login would,
  // so refreshes and TenantProvider's localStorage fallback both see it.
  useEffect(() => {
    if (!cached && initialUser) {
      cacheUser(initialUser);
      localStorage.setItem('tenant_id', initialUser.tenant_id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On mount, if we have a cached user, load team users for admin
  // (skipped in demo mode — no real backend to call)
  useEffect(() => {
    if (user?.role === 'admin' && isSupabaseConfigured()) {
      getAllUsersDb().then(res => {
        if (res.success && res.users) setUsers(res.users);
      });
    } else if (user?.role === 'admin') {
      // Demo mode — show a sample team roster instead of just the solo
      // demo admin, so features like Admin Panel and Salary tracking
      // have people to work with.
      setUsers(getDemoTeam(user));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Demo mode — no real Supabase project connected. Any
      // username/password logs in as a demo admin so the app (and its
      // built-in demo data) can be browsed/shown without a backend.
      const result = isSupabaseConfigured()
        ? await authenticateUser(username, password)
        : await demoAuthenticate(username, password);

      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }

      setUser(result.user);
      cacheUser(result.user);
      localStorage.setItem('tenant_id', result.user.tenant_id || '');

      // Load team users if admin (skipped in demo mode — no real backend)
      if (result.user.role === 'admin' && isSupabaseConfigured()) {
        getAllUsersDb().then(res => {
          if (res.success && res.users) setUsers(res.users);
        });
      } else if (result.user.role === 'admin') {
        setUsers(getDemoTeam(result.user));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setUsers([]);
    cacheUser(null);
    localStorage.removeItem('tenant_id');
    localStorage.removeItem(CACHED_USER_KEY);
  };

  // DEMO MODE: if someone explicitly logs out while no real backend is
  // connected, log them straight back in as the demo admin on the next
  // render instead of leaving them stuck on a login screen that doesn't
  // do anything real. Real logout (with a real backend) behaves normally.
  useEffect(() => {
    if (!user && !isSupabaseConfigured()) {
      const demo = getDemoUser('Demo Admin');
      setUser(demo);
      cacheUser(demo);
      localStorage.setItem('tenant_id', demo.tenant_id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createUser = async (userData: CreateUserData): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'This is a demo preview — connect a real database to create team members.' };
    }
    try {
      const result = await createUserAccountDb(userData, user?.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) setUsers(res.users);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'This is a demo preview — connect a real database to manage roles.' };
    }
    try {
      const result = await updateUserRoleDb(userId, role, user.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) {
        setUsers(res.users);
        if (user.id === userId) {
          const updated = res.users.find(u => u.id === userId);
          if (updated) {
            setUser(updated);
            cacheUser(updated);
          }
        }
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update role' };
    }
  };

  const toggleUserStatus = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'This is a demo preview — connect a real database to manage users.' };
    }
    try {
      const result = await toggleUserStatusDb(userId, user.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) setUsers(res.users);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to toggle status' };
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'This is a demo preview — connect a real database to delete users.' };
    }
    try {
      const result = await deleteUserAccountDb(userId, user.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) setUsers(res.users);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to delete user' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, users,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login, logout,
      createUser, updateUserRole, toggleUserStatus, deleteUser,
      loading, error,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
