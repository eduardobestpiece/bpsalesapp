
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

  // Removido: cópia de alavancas

  // Removido: busca de empresas para cópia

  // Removido: função de cópia

  const loadLeverages = async () => {
    try {
      if (!selectedCompanyId) { setLeverages([]); setLoading(false); return; }
      let query = supabase
        .from('leverages')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('company_id', selectedCompanyId);

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
  }, [searchTerm, statusFilter, selectedCompanyId]);

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
        <div className="text-muted-foreground">Carregando alavancas...</div>
      </div>
    );
  }

  if (leverages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-2">Nenhuma alavanca encontrada</p>
        <p className="text-sm text-muted-foreground/80">
          {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando uma nova alavanca'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Removidos: botão e modal de cópia de alavancas */}
      {leverages.map((leverage) => (
        <Card key={leverage.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{leverage.name}</h3>
                  {leverage.is_archived ? (
                    <Badge variant="destructive" className="brand-radius">Arquivada</Badge>
                  ) : (
                    <Badge className="brand-radius text-white" style={{ backgroundColor: 'var(--brand-primary, #A86F57)' }}>Ativa</Badge>
                  )}
                  <Badge variant="outline" className="brand-radius">
                    {getTypeLabel(leverage.type)}
                  </Badge>
                  {leverage.subtype && (
                    <Badge variant="outline" className="brand-radius">
                      {getSubtypeLabel(leverage.subtype)}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
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
                    <div>Despesas: {leverage.hasFixedValue ? 
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(leverage.total_expenses) : 
                      `${leverage.total_expenses}%`}</div>
                  )}
                  {leverage.fixed_property_value && (
                    <div>Valor Fixo: R$ {leverage.fixed_property_value}</div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="brandOutlineSecondaryHover"
                  size="sm"
                  onClick={() => onEdit(leverage)}
                  className="brand-radius"
                  disabled={isSubMaster}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {isMaster && (
                  <Button
                    variant="brandOutlineSecondaryHover"
                    size="sm"
                    onClick={() => handleArchiveToggle(leverage)}
                    className="brand-radius"
                  >
                    {leverage.is_archived ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
