
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

  // Função para salvar no cache local
  const saveCrmUserCache = (email: string, data: any) => {
    if (!email || !data) return;
    localStorage.setItem('crmUserCache', JSON.stringify({ email, data, ts: Date.now() }));
  };

  // Função para ler do cache local
  const getCrmUserCache = (email: string) => {
    try {
      const raw = localStorage.getItem('crmUserCache');
      if (!raw) return null;
      const cache = JSON.parse(raw);
      // Cache válido por 24h e para o mesmo email
      if (cache.email === email && Date.now() - cache.ts < 24 * 60 * 60 * 1000) {
        return cache.data;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Função para limpar o cache
  const clearCrmUserCache = () => {
    localStorage.removeItem('crmUserCache');
  };

  const fetchCrmUser = useCallback(async (email: string) => {
    try {
      // Timeout de 30 segundos para evitar travamento
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => {
        reject(new Error('Timeout ao buscar usuário CRM'));
      }, 30000));
      
      const fetchPromise = supabase
        .from('crm_users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .single();
        
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // --- NOVO: checar se é líder de algum time ativo ---
      let dynamicRole = data.role;
      if (dynamicRole !== 'admin' && dynamicRole !== 'master' && dynamicRole !== 'submaster') {
        // Buscar times ativos onde o usuário é líder
        const { data: teams, error: teamError } = await supabase
          .from('teams')
          .select('id')
          .eq('leader_id', data.id)
          .eq('status', 'active');
        if (!teamError && teams && teams.length > 0) {
          dynamicRole = 'leader';
        }
      }
      // ---
      saveCrmUserCache(email, { ...data, role: dynamicRole }); // Salva no cache
      return { ...data, role: dynamicRole } as CrmUser;
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let alreadyFetched = false;
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // Só buscar usuário CRM na primeira vez
        if (!alreadyFetched && newSession?.user?.email) {
          alreadyFetched = true;
          // 1. Tenta carregar do cache local
          const cached = getCrmUserCache(newSession.user.email);
          if (cached) {
            setCrmUser(cached);
            setUserRole(cached.role ?? null);
            setCompanyId(cached.company_id ?? null);
            setLoading(false);
            // 2. Atualiza em background
            fetchCrmUser(newSession.user.email).then((crmUserData) => {
              if (crmUserData && mounted) {
                setCrmUser(crmUserData);
                setUserRole(crmUserData.role ?? null);
                setCompanyId(crmUserData.company_id ?? null);
              }
            });
            return;
          }
          // Se não houver cache, busca normalmente
          const crmUserData = await fetchCrmUser(newSession.user.email);
          if (mounted) {
            setCrmUser(crmUserData);
            setUserRole(crmUserData?.role ?? null);
            setCompanyId(crmUserData?.company_id ?? null);
            setLoading(false);
          }
        } else if (!newSession?.user?.email) {
          if (mounted) {
            setCrmUser(null);
            setUserRole(null);
            setCompanyId(null);
            clearCrmUserCache(); // Limpa cache no logout
          }
        }
        if (mounted && !loading) {
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted && initialSession && !alreadyFetched) {
        alreadyFetched = true;
        // A busca será feita pelo onAuthStateChange
      } else if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchCrmUser]);

  const signIn = async (email: string, password: string) => {
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    
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
      return { error };
    }

    return { error };
  };

  const signOut = async () => {
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
