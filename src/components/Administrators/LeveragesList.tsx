
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Archive, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeveragesListProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'archived';
  onEdit: (leverage: any) => void;
}

export const LeveragesList = ({ searchTerm, statusFilter, onEdit }: LeveragesListProps) => {
  const { toast } = useToast();
  const [leverages, setLeverages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';
  const isMaster = userRole === 'master';
  const canCopy = isMaster || isSubMaster;
  const { selectedCompanyId } = useCompany();

  // Modal de cópia
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [originCompanyId, setOriginCompanyId] = useState<string>('');
  const [copyLoading, setCopyLoading] = useState(false);

  // Buscar empresas para seleção
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: canCopy,
  });

  // Função de cópia de alavancas
  const handleCopyLeverages = async () => {
    if (!originCompanyId || !selectedCompanyId) {
      toast.error('Selecione a empresa de origem e destino.');
      return;
    }
    setCopyLoading(true);
    try {
      // Buscar alavancas da empresa de origem
      const { data: leveragesToCopy, error } = await supabase
        .from('leverages')
        .select('*')
        .eq('company_id', originCompanyId)
        .eq('is_archived', false);
      if (error) throw error;
      if (!leveragesToCopy || leveragesToCopy.length === 0) {
        toast.error('Nenhuma alavanca encontrada na empresa de origem.');
        setCopyLoading(false);
        return;
      }
      // Remover campos que não devem ser copiados
      const leveragesInsert = leveragesToCopy.map((lev: any) => {
        const { id, created_at, updated_at, ...rest } = lev;
        return { ...rest, company_id: selectedCompanyId };
      });
      // Inserir na empresa de destino
      const { error: insertError } = await supabase
        .from('leverages')
        .insert(leveragesInsert);
      if (insertError) throw insertError;
      toast.success('Alavancas copiadas com sucesso!');
      setCopyModalOpen(false);
      fetchLeverages();
    } catch (err: any) {
      console.error('Erro ao copiar alavancas:', err);
      toast.error('Erro ao copiar alavancas: ' + (err.message || ''));
    } finally {
      setCopyLoading(false);
    }
  };

  const loadLeverages = async () => {
    try {
      let query = supabase
        .from('leverages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.eq('is_archived', false);
      } else if (statusFilter === 'archived') {
        query = query.eq('is_archived', true);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setLeverages(data || []);
    } catch (error) {
      console.error('Erro ao carregar alavancas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alavancas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeverages();
  }, [searchTerm, statusFilter]);

  const handleArchiveToggle = async (leverage: any) => {
    try {
      const { error } = await supabase
        .from('leverages')
        .update({ 
          is_archived: !leverage.is_archived,
          updated_at: new Date().toISOString()
        })
        .eq('id', leverage.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Sucesso!',
        description: `Alavanca ${leverage.is_archived ? 'restaurada' : 'arquivada'} com sucesso.`,
      });

      loadLeverages();
    } catch (error) {
      console.error('Erro ao arquivar/restaurar alavanca:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao arquivar/restaurar alavanca.',
        variant: 'destructive',
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'real_estate': return 'Imóvel';
      case 'vehicle': return 'Veículo';
      default: return type;
    }
  };

  const getSubtypeLabel = (subtype: string) => {
    switch (subtype) {
      case 'short_stay': return 'Temporada';
      case 'commercial_residential': return 'Comercial/Residencial';
      default: return subtype;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-gray-500">Carregando alavancas...</div>
      </div>
    );
  }

  if (leverages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">Nenhuma alavanca encontrada</p>
        <p className="text-sm text-gray-400">
          {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando uma nova alavanca'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão de cópia de alavancas */}
      {canCopy && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setCopyModalOpen(true)}>
            Copiar alavancas de outra empresa
          </Button>
        </div>
      )}
      {/* Modal de cópia */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar alavancas de outra empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Empresa de origem</label>
              <Select value={originCompanyId} onValueChange={setOriginCompanyId} disabled={companiesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={companiesLoading ? 'Carregando...' : 'Selecione a empresa'} />
                </SelectTrigger>
                <SelectContent>
                  {companies
                    .filter((c: any) => c.id !== selectedCompanyId)
                    .map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCopyLeverages} disabled={!originCompanyId || copyLoading}>
              {copyLoading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {leverages.map((leverage) => (
        <Card key={leverage.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{leverage.name}</h3>
                  <Badge variant={leverage.is_archived ? 'secondary' : 'default'}>
                    {leverage.is_archived ? 'Arquivada' : 'Ativa'}
                  </Badge>
                  <Badge variant="outline">
                    {getTypeLabel(leverage.type)}
                  </Badge>
                  {leverage.subtype && (
                    <Badge variant="outline">
                      {getSubtypeLabel(leverage.subtype)}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  {leverage.daily_percentage && (
                    <div>Diária: {leverage.daily_percentage}%</div>
                  )}
                  {leverage.rental_percentage && (
                    <div>Aluguel: {leverage.rental_percentage}%</div>
                  )}
                  {leverage.occupancy_rate && (
                    <div>Ocupação: {leverage.occupancy_rate}%</div>
                  )}
                  {leverage.management_percentage && (
                    <div>Administração: {leverage.management_percentage}%</div>
                  )}
                  {leverage.total_expenses && (
                    <div>Despesas: R$ {leverage.total_expenses}</div>
                  )}
                  {leverage.fixed_property_value && (
                    <div>Valor Fixo: R$ {leverage.fixed_property_value}</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(leverage)}
                  className="hover:bg-blue-50 hover:border-blue-200"
                  disabled={isSubMaster}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArchiveToggle(leverage)}
                  className={leverage.is_archived ? 
                    "hover:bg-green-50 hover:border-green-200" : 
                    "hover:bg-red-50 hover:border-red-200"
                  }
                  disabled={isSubMaster}
                >
                  {leverage.is_archived ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
