import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

interface CopyAdministratorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Administrator {
  id: string;
  name: string;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
}

export const CopyAdministratorsModal: React.FC<CopyAdministratorsModalProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedAdministrators, setSelectedAdministrators] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar administradoras e empresas
  useEffect(() => {
    if (open) {
      fetchAdministrators();
      fetchCompanies();
    }
  }, [open]);

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name, company_id')
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      console.error('Erro ao buscar administradoras:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar administradoras',
        variant: 'destructive'
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas',
        variant: 'destructive'
      });
    }
  };

  const handleCopyAdministrators = async () => {
    if (selectedAdministrators.length === 0 || selectedCompanies.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos uma administradora e uma empresa',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar administradoras selecionadas
      const { data: adminsToCopy, error } = await supabase
        .from('administrators')
        .select('*')
        .in('id', selectedAdministrators);
      
      if (error) throw error;
      
      if (!adminsToCopy || adminsToCopy.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhuma administradora encontrada',
          variant: 'destructive'
        });
        return;
      }

      // Preparar dados para inserção em cada empresa
      const insertPromises = selectedCompanies.map(async (companyId) => {
        const adminsInsert = adminsToCopy.map((admin: any) => {
          const { id, created_at, updated_at, ...rest } = admin;
          return { ...rest, company_id: companyId };
        });

        const { error: insertError } = await supabase
          .from('administrators')
          .insert(adminsInsert);
        
        if (insertError) throw insertError;
      });

      await Promise.all(insertPromises);

      toast({
        title: 'Sucesso',
        description: 'Administradoras copiadas com sucesso!'
      });

      // Limpar seleções
      setSelectedAdministrators([]);
      setSelectedCompanies([]);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao copiar administradoras:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao copiar administradoras: ' + (err.message || ''),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdministrator = (adminId: string) => {
    setSelectedAdministrators(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleClose = () => {
    setSelectedAdministrators([]);
    setSelectedCompanies([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copiar administradoras</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Administradoras */}
          <div className="space-y-3">
            <Label>Administradora</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {administrators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma administradora disponível</p>
              ) : (
                <div className="space-y-2">
                  {administrators.map((admin) => (
                    <div
                      key={admin.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedAdministrators.includes(admin.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleAdministrator(admin.id)}
                    >
                      <span className="text-sm">{admin.name}</span>
                      {selectedAdministrators.includes(admin.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedAdministrators.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedAdministrators.map((adminId) => {
                  const admin = administrators.find(a => a.id === adminId);
                  return (
                    <Badge key={adminId} variant="outline" className="text-xs">
                      {admin?.name}
                      <button
                        onClick={() => toggleAdministrator(adminId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Empresas */}
          <div className="space-y-3">
            <Label>Fazer uma cópia para</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma empresa disponível</p>
              ) : (
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedCompanies.includes(company.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleCompany(company.id)}
                    >
                      <span className="text-sm">{company.name}</span>
                      {selectedCompanies.includes(company.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedCompanies.map((companyId) => {
                  const company = companies.find(c => c.id === companyId);
                  return (
                    <Badge key={companyId} variant="outline" className="text-xs">
                      {company?.name}
                      <button
                        onClick={() => toggleCompany(companyId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCopyAdministrators} 
              disabled={selectedAdministrators.length === 0 || selectedCompanies.length === 0 || loading}
            >
              {loading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 