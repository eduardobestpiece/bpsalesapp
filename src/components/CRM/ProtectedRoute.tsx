
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/crm';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: UserRole;
  requiredPageKey?: string; // novo: chave de página em role_page_permissions/app_pages (ex: 'simulator')
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredPageKey
}) => {
  const { user, crmUser, loading, hasPermission, userRole, companyId } = useCrmAuth();
  const [pageAllowed, setPageAllowed] = useState<boolean | null>(null);

  // Gate por página (opcional)
  useEffect(() => {
    let cancelled = false;
    async function checkPage() {
      if (!requiredPageKey) {
        setPageAllowed(true);
        return;
      }
      if (!companyId || !userRole) {
        // sem contexto suficiente, negar até resolver
        setPageAllowed(false);
        return;
      }
      // master sempre permitido
      if (userRole === 'master') {
        setPageAllowed(true);
        return;
      }
      const { data, error } = await supabase
        .from('role_page_permissions')
        .select('page, allowed')
        .eq('company_id', companyId)
        .eq('role', userRole)
        .eq('page', requiredPageKey)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        // Em caso de erro, ser permissivo para não travar aplicação
        setPageAllowed(true);
        return;
      }
      if (!data) {
        // Sem registro específico: fallback permissivo
        setPageAllowed(true);
        return;
      }
      setPageAllowed(data.allowed !== false);
    }
    checkPage();
    return () => { cancelled = true; };
  }, [requiredPageKey, companyId, userRole]);

  if (loading || pageAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !crmUser) {
    return <Navigate to="/crm/login" replace />;
  }

  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-secondary/60">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (requiredPageKey && !pageAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h2>
          <p className="text-secondary/60">
            Seu perfil não possui acesso a esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
