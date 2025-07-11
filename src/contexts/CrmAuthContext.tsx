
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
  const [initialized, setInitialized] = useState(false);

  const fetchCrmUser = useCallback(async (email: string) => {
    console.log('[CrmAuth] Buscando CRM user para:', email);
    try {
      const { data, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();
      
      if (error) {
        console.error('[CrmAuth] Erro ao buscar CRM user:', error);
        return null;
      }
      console.log('[CrmAuth] CRM user encontrado:', data);
      return data as CrmUser;
    } catch (err) {
      console.error('[CrmAuth] Erro inesperado ao buscar CRM user:', err);
      return null;
    }
  }, []);

  const updateAuthState = useCallback(async (newSession: Session | null) => {
    console.log('[CrmAuth] Updating auth state, session:', !!newSession);
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    
    if (newSession?.user?.email) {
      const crmUserData = await fetchCrmUser(newSession.user.email);
      setCrmUser(crmUserData);
      setUserRole(crmUserData?.role ?? null);
      setCompanyId(crmUserData?.company_id ?? null);
    } else {
      setCrmUser(null);
      setUserRole(null);
      setCompanyId(null);
    }
    
    if (initialized) {
      setLoading(false);
    }
  }, [fetchCrmUser, initialized]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('[CrmAuth] Initializing auth...');
        
        // Setup auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[CrmAuth] Auth state changed:', event, session?.user?.email);
            
            if (!isMounted) return;
            
            // Avoid infinite loops by checking if session actually changed
            if (event === 'SIGNED_IN' && session) {
              await updateAuthState(session);
            } else if (event === 'SIGNED_OUT') {
              await updateAuthState(null);
            }
          }
        );

        // Then get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          await updateAuthState(initialSession);
          setInitialized(true);
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[CrmAuth] Error during initialization:', error);
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup.then(cleanupFn => cleanupFn?.());
      }
    };
  }, [updateAuthState]);

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
