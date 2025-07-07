
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface BidType {
  id: string;
  name: string;
  percentage?: number;
  allows_embedded?: boolean;
}

interface BidTypeSelectorProps {
  administratorId: string;
  value: string;
  onValueChange: (value: string) => void;
}

export const BidTypeSelector = ({ administratorId, value, onValueChange }: BidTypeSelectorProps) => {
  const [bidTypes, setBidTypes] = useState<BidType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (administratorId) {
      fetchBidTypes();
    } else {
      setBidTypes([]);
    }
  }, [administratorId]);

  const fetchBidTypes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bid_types')
        .select('*')
        .eq('administrator_id', administratorId)
        .eq('is_archived', false)
        .order('name');
      
      if (error) throw error;
      setBidTypes(data || []);
    } catch (error) {
      console.error('Error fetching bid types:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={!administratorId || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Carregando..." : "Selecione o tipo de contemplação"} />
      </SelectTrigger>
      <SelectContent>
        {bidTypes.map((bidType) => (
          <SelectItem key={bidType.id} value={bidType.id}>
            {bidType.name}
            {bidType.percentage && ` (${bidType.percentage}%)`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
