
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DetailDrawer = ({ open, onOpenChange }: DetailDrawerProps) => {
  const [consortiumData, setConsortiumData] = useState({
    administrationTax: 25,
    hasInsurance: false,
    insuranceValue: 2,
    reserveFund: 3,
    specialInstallments: 0
  });

  const [propertyData, setPropertyData] = useState({
    propertyValue: 250000,
    dailyRate: 150,
    occupancyRate: 80,
    miscExpenses: 500,
    inccRate: 6
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Detalhamento dos Cálculos</SheetTitle>
          <SheetDescription>
            Ajuste os parâmetros detalhados para personalizar sua simulação
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="consortium" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consortium">Cálculos do Consórcio</TabsTrigger>
            <TabsTrigger value="property">Cálculos do Imóvel</TabsTrigger>
          </TabsList>

          <TabsContent value="consortium" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminTax">Taxa de Administração (%)</Label>
                <Input
                  id="adminTax"
                  type="number"
                  value={consortiumData.administrationTax}
                  onChange={(e) => setConsortiumData(prev => ({
                    ...prev,
                    administrationTax: Number(e.target.value)
                  }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="insurance"
                  checked={consortiumData.hasInsurance}
                  onCheckedChange={(checked) => setConsortiumData(prev => ({
                    ...prev,
                    hasInsurance: checked
                  }))}
                />
                <Label htmlFor="insurance">Considerar Seguro</Label>
              </div>

              {consortiumData.hasInsurance && (
                <div className="space-y-2">
                  <Label htmlFor="insuranceValue">Valor do Seguro (%)</Label>
                  <Input
                    id="insuranceValue"
                    type="number"
                    value={consortiumData.insuranceValue}
                    onChange={(e) => setConsortiumData(prev => ({
                      ...prev,
                      insuranceValue: Number(e.target.value)
                    }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reserveFund">Fundo de Reserva (%)</Label>
                <Input
                  id="reserveFund"
                  type="number"
                  value={consortiumData.reserveFund}
                  onChange={(e) => setConsortiumData(prev => ({
                    ...prev,
                    reserveFund: Number(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstallments">Parcelas Especiais (%)</Label>
                <Input
                  id="specialInstallments"
                  type="number"
                  value={consortiumData.specialInstallments}
                  onChange={(e) => setConsortiumData(prev => ({
                    ...prev,
                    specialInstallments: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="property" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyValue">Valor do Imóvel (R$)</Label>
                <Input
                  id="propertyValue"
                  type="number"
                  value={propertyData.propertyValue}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    propertyValue: Number(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyRate">Valor da Diária (R$)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={propertyData.dailyRate}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    dailyRate: Number(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupancyRate">Taxa de Ocupação (%)</Label>
                <Input
                  id="occupancyRate"
                  type="number"
                  value={propertyData.occupancyRate}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    occupancyRate: Number(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="miscExpenses">Despesas Diversas (R$)</Label>
                <Input
                  id="miscExpenses"
                  type="number"
                  value={propertyData.miscExpenses}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    miscExpenses: Number(e.target.value)
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inccRate">INCC/IPCA (%)</Label>
                <Input
                  id="inccRate"
                  type="number"
                  value={propertyData.inccRate}
                  onChange={(e) => setPropertyData(prev => ({
                    ...prev,
                    inccRate: Number(e.target.value)
                  }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button 
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={() => onOpenChange(false)}
          >
            Aplicar Alterações
          </Button>
          <Button variant="outline" className="flex-1">
            Redefinir Padrões
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
