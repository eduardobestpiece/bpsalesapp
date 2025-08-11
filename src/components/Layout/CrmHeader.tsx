
import { Button } from '@/components/ui/button';
import { CrmUserMenu } from './CrmUserMenu';
import { Calculator, Users, BarChart3, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const CrmHeader = () => {
  const location = useLocation();
  const { userRole, companyId } = useCrmAuth();
  const [pagePermissions, setPagePermissions] = useState<any>({});

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from('role_page_permissions')
      .select('*')
      .eq('company_id', companyId)
      .eq('role', userRole as 'master' | 'admin' | 'leader' | 'user')
      .then(({ data }) => {
        const perms: any = {};
        data?.forEach((row: any) => {
          perms[row.page] = row.allowed;
        });
        setPagePermissions(perms);
      });
  }, [companyId, userRole]);

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/crm" className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Monteo CRM</h1>
              <span className="text-sm text-muted-foreground font-medium">Sistema de Gestão</span>
            </div>
          </Link>
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {pagePermissions['comercial'] !== false && (
              <Link to="/crm">
                <Button 
                  variant={isActivePath('/crm') ? 'default' : 'ghost'} 
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Comercial</span>
                </Button>
              </Link>
            )}
            {pagePermissions['indicadores'] !== false && (
              <Link to="/crm/indicadores">
                <Button 
                  variant={isActivePath('/crm/indicadores') ? 'default' : 'ghost'} 
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Indicadores</span>
                </Button>
              </Link>
            )}
            {/* Adicione outros botões conforme granularidade desejada */}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeSwitch />
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">CRM</span>
          </div>
          <CrmUserMenu pagePermissions={pagePermissions} />
        </div>
      </div>
    </header>
  );
};
