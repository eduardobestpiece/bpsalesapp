
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { CrmUser, UserRole } from '@/types/crm';

interface CrmAuthContextType {
  session: Session | null;
  user: User | null;
  crmUser: CrmUser | null;
  userRole: UserRole | null;
  companyId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const CrmAuthContext = createContext<CrmAuthContextType | undefined>(undefined);

const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  leader: 2,
  admin: 3,
  submaster: 4,
  master: 5,
};

export const CrmAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [crmUser, setCrmUser] = useState<CrmUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveCrmUserCache = (email: string, data: any) => {
    if (!email || !data) return;
    localStorage.setItem('crmUserCache', JSON.stringify({ email, data, ts: Date.now() }));
  };

  const getCrmUserCache = (email: string) => {
    try {
      const raw = localStorage.getItem('crmUserCache');
      if (!raw) return null;
      const cache = JSON.parse(raw);
      if (cache.email === email && Date.now() - cache.ts < 24 * 60 * 60 * 1000) {
        return cache.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  const clearCrmUserCache = () => {
    localStorage.removeItem('crmUserCache');
  };

  const ensureCrmUser = useCallback(async (authUser: User): Promise<CrmUser | null> => {
    // Tenta buscar o usuário pelo auth.uid()
    const { data: existing } = await supabase
      .from('crm_users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existing) {
      return existing as any;
    }

    // Pegar uma empresa ativa
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('status', 'active')
      .limit(1);

    const fallbackCompanyId = companies && companies.length > 0 ? companies[0].id : null;

    // Criar crm_user mínimo vinculado ao auth.uid()
    const firstName = authUser.email?.split('@')[0] || 'Usuário';
    const payload = {
      id: authUser.id,
      email: authUser.email,
      first_name: firstName,
      last_name: '',
      role: 'admin' as UserRole,
      company_id: fallbackCompanyId,
      status: 'active',
    } as any;

    const { data: inserted, error } = await supabase
      .from('crm_users')
      .insert(payload)
      .select('*')
      .maybeSingle();

    if (error) {
      return null;
    }

    return inserted as any;
  }, []);

  const fetchCrmUser = useCallback(async (authUser: User) => {
    try {
      // Primeiro tenta cache por email
      if (authUser.email) {
        const cached = getCrmUserCache(authUser.email);
        if (cached) {
          return cached;
        }
      }

      const ensured = await ensureCrmUser(authUser);
      if (ensured && authUser.email) {
        saveCrmUserCache(authUser.email, ensured);
      }
      return ensured;
    } catch {
      return null;
    }
  }, [ensureCrmUser]);

  useEffect(() => {
    let mounted = true;

    const applySession = async (sess: Session | null) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);

      if (sess?.user) {
        const authUser = sess.user;
        const crm = await fetchCrmUser(authUser);
        if (!mounted) return;
        setCrmUser(crm);
        setUserRole((crm?.role as UserRole) ?? null);
        setCompanyId(crm?.company_id ?? null);
        setLoading(false);
      } else {
        setCrmUser(null);
        setUserRole(null);
        setCompanyId(null);
        clearCrmUserCache();
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await applySession(newSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchCrmUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const redirectUrl = `${window.location.origin}/home`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: userData },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearCrmUserCache();
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!userRole) return false;
    const currentRoleLevel = roleHierarchy[userRole];
    const requiredRoleLevel = roleHierarchy[requiredRole];
    return currentRoleLevel >= requiredRoleLevel;
  };

  const value = {
    session,
    user,
    crmUser,
    userRole,
    companyId,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
  };

  return (
    <CrmAuthContext.Provider value={value}>
      {children}
    </CrmAuthContext.Provider>
  );
};

export const useCrmAuth = () => {
  const context = useContext(CrmAuthContext);
  if (context === undefined) {
    throw new Error('useCrmAuth must be used within a CrmAuthProvider');
  }
  return context;
};
