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

  const fetchAndSetUserProfile = async (authUser: any): Promise<UserProfile> => {
    const email = authUser.email || '';
    const loginId = authUser.user_metadata?.login_id || email.split('@')[0] || 'user';
    const client = getSupabaseClient();

    let name = authUser.user_metadata?.name || loginId;
    let role: UserRole = authUser.user_metadata?.role || (loginId.includes('admin') ? 'admin' : 'member');

    if (client && supabaseConfig.isConfigured) {
      try {
        const { data: profile, error } = await client
          .from('profiles')
          .select('name, role')
          .eq('id', authUser.id)
          .single();

        if (profile && !error) {
          if (profile.role) role = profile.role as UserRole;
          if (profile.name) name = profile.name;
        }
      } catch (err) {
        console.warn('Failed to fetch user profile from profiles table:', err);
      }
    }

    const updatedUser: UserProfile = {
      id: authUser.id,
      login_id: loginId,
      email: email || `${loginId}@stocker.local`,
      name: name,
      role: role
    };

    setUser(updatedUser);
    saveLocalUser(updatedUser);
    return updatedUser;
  };

  useEffect(() => {
    const client = getSupabaseClient();
    if (client && supabaseConfig.isConfigured) {
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchAndSetUserProfile(session.user);
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchAndSetUserProfile(session.user);
        } else if (_event === 'SIGNED_OUT') {
          setUser(null);
          saveLocalUser(null);
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

    const dummyEmail = cleanId.includes('@') ? cleanId : `${cleanId}@stocker.local`;

    const client = getSupabaseClient();
    if (client && supabaseConfig.isConfigured) {
      if (!password) {
        console.warn('Password required for Supabase authentication');
        return false;
      }

      const { data, error } = await client.auth.signInWithPassword({
        email: dummyEmail,
        password: password
      });

      if (error || !data?.user) {
        console.warn('Supabase password auth failed:', error?.message);
        return false;
      }

      await fetchAndSetUserProfile(data.user);
      return true;
    }

    // Local / Offline Demo Mode
    const allKnown = [...familyAccounts, ...MOCK_USERS];
    const foundUser = allKnown.find(
      (u) => u.login_id.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId
    );

    if (!foundUser) {
      console.warn('User not found in local mock accounts');
      return false;
    }

    // Verify Password
    const expectedPassword = foundUser.password || '123456';
    if (!password || password !== expectedPassword) {
      console.warn('Invalid password for local mock user');
      return false;
    }

    const loggedUser: UserProfile = {
      id: foundUser.id,
      login_id: foundUser.login_id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
      password: expectedPassword
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
