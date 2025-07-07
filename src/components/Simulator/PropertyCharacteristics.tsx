
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PropertyData {
  type: 'short-stay' | 'commercial' | 'residential';
  dailyRate?: number;
  monthlyRent?: number;
  occupancyRate?: number;
  fixedCosts: number;
  appreciationRate: number;
}

interface PropertyCharacteristicsProps {
  propertyData: PropertyData;
  onPropertyChange: (data: PropertyData) => void;
}

export const PropertyCharacteristics = ({ propertyData, onPropertyChange }: PropertyCharacteristicsProps) => {
  const handleTypeChange = (type: 'short-stay' | 'commercial' | 'residential') => {
    onPropertyChange({
      ...propertyData,
      type,
      dailyRate: type === 'short-stay' ? propertyData.dailyRate || 150 : undefined,
      monthlyRent: type !== 'short-stay' ? propertyData.monthlyRent || 2500 : undefined,
      occupancyRate: type === 'short-stay' ? propertyData.occupancyRate || 80 : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Características do Imóvel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Imóvel</Label>
          <Select value={propertyData.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short-stay">Hospedagem (Airbnb)</SelectItem>
              <SelectItem value="commercial">Comercial</SelectItem>
              <SelectItem value="residential">Residencial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {propertyData.type === 'short-stay' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diária (R$)</Label>
                <Input
                  type="number"
                  value={propertyData.dailyRate || ''}
                  onChange={(e) => onPropertyChange({
                    ...propertyData,
                    dailyRate: Number(e.target.value)
                  })}
                  placeholder="150"
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Ocupação (%)</Label>
                <Input
                  type="number"
                  value={propertyData.occupancyRate || ''}
                  onChange={(e) => onPropertyChange({
                    ...propertyData,
                    occupancyRate: Number(e.target.value)
                  })}
                  placeholder="80"
                />
              </div>
            </div>
          </>
        )}

        {propertyData.type !== 'short-stay' && (
          <div className="space-y-2">
            <Label>Aluguel Mensal (R$)</Label>
            <Input
              type="number"
              value={propertyData.monthlyRent || ''}
              onChange={(e) => onPropertyChange({
                ...propertyData,
                monthlyRent: Number(e.target.value)
              })}
              placeholder="2500"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Custos Fixos Mensais (R$)</Label>
            <Input
              type="number"
              value={propertyData.fixedCosts}
              onChange={(e) => onPropertyChange({
                ...propertyData,
                fixedCosts: Number(e.target.value)
              })}
              placeholder="800"
            />
          </div>
          <div className="space-y-2">
            <Label>Valorização Anual (%)</Label>
            <Input
              type="number"
              value={propertyData.appreciationRate}
              onChange={(e) => onPropertyChange({
                ...propertyData,
                appreciationRate: Number(e.target.value)
              })}
              placeholder="8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
