import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, User, Calendar } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadsKanbanProps {
  searchTerm: string;
  selectedFunnelIds: string[];
  onEdit: (lead: any) => void;
}

interface FunnelStage {
  id: string;
  name: string;
  stage_order: number;
  funnel_id: string;
}

export const LeadsKanban = ({ searchTerm, selectedFunnelIds, onEdit }: LeadsKanbanProps) => {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const { data: leads = [], isLoading: leadsLoading } = useLeads({ 
    searchTerm, 
    selectedFunnelIds 
  });

  // Buscar estágios do funil selecionado
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['funnel-stages', selectedFunnelIds[0]],
    queryFn: async () => {
      if (!selectedFunnelIds[0]) return [];
      
      const { data, error } = await supabase
        .from('funnel_stages')
        .select('*')
        .eq('funnel_id', selectedFunnelIds[0])
        .order('stage_order');
        
      if (error) throw error;
      return data as FunnelStage[];
    },
    enabled: selectedFunnelIds.length === 1
  });

  // Mutation para atualizar estágio do lead
  const updateLeadStageMutation = useMutation({
    mutationFn: async ({ leadId, newStageId }: { leadId: string; newStageId: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ current_stage_id: newStageId })
        .eq('id', leadId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar queries para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  // Agrupar leads por estágio
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => lead.current_stage_id === stage.id);
    return acc;
  }, {} as Record<string, any[]>);

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    
    // Verificar se o lead já está neste estágio
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.current_stage_id !== targetStageId) {
      updateLeadStageMutation.mutate({ leadId, newStageId: targetStageId });
    }
  };

  if (leadsLoading || stagesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando kanban...</div>
      </div>
    );
  }

  if (selectedFunnelIds.length !== 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-muted-foreground">
          <div className="text-lg font-medium mb-2">Modo Kanban Indisponível</div>
          <div>Selecione exatamente um funil para visualizar o Kanban</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getInitials = (firstName: string, lastName?: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{stage.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {leadsByStage[stage.id]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent 
                className="space-y-3 max-h-[600px] overflow-y-auto"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {leadsByStage[stage.id]?.map((lead) => (
                  <Card 
                    key={lead.id} 
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow border border-border/50"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => onEdit(lead)}
                  >
                    <div className="space-y-2">
                      {/* Header do card - Nome e Avatar do Responsável */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">
                            {lead.first_name} {lead.last_name}
                          </div>
                        </div>
                        {lead.responsible && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-brand-primary text-white">
                              {getInitials(lead.responsible.first_name, lead.responsible.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      {/* Origem (Source) */}
                      {lead.source && (
                        <Badge variant="outline" className="text-xs">
                          {lead.source.name}
                        </Badge>
                      )}

                      {/* Email */}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      )}

                      {/* Telefone */}
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone_ddi || ''} {lead.phone}</span>
                        </div>
                      )}

                      {/* Data de criação */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(lead.created_at)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {(!leadsByStage[stage.id] || leadsByStage[stage.id].length === 0) && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Nenhum lead neste estágio
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
