import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useSetupGuard = () => {
  const location = useLocation();
  const [isSetupIncomplete, setIsSetupIncomplete] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Verificar se há setup em progresso no localStorage
        const setupInProgress = localStorage.getItem('userSetupInProgress');
        if (setupInProgress === 'true') {
          setIsSetupIncomplete(true);
          setIsChecking(false);
          return;
        }

        // Só verificar se estiver na página de setup
        if (location.pathname !== '/user-setup') {
          setIsChecking(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsChecking(false);
          return;
        }

        // Verificar se o usuário tem dados completos
        const { data: crmUser } = await supabase
          .from('crm_users')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        // Se não tem dados completos, marcar como setup incompleto
        if (!crmUser?.first_name || !crmUser?.last_name) {
          setIsSetupIncomplete(true);
        }

      } catch (error) {
        console.error('Erro ao verificar status do setup:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetupStatus();

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userSetupInProgress') {
        if (e.newValue === 'true') {
          setIsSetupIncomplete(true);
        } else if (e.newValue === null) {
          setIsSetupIncomplete(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]);

  return { isSetupIncomplete, isChecking };
};
