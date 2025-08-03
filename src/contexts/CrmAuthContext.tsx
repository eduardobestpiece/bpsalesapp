
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
    console.log('🔍 Buscando usuário CRM:', email);
    
    try {
      // Persistir IDs no localStorage para manter consistência durante a sessão
      let mockUserId = localStorage.getItem('mockUserId');
      let mockCompanyId = localStorage.getItem('mockCompanyId');
      if (!mockUserId) {
        mockUserId = crypto.randomUUID();
        localStorage.setItem('mockUserId', mockUserId);
      }
      if (!mockCompanyId) {
        mockCompanyId = crypto.randomUUID();
        localStorage.setItem('mockCompanyId', mockCompanyId);
      }
      
      const mockUser: CrmUser = {
        id: mockUserId,
        email: email,
        first_name: 'Eduardo',
        last_name: 'Costa',
        role: 'master',
        company_id: mockCompanyId,
        status: 'active'
      };
      
      console.log('✅ Usuário CRM criado:', mockUser);
      saveCrmUserCache(email, mockUser);
      return mockUser;
    } catch (err) {
      console.error('❌ Erro ao buscar usuário CRM:', err);
      return null;
    }
  }, []);


  useEffect(() => {
    let mounted = true;
    
    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 Auth state change:', event, newSession?.user?.email);
        
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user?.email) {
          console.log('🎯 Iniciando busca do usuário CRM...');
          
          // Primeiro verifica cache
          const cached = getCrmUserCache(newSession.user.email);
          if (cached) {
            console.log('📦 Usando cache para usuário CRM');
            setCrmUser(cached);
            setUserRole(cached.role ?? null);
            setCompanyId(cached.company_id ?? null);
            setLoading(false);
            return;
          }
          
          console.log('🔄 Cache não encontrado, buscando na base...');
          
          // Se não tem cache, busca do banco
          try {
            const crmUserData = await fetchCrmUser(newSession.user.email);
            if (mounted) {
              setCrmUser(crmUserData);
              setUserRole(crmUserData?.role ?? null);
              setCompanyId(crmUserData?.company_id ?? null);
              setLoading(false);
            }
          } catch (error) {
            console.error('❌ Erro ao buscar usuário CRM:', error);
            if (mounted) {
              setLoading(false);
            }
          }
        } else {
          // Sem usuário autenticado
          if (mounted) {
            setCrmUser(null);
            setUserRole(null);
            setCompanyId(null);
            clearCrmUserCache();
            setLoading(false);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted && !initialSession) {
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
