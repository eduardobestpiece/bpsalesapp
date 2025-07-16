
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Archive, User } from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { LeadModal } from './LeadModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface LeadsListProps {
  companyId: string;
}

export const LeadsList = ({ companyId }: LeadsListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: leads = [], isLoading } = useLeads();
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';

  const handleEdit = (lead: any) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  const filteredLeads = leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar lead..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="max-w-xs"
              disabled={isSubMaster}
            />
            <Button onClick={() => setShowModal(true)} disabled={isSubMaster}>
              <Plus className="w-4 h-4 mr-2" /> Novo Lead
            </Button>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div>Carregando...</div>
            ) : (
              filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between border border-border dark:border-[#A86F57]/20 bg-card dark:bg-[#1F1F1F] rounded p-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary dark:text-[#A86F57]" />
                    <span className="font-medium text-foreground dark:text-white">{lead.name}</span>
                    <Badge variant="outline" className="border-border dark:border-[#A86F57]/30 text-foreground dark:text-white">{lead.email}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                      disabled={isSubMaster}
                      className="border-border dark:border-[#A86F57]/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#161616]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {}}
                      disabled={isSubMaster}
                      className="border-border dark:border-[#A86F57]/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-[#161616]"
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
