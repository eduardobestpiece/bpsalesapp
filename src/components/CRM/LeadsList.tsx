
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { LeadModal } from './LeadModal';

interface LeadsListProps {
  companyId: string;
}

export const LeadsList = ({ companyId }: LeadsListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: leads = [], isLoading } = useLeads();

  const handleEdit = (lead: any) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm)
  );

  if (isLoading) {
    return <div className="text-center py-4">Carregando leads...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                Gerencie todos os leads da empresa
              </CardDescription>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Pesquisar por nome, email, telefone, responsável ou fase..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredLeads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? 'Nenhum lead encontrado para a pesquisa.' : 'Nenhum lead encontrado. Crie o primeiro lead para começar.'}
              </p>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">Nome do Lead</p>
                    </div>
                    <div>
                      <p className="text-sm">{lead.email || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Email</p>
                    </div>
                    <div>
                      <p className="text-sm">{lead.phone || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                    </div>
                    <div>
                      <p className="text-sm">Responsável</p>
                      <p className="text-sm text-muted-foreground">A definir</p>
                    </div>
                    <div>
                      <Badge variant="outline">Fase</Badge>
                      <p className="text-sm text-muted-foreground">A definir</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <LeadModal
        isOpen={showModal}
        onClose={handleCloseModal}
        companyId={companyId}
        lead={selectedLead}
      />
    </>
  );
};
