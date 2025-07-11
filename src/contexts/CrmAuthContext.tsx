
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  submaster: 4, // SubMaster tem o mesmo nível de visualização do master, mas sem permissão de edição
  master: 4,
};

export const CrmAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [crmUser, setCrmUser] = useState<CrmUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCrmUser = async (email: string) => {
    console.log('[CrmAuth] Buscando CRM user para:', email);
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Timeout ao buscar CRM user')), 8000);
      });
      const queryPromise = supabase
        .from('crm_users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      if (timeoutId) clearTimeout(timeoutId);
      if (error) {
        console.error('[CrmAuth] Erro ao buscar CRM user:', error);
        return null;
      }
      console.log('[CrmAuth] CRM user encontrado:', data);
      return data as CrmUser;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error('[CrmAuth] Erro inesperado ao buscar CRM user:', err);
      return null;
    }
  };

  useEffect(() => {
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[CrmAuth] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(true);
        
        // Use setTimeout to prevent blocking the auth callback
        setTimeout(async () => {
          try {
            if (session?.user?.email) {
              const crmUserData = await fetchCrmUser(session.user.email!);
              setCrmUser(crmUserData);
              setUserRole(crmUserData?.role ?? null);
              setCompanyId(crmUserData?.company_id ?? null);
            } else {
              setCrmUser(null);
              setUserRole(null);
              setCompanyId(null);
            }
          } catch (err) {
            console.error('[CrmAuth] Erro inesperado no listener:', err);
          } finally {
            setLoading(false);
          }
        }, 0);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[CrmAuth] Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(true);
      try {
        if (session?.user?.email) {
          const crmUserData = await fetchCrmUser(session.user.email);
          setCrmUser(crmUserData);
          setUserRole(crmUserData?.role ?? null);
          setCompanyId(crmUserData?.company_id ?? null);
        } else {
          setCrmUser(null);
          setUserRole(null);
          setCompanyId(null);
        }
      } catch (err) {
        console.error('[CrmAuth] Erro inesperado no check inicial:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    
    const redirectUrl = `${window.location.origin}/crm`;
    
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
