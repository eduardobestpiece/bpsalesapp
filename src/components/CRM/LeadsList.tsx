
import { useState } from 'react';
import { LeadModal } from './LeadModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface LeadsListProps {
  companyId: string;
  showTable?: boolean;
  onSearchTermChange?: (term: string) => void;
}

export const LeadsList = ({ companyId, showTable = true, onSearchTermChange }: LeadsListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const { userRole } = useCrmAuth();
  const isSubMaster = userRole === 'submaster';

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };



  return (
    <>
      <LeadModal
        isOpen={showModal}
        onClose={handleCloseModal}
        companyId={companyId}
        lead={selectedLead}
      />
    </>
  );
};
