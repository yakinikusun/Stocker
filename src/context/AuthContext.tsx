import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SupabaseConfig } from '../types/stock';
import { getStoredSupabaseConfig, saveSupabaseConfig, getSupabaseClient, loadLocalUser, saveLocalUser } from '../lib/supabase';
import { MOCK_USERS } from '../lib/mockData';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  supabaseConfig: SupabaseConfig;
  login: (email: string, role?: 'admin' | 'member') => Promise<void>;
  logout: () => void;
  switchRole: (role: 'admin' | 'member') => void;
  updateSupabaseConfig: (url: string, anonKey: string) => void;
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => loadLocalUser());
  const [supabaseConfig, setSupabaseConfigState] = useState<SupabaseConfig>(() => getStoredSupabaseConfig());

  useEffect(() => {
    const client = getSupabaseClient();
    if (client) {
      // Check existing Supabase session
      client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@example.com',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'ユーザー',
            role: session.user.user_metadata?.role || 'member',
            avatar_url: session.user.user_metadata?.avatar_url
          });
        }
      });

      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@example.com',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'ユーザー',
            role: session.user.user_metadata?.role || 'member',
            avatar_url: session.user.user_metadata?.avatar_url
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [supabaseConfig]);

  const login = async (email: string, role: 'admin' | 'member' = 'member') => {
    const client = getSupabaseClient();
    if (client) {
      // Supabase magic link / password sign in could be used, or demo sign in
      const { error } = await client.auth.signInWithOtp({ email });
      if (error) console.error('Supabase auth error:', error);
    }
    
    // Fallback or demo user login
    const foundMock = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    const newUser: UserProfile = foundMock ? { ...foundMock, role } : {
      id: `usr-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role
    };

    setUser(newUser);
    saveLocalUser(newUser);
  };

  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('freezer_local_user');
  };

  const switchRole = (role: 'admin' | 'member') => {
    if (!user) return;
    const updated = { ...user, role };
    setUser(updated);
    saveLocalUser(updated);
  };

  const updateSupabaseConfig = (url: string, anonKey: string) => {
    saveSupabaseConfig(url, anonKey);
    setSupabaseConfigState(getStoredSupabaseConfig());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        supabaseConfig,
        login,
        logout,
        switchRole,
        updateSupabaseConfig,
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
