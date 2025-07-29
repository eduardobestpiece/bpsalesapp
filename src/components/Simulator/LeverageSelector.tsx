
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { LeverageModal } from '@/components/Administrators/LeverageModal';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

interface Leverage {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  daily_percentage?: number;
  rental_percentage?: number;
  occupancy_rate?: number;
  total_expenses?: number;
  fixed_property_value?: number;
}

interface LeverageSelectorProps {
  selectedLeverage: string;
  onLeverageChange: (leverageId: string) => void;
  onLeverageData: (leverage: Leverage | null) => void;
}

export const LeverageSelector = ({ selectedLeverage, onLeverageChange, onLeverageData }: LeverageSelectorProps) => {
  const { selectedCompanyId } = useCompany();
  const [leverages, setLeverages] = useState<Leverage[]>([]);
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchLeverages();
    }
  }, [refreshKey, selectedCompanyId]);

  useEffect(() => {
    if (selectedLeverage) {
      const leverage = leverages.find(l => l.id === selectedLeverage);
      onLeverageData(leverage || null);
    } else {
      onLeverageData(null);
    }
  }, [selectedLeverage, leverages, onLeverageData]);

  const fetchLeverages = async () => {
    try {
      const { data, error } = await supabase
        .from('leverages')
        .select('*')
        .eq('is_archived', false)
        .eq('company_id', selectedCompanyId)
        .order('name');
      
      if (error) throw error;
      setLeverages(data || []);
    } catch (error) {
    }
  };

  const handleLeverageModalClose = () => {
    setShowLeverageModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const getLeverageDisplayName = (leverage: Leverage) => {
    let displayName = leverage.name;
    if (leverage.subtype) {
      displayName += ` (${leverage.subtype})`;
    }
    return displayName;
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={selectedLeverage} onValueChange={onLeverageChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione uma alavanca" />
          </SelectTrigger>
          <SelectContent>
            {leverages.map((leverage) => (
              <SelectItem key={leverage.id} value={leverage.id}>
                {getLeverageDisplayName(leverage)}
              </SelectItem>
            ))}
            <div className="border-t mt-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeverageModal(true)}
                className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Alavanca
              </Button>
            </div>
          </SelectContent>
        </Select>
      </div>

      <LeverageModal
        isOpen={showLeverageModal}
        onClose={handleLeverageModalClose}
        leverage={null}
        onSave={handleLeverageModalClose}
      />
    </>
  );
};
