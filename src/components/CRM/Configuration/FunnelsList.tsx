
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Archive, Eye, Search, Trash2 } from 'lucide-react';
import { useFunnels } from '@/hooks/useCrmData';
import { useDeleteFunnel, usePermanentlyDeleteFunnel } from '@/hooks/useFunnels';
import { toast } from 'sonner';
import { FunnelModal } from './FunnelModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export const FunnelsList = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const { data: funnels = [], isLoading } = useFunnels(selectedCompanyId || companyId);
  const deleteFunnelMutation = useDeleteFunnel();
  const permanentlyDeleteFunnelMutation = usePermanentlyDeleteFunnel();
  const { userRole } = useUserPermissions();
  
  // Verificar se o usuário é Master
  const isMaster = userRole === 'master';
  
  // Debug para verificar permissões
  console.log('[FUNNELS_LIST_DEBUG] userRole:', userRole);
  console.log('[FUNNELS_LIST_DEBUG] isMaster:', isMaster);

  const handleEdit = (funnel: any) => {
    setSelectedFunnel(funnel);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFunnel(null);
  };

  const handleArchive = async (funnelId: string) => {
    try {
      await deleteFunnelMutation.mutateAsync(funnelId);
      toast.success('Funil arquivado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao arquivar funil');
    }
  };

  const handlePermanentlyDelete = async (funnelId: string, funnelName: string) => {
    if (!isMaster) {
      toast.error('Apenas usuários Master podem excluir funis permanentemente');
      return;
    }

    const confirmed = window.confirm(
      `ATENÇÃO: Esta ação é irreversível!\n\n` +
      `Você está prestes a excluir permanentemente o funil "${funnelName}" e todos os seus dados.\n\n` +
      `Esta ação não pode ser desfeita. Deseja continuar?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await permanentlyDeleteFunnelMutation.mutateAsync(funnelId);
      toast.success('Funil excluído permanentemente com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir funil permanentemente');
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredFunnels = funnels.filter(funnel =>
    funnel.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando funis...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Funis de Vendas</CardTitle>
              <CardDescription>
                Gerencie os funis de vendas da empresa
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)} variant="brandPrimaryToSecondary" className="brand-radius">
              <Plus className="w-4 h-4 mr-2" />
              Novo Funil
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Pesquisar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 field-secondary-focus no-ring-focus brand-radius"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFunnels.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhum funil encontrado com este termo.' : 'Nenhum funil encontrado. Crie o primeiro funil para começar.'}
              </p>
            ) : (
              filteredFunnels.map((funnel) => (
                <div
                  key={funnel.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card dark:bg-[#1F1F1F] border-[#333333]"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground dark:text-white">{funnel.name}</h3>
                      <Badge className="text-white brand-radius" style={{ backgroundColor: 'var(--brand-primary, #A86F57)' }}>
                        {funnel.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">
                      Verificação: {getVerificationTypeLabel(funnel.verification_type)}
                      {funnel.verification_day && ` - Dia ${funnel.verification_day}`}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-300">
                      {funnel.stages?.length || 0} etapas configuradas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="brandOutlineSecondaryHover"
                      size="sm"
                      onClick={() => handleEdit(funnel)}
                      className="brand-radius"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {funnel.status === 'active' && (
                      <Button
                        variant="brandOutlineSecondaryHover"
                        size="sm"
                        onClick={() => handleArchive(funnel.id)}
                        className="brand-radius"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    )}
                    {(() => {
                      console.log('[FUNNELS_LIST_DEBUG] Renderizando botão para funil:', funnel.name);
                      console.log('[FUNNELS_LIST_DEBUG] isMaster:', isMaster);
                      return isMaster;
                    })() && (
                      <Button
                        variant="brandOutlineSecondaryHover"
                        size="sm"
                        onClick={() => handlePermanentlyDelete(funnel.id, funnel.name)}
                        className="brand-radius"
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <FunnelModal
        isOpen={showModal}
        onClose={handleCloseModal}
        funnel={selectedFunnel}
      />
    </>
  );
};
