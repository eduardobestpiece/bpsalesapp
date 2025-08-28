import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, Edit, Archive, MoreHorizontal } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useFunnels } from '@/hooks/useFunnels';
import { useSources } from '@/hooks/useSources';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface LeadsTableProps {
  searchTerm: string;
  onEdit: (lead: any) => void;
}

export const LeadsTable = ({ searchTerm, onEdit }: LeadsTableProps) => {
  const { data: leads = [], isLoading } = useLeads();
  const { data: crmUsers = [] } = useCrmUsers();
  const { data: funnels = [] } = useFunnels();
  const { data: sources = [] } = useSources();
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';

  // Função para formatar data para horário de Brasília
  const formatDateToBrasilia = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter dados relacionados
  const getRelatedData = (lead: any) => {
    const responsible = crmUsers.find(u => u.id === lead.responsible_id);
    const funnel = funnels.find(f => f.id === lead.funnel_id);
    const stage = funnel?.stages?.find((s: any) => s.id === lead.current_stage_id);
    const source = sources.find(s => s.id === lead.source_id);

    return { responsible, funnel, stage, source };
  };

  const filteredLeads = leads.filter(lead =>
    (lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     lead.phone?.includes(searchTerm))
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left">Informações</TableHead>
          <TableHead className="text-left">Contato</TableHead>
          <TableHead className="text-left">Funil</TableHead>
          <TableHead className="text-left">Fase do Funil</TableHead>
          <TableHead className="text-left">Responsável</TableHead>
          <TableHead className="text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Carregando leads...
            </TableCell>
          </TableRow>
        ) : filteredLeads.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado.
            </TableCell>
          </TableRow>
        ) : (
          filteredLeads.map((lead) => {
            const { responsible, funnel, stage, source } = getRelatedData(lead);
            
            return (
              <TableRow key={lead.id}>
                <TableCell className="text-left">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {source?.name || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateToBrasilia(lead.created_at)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {lead.first_name || ''} {lead.last_name || ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lead.email || '-'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {lead.phone || '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  {funnel?.name || '-'}
                </TableCell>
                <TableCell className="text-left">
                  {stage?.name || '-'}
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={responsible?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {responsible?.first_name?.[0]}{responsible?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {responsible ? `${responsible.first_name} ${responsible.last_name}` : '-'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSubMaster}
                        className="h-8 w-8 p-0 hover:bg-muted focus:outline-none focus:ring-0 focus:border-0 more-button"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dropdown-item-brand">
                      <DropdownMenuItem
                        onClick={() => onEdit(lead)}
                        className="lead-dropdown-item"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {}}
                        className="lead-dropdown-item"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}; 