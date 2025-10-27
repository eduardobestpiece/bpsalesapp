import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { useDefaultBranding } from '@/hooks/useDefaultBranding';

interface Company {
  id: string;
  name: string;
  role: string;
}

const CompanySelector = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [isSelecting, setIsSelecting] = useState(false);
  
  const { user } = useCrmAuth();
  const navigate = useNavigate();
  const { branding: defaultBranding } = useDefaultBranding();

  useEffect(() => {
    const fetchUserCompanies = async () => {
      if (!user?.email) return;

      try {
        const { data: userCompanies, error } = await supabase
          .from('crm_users')
          .select(`
            company_id,
            role,
            companies!inner (
              id,
              name
            )
          `)
          .eq('email', user.email)
          .eq('status', 'active');

        if (error) {
          console.error('Erro ao buscar empresas do usuário:', error);
          toast.error('Erro ao carregar empresas');
          return;
        }

        const companiesData = userCompanies?.map((uc: any) => ({
          id: uc.company_id,
          name: uc.companies.name,
          role: uc.role
        })) || [];

        setCompanies(companiesData);
        
        // Se só tem uma empresa, selecionar automaticamente
        if (companiesData.length === 1) {
          handleCompanySelect(companiesData[0].id);
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        toast.error('Erro ao carregar empresas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCompanies();
  }, [user]);

  const handleCompanySelect = async (companyId: string) => {
    setIsSelecting(true);
    
    try {
      // Salvar empresa selecionada no localStorage
      localStorage.setItem('selectedCompanyId', companyId);
      
      // Redirecionar para home
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Erro ao selecionar empresa:', error);
      toast.error('Erro ao selecionar empresa');
    } finally {
      setIsSelecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
            <p className="text-muted-foreground text-center">
              Carregando suas empresas...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#131313] via-[#1E1E1E] to-[#161616] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-bold">Selecione uma Empresa</CardTitle>
          <CardDescription>
            Você tem acesso a múltiplas empresas. Escolha uma para continuar.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {companies.map((company) => (
            <Button
              key={company.id}
              variant="outline"
              className="w-full h-16 flex items-center justify-between p-4 hover:bg-primary/10"
              onClick={() => handleCompanySelect(company.id)}
              disabled={isSelecting}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5" style={{ color: defaultBranding?.primary_color || '#E50F5E' }} />
                <div className="text-left">
                  <div className="font-medium">{company.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {company.role === 'master' ? 'Master' : 
                     company.role === 'admin' ? 'Administrador' : 
                     company.role === 'leader' ? 'Líder' : 'Colaborador'}
                  </div>
                </div>
              </div>
              {isSelecting && selectedCompanyId === company.id && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySelector;
