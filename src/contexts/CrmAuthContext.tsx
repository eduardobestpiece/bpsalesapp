
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

  const fetchCrmUser = useCallback(async (email: string) => {
    console.log('[CrmAuth] Buscando CRM user para:', email);
    try {
      // Timeout de 15 segundos para evitar travamento
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
        console.error('[CrmAuth] Timeout de 15s ao buscar usuário CRM');
        reject(new Error('Timeout ao buscar usuário CRM'));
      }, 15000));
      const fetchPromise = supabase
        .from('crm_users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      if (error) {
        console.error('[CrmAuth] Erro ao buscar CRM user:', error);
        return null;
      }
      if (!data) {
        console.warn('[CrmAuth] Nenhum usuário CRM encontrado para:', email);
        return null;
      }
      console.log('[CrmAuth] CRM user encontrado:', data);
      return data as CrmUser;
    } catch (err) {
      console.error('[CrmAuth] Erro inesperado ao buscar CRM user:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let alreadyFetched = false;
    
    console.log('[CrmAuth] Initializing auth...');
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[CrmAuth] Auth state changed:', event, newSession?.user?.email);
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Só buscar usuário CRM na primeira vez
        if (!alreadyFetched && newSession?.user?.email) {
          alreadyFetched = true;
          console.log(`[CrmAuth] Buscando CRM user para: ${newSession.user.email} (evento: ${event})`);
          const crmUserData = await fetchCrmUser(newSession.user.email);
          if (mounted) {
            setCrmUser(crmUserData);
            setUserRole(crmUserData?.role ?? null);
            setCompanyId(crmUserData?.company_id ?? null);
          }
        } else if (!newSession?.user?.email) {
          if (mounted) {
            setCrmUser(null);
            setUserRole(null);
            setCompanyId(null);
          }
        }
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted && initialSession && !alreadyFetched) {
        alreadyFetched = true;
        console.log('[CrmAuth] Initial session found:', initialSession.user.email);
        // A busca será feita pelo onAuthStateChange
      } else if (mounted) {
        console.log('[CrmAuth] No initial session');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchCrmUser]);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
    }

    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('Attempting sign up for:', email);
    
    const redirectUrl = `${window.location.origin}/home`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: userData,
      },
    });

    if (error) {
      console.error('Sign up error:', error);
    }

    return { error };
  };

  const signOut = async () => {
    console.log('Signing out');
    await supabase.auth.signOut();
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
