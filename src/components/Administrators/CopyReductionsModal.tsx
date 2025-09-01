import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

interface CopyReductionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InstallmentReduction {
  id: string;
  name: string;
  company_id: string;
  administrator_id: string;
  reduction_percent: number;
}

interface Company {
  id: string;
  name: string;
}

export const CopyReductionsModal: React.FC<CopyReductionsModalProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  
  const [reductions, setReductions] = useState<InstallmentReduction[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedReductions, setSelectedReductions] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar reduções e empresas
  useEffect(() => {
    if (open) {
      fetchReductions();
      fetchCompanies();
    }
  }, [open]);

  const fetchReductions = async () => {
    try {
      const { data, error } = await supabase
        .from('installment_reductions')
        .select('id, name, company_id, administrator_id, reduction_percent')
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setReductions(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar reduções de parcela',
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
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas',
        variant: 'destructive'
      });
    }
  };

  const handleCopyReductions = async () => {
    if (selectedReductions.length === 0 || selectedCompanies.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos uma redução de parcela e uma empresa',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar reduções selecionadas
      const { data: reductionsToCopy, error } = await supabase
        .from('installment_reductions')
        .select('*')
        .in('id', selectedReductions);
      
      if (error) throw error;
      
      if (!reductionsToCopy || reductionsToCopy.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhuma redução de parcela encontrada',
          variant: 'destructive'
        });
        return;
      }

      // Preparar dados para inserção em cada empresa
      const insertPromises = selectedCompanies.map(async (companyId) => {
        const reductionsInsert = reductionsToCopy.map((reduction: any) => {
          const { id, created_at, updated_at, ...rest } = reduction;
          return { ...rest, company_id: companyId };
        });

        const { error: insertError } = await supabase
          .from('installment_reductions')
          .insert(reductionsInsert);
        
        if (insertError) throw insertError;
      });

      await Promise.all(insertPromises);

      toast({
        title: 'Sucesso',
        description: 'Reduções de parcela copiadas com sucesso!'
      });

      // Limpar seleções
      setSelectedReductions([]);
      setSelectedCompanies([]);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar reduções de parcela: ' + (err.message || ''),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReduction = (reductionId: string) => {
    setSelectedReductions(prev => 
      prev.includes(reductionId) 
        ? prev.filter(id => id !== reductionId)
        : [...prev, reductionId]
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
    setSelectedReductions([]);
    setSelectedCompanies([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copiar Redução de Parcela</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCopyReductions} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
          {/* Reduções de Parcela */}
          <div className="space-y-3">
            <Label>Redução de Parcela</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {reductions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma redução de parcela disponível</p>
              ) : (
                <div className="space-y-2">
                  {reductions.map((reduction) => (
                    <div
                      key={reduction.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedReductions.includes(reduction.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleReduction(reduction.id)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{reduction.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {reduction.reduction_percent}% de redução
                        </span>
                      </div>
                      {selectedReductions.includes(reduction.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedReductions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedReductions.map((reductionId) => {
                  const reduction = reductions.find(r => r.id === reductionId);
                  return (
                    <Badge key={reductionId} variant="outline" className="text-xs">
                      {reduction?.name}
                      <button
                        onClick={() => toggleReduction(reductionId)}
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
              type="submit"
              onClick={handleCopyReductions} 
              disabled={selectedReductions.length === 0 || selectedCompanies.length === 0 || loading}
            >
              {loading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 