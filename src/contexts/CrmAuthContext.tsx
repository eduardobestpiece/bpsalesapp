
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
  refreshCrmUser: () => Promise<void>;
  updateCrmUserInContext: (partial: Partial<CrmUser>) => void;
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
    const payload = { email, data, ts: Date.now() };
    localStorage.setItem('crmUserCache', JSON.stringify(payload));
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

  const clearSupabaseAuthTokens = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  };

  const ensureCrmUser = useCallback(async (authUser: User): Promise<CrmUser | null> => {
    // Verificar se há setup em progresso - se sim, retornar null para evitar redirecionamento
    const setupInProgress = localStorage.getItem('userSetupInProgress');
    if (setupInProgress === 'true') {
      return null;
    }

    // 1) Tenta buscar por email (fonte de verdade) pegando o registro mais recente
    if (authUser.email) {
      const { data: byEmail, error: byEmailError } = await supabase
        .from('crm_users')
        .select('*')
        .eq('email', authUser.email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byEmail && !byEmailError) {
        // Verificar se o usuário está ativo
        if (byEmail.status === 'archived') {
          // Se usuário está inativo, fazer logout e retornar null
          await supabase.auth.signOut();
          return null;
        }
        return byEmail as any;
      }
    }

    // 2) Se não houver por email, busca por id (caso bases antigas usem id = auth uid)
    const { data: byId } = await supabase
      .from('crm_users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    if (byId) {
      // Verificar se o usuário está ativo
      if (byId.status === 'archived') {
        // Se usuário está inativo, fazer logout e retornar null
        await supabase.auth.signOut();
        return null;
      }
      return byId as any;
    }

    // 3) Criar registro mínimo vinculado a uma empresa ativa
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('status', 'active')
      .limit(1);

    const fallbackCompanyId = companies && companies.length > 0 ? companies[0].id : null;

    const firstName = authUser.email?.split('@')[0] || 'Usuário';
    const payload = {
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
      // Verificar se há setup em progresso - se sim, não buscar dados do CRM
      const setupInProgress = localStorage.getItem('userSetupInProgress');
      if (setupInProgress === 'true') {
        return null;
      }

      if (authUser.email) {
        const cached = getCrmUserCache(authUser.email);
        if (cached) {
          // Verificar se o usuário cached está ativo
          if (cached.status === 'archived') {
            // Se usuário está inativo, fazer logout e retornar null
            await supabase.auth.signOut();
            return null;
          }
          return cached;
        }
      }

      const ensured = await ensureCrmUser(authUser);
      
      // Verificar se o usuário está ativo
      if (ensured && ensured.status === 'archived') {
        // Se usuário está inativo, fazer logout e retornar null
        await supabase.auth.signOut();
        return null;
      }
      
      if (ensured && authUser.email) {
        saveCrmUserCache(authUser.email, ensured);
      }
      return ensured;
    } catch (e) {
      return null;
    }
  }, [ensureCrmUser]);

  const refreshCrmUser = useCallback(async () => {
    if (!user) return;
    
    // Verificar se há setup em progresso - se sim, não atualizar dados do CRM
    const setupInProgress = localStorage.getItem('userSetupInProgress');
    if (setupInProgress === 'true') {
      return;
    }
    
    try {
      let fresh: any = null;
      // Preferir id exato do crmUser quando existir
      if (crmUser?.id) {
        const { data, error } = await supabase
          .from('crm_users')
          .select('*')
          .eq('id', crmUser.id)
          .maybeSingle();
        if (!error && data) {
          fresh = data;
        }
      }
      // Fallback: garantir via email (registro mais recente)
      if (!fresh) {
        fresh = await ensureCrmUser(user);
      }
      
      // Verificar se o usuário está ativo
      if (fresh && fresh.status === 'archived') {
        // Se usuário está inativo, fazer logout
        await supabase.auth.signOut();
        return;
      }
      
      setCrmUser(fresh);
      setUserRole((fresh?.role as UserRole) ?? null);
      setCompanyId(fresh?.company_id ?? null);
      if (user.email && fresh) saveCrmUserCache(user.email, fresh);
    } catch (e) {
    }
  }, [crmUser?.id, ensureCrmUser, user]);

  const updateCrmUserInContext = useCallback((partial: Partial<CrmUser>) => {
    setCrmUser(prev => {
      const next = { ...(prev || {} as any), ...partial } as CrmUser;
      if (user?.email) saveCrmUserCache(user.email, next);
      return next;
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const applySession = async (sess: Session | null) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);

      if (sess?.user) {
        const authUser = sess.user;
        fetchCrmUser(authUser).then((crm) => {
          if (!mounted) return;
          setCrmUser(crm);
          setUserRole((crm?.role as UserRole) ?? null);
          setCompanyId(crm?.company_id ?? null);
          // Força uma atualização do DB para evitar uso de cache
          refreshCrmUser();
        }).catch(() => {
          // ignore
        });
      } else {
        setCrmUser(null);
        setUserRole(null);
        setCompanyId(null);
        clearCrmUserCache();
        clearSupabaseAuthTokens();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        await applySession(newSession);
        // Em eventos de atualização de usuário, forçar refresh do crmUser para evitar cache antigo
        if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          await refreshCrmUser();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
      if (!initialSession) {
        clearSupabaseAuthTokens();
      }
    });

    const watchdog = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, [fetchCrmUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Se não houve erro no login, verificar se o usuário está arquivado
    if (!error) {
      try {
        const { data: crmUser, error: crmError } = await supabase
          .from('crm_users')
          .select('*')
          .eq('email', email)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!crmError && crmUser && crmUser.status === 'archived') {
          // Fazer logout do usuário arquivado
          await supabase.auth.signOut();
          // Retornar erro personalizado
          return { 
            error: { 
              message: 'Conta suspensa, entre em contato com seu gestor' 
            } 
          };
        }
      } catch (e) {
        // Ignorar erros na verificação
      }
    }
    
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
    clearSupabaseAuthTokens();
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
    refreshCrmUser,
    updateCrmUserInContext,
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
