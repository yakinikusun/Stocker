import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SupabaseConfig, UserRole } from '../types/stock';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  setForceOffline,
  getSupabaseClient,
  loadLocalUser,
  saveLocalUser,
  loadFamilyAccounts,
  saveFamilyAccounts
} from '../lib/supabase';
import { MOCK_USERS } from '../lib/mockData';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  familyAccounts: UserProfile[];
  supabaseConfig: SupabaseConfig;
  login: (identifier: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateProfile: (name: string, password?: string) => Promise<boolean>;
  updateSupabaseConfig: (url: string, anonKey: string) => void;
  toggleSupabaseMode: (active: boolean) => void;
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => loadLocalUser());
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());
  const [familyAccounts] = useState<UserProfile[]>(() => loadFamilyAccounts());

  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const email = session.user.email || '';
          const loginId = session.user.user_metadata?.login_id || email.split('@')[0] || 'user';
          setUser({
            id: session.user.id,
            login_id: loginId,
            email: email || `${loginId}@freezer.local`,
            name: session.user.user_metadata?.name || loginId,
            role: session.user.user_metadata?.role || 'member'
          });
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const email = session.user.email || '';
          const loginId = session.user.user_metadata?.login_id || email.split('@')[0] || 'user';
          setUser({
            id: session.user.id,
            login_id: loginId,
            email: email || `${loginId}@freezer.local`,
            name: session.user.user_metadata?.name || loginId,
            role: session.user.user_metadata?.role || 'member'
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabaseConfig]);

  // Login with Automatic Role Determination
  const login = async (identifier: string, password?: string): Promise<boolean> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) return false;

    // Search in existing family accounts or mock users by login_id or email
    const allKnown = [...familyAccounts, ...MOCK_USERS];
    const foundUser = allKnown.find(
      (u) => u.login_id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    // Auto-determined Role: Use user's registered role, default to 'member' if new
    const autoRole: UserRole = foundUser ? foundUser.role : (cleanId.includes('admin') ? 'admin' : 'member');
    const dummyEmail = cleanId.includes('@') ? cleanId : `${cleanId}@freezer.local`;
    const displayName = foundUser ? foundUser.name : cleanId;

    const client = getSupabaseClient();
    if (client && supabaseConfig.isConfigured && password) {
      const { data, error } = await client.auth.signInWithPassword({
        email: dummyEmail,
        password: password
      });
      if (error) {
        console.warn('Supabase password auth info:', error.message);
      } else if (data?.user) {
        const loggedUser: UserProfile = {
          id: data.user.id,
          login_id: cleanId,
          email: dummyEmail,
          name: data.user.user_metadata?.name || displayName,
          role: data.user.user_metadata?.role || autoRole
        };
        setUser(loggedUser);
        saveLocalUser(loggedUser);
        return true;
      }
    }

    // Local / Fallback Login
    const loggedUser: UserProfile = {
      id: foundUser?.id || `usr-${Date.now()}`,
      login_id: foundUser?.login_id || cleanId,
      email: foundUser?.email || dummyEmail,
      name: displayName,
      role: autoRole,
      password: password || foundUser?.password || '123456'
    };

    setUser(loggedUser);
    saveLocalUser(loggedUser);
    return true;
  };

  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    saveLocalUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    const updated = { ...user, role };
    setUser(updated);
    saveLocalUser(updated);
  };

  // Self-service update of Display Name & Password
  const updateProfile = async (
    newName: string,
    newPassword?: string
  ): Promise<boolean> => {
    if (!user) return false;
    const cleanName = newName.trim();
    if (!cleanName) return false;

    const client = getSupabaseClient();
    if (client && supabaseConfig.isConfigured) {
      if (newPassword && newPassword.trim()) {
        const { error: passErr } = await client.auth.updateUser({ password: newPassword.trim() });
        if (passErr) console.warn('Supabase password update warning:', passErr.message);
      }
      await client.from('profiles').update({
        name: cleanName,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
    }

    const updatedUser: UserProfile = {
      ...user,
      name: cleanName,
      password: newPassword || user.password
    };

    setUser(updatedUser);
    saveLocalUser(updatedUser);
    return true;
  };

  const updateSupabaseConfig = (url: string, anonKey: string) => {
    saveSupabaseConfig(url, anonKey);
    setSupabaseConfigState(getStoredSupabaseConfig());
  };

  const toggleSupabaseMode = (active: boolean) => {
    setForceOffline(!active);
    setSupabaseConfigState(getStoredSupabaseConfig());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        familyAccounts,
        supabaseConfig,
        login,
        logout,
        switchRole,
        updateProfile,
        updateSupabaseConfig,
        toggleSupabaseMode,
        isSupabaseActive: supabaseConfig.isConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
