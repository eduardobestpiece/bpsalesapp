
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConsortiumSettings {
  administrationTax: number;
  hasInsurance: boolean;
  insuranceValue: number;
  reserveFund: number;
  specialInstallments: number;
  inccRate: number;
  contemplationBonus: number;
}

interface PropertySettings {
  propertyValue: number;
  dailyRate: number;
  occupancyRate: number;
  miscExpenses: number;
  maintenancePercentage: number;
  vacancyBuffer: number;
}

interface AdvancedSettings {
  opportunityCostRate: number;
  propertyAppreciationRate: number;
  inflationRate: number;
  taxRate: number;
}

export const DetailDrawer = ({ open, onOpenChange }: DetailDrawerProps) => {
  const [consortiumData, setConsortiumData] = useState<ConsortiumSettings>({
    administrationTax: 25,
    hasInsurance: false,
    insuranceValue: 2,
    reserveFund: 3,
    specialInstallments: 0,
    inccRate: 6,
    contemplationBonus: 0
  });

  const [propertyData, setPropertyData] = useState<PropertySettings>({
    propertyValue: 250000,
    dailyRate: 150,
    occupancyRate: 80,
    miscExpenses: 500,
    maintenancePercentage: 5,
    vacancyBuffer: 10
  });

  const [advancedData, setAdvancedData] = useState<AdvancedSettings>({
    opportunityCostRate: 12,
    propertyAppreciationRate: 8,
    inflationRate: 4,
    taxRate: 15
  });

  const handleResetDefaults = () => {
    setConsortiumData({
      administrationTax: 25,
      hasInsurance: false,
      insuranceValue: 2,
      reserveFund: 3,
      specialInstallments: 0,
      inccRate: 6,
      contemplationBonus: 0
    });

    setPropertyData({
      propertyValue: 250000,
      dailyRate: 150,
      occupancyRate: 80,
      miscExpenses: 500,
      maintenancePercentage: 5,
      vacancyBuffer: 10
    });

    setAdvancedData({
      opportunityCostRate: 12,
      propertyAppreciationRate: 8,
      inflationRate: 4,
      taxRate: 15
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configurações Avançadas</SheetTitle>
          <SheetDescription>
            Personalize os parâmetros de cálculo para obter simulações mais precisas
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="consortium" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consortium">Consórcio</TabsTrigger>
            <TabsTrigger value="property">Propriedade</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          <TabsContent value="consortium" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações do Consórcio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="inccRate">INCC/IPCA (% ao ano)</Label>
                    <Input
                      id="inccRate"
                      type="number"
                      value={consortiumData.inccRate}
                      onChange={(e) => setConsortiumData(prev => ({
                        ...prev,
                        inccRate: Number(e.target.value)
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contemplationBonus">Bônus Contemplação (%)</Label>
                    <Input
                      id="contemplationBonus"
                      type="number"
                      value={consortiumData.contemplationBonus}
                      onChange={(e) => setConsortiumData(prev => ({
                        ...prev,
                        contemplationBonus: Number(e.target.value)
                      }))}
                    />
                  </div>
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
                  <Label htmlFor="insurance">Incluir Seguro</Label>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações da Propriedade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="miscExpenses">Despesas Mensais (R$)</Label>
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
                    <Label htmlFor="maintenancePercentage">Manutenção (% receita)</Label>
                    <Input
                      id="maintenancePercentage"
                      type="number"
                      value={propertyData.maintenancePercentage}
                      onChange={(e) => setPropertyData(prev => ({
                        ...prev,
                        maintenancePercentage: Number(e.target.value)
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vacancyBuffer">Buffer Vacância (%)</Label>
                    <Input
                      id="vacancyBuffer"
                      type="number"
                      value={propertyData.vacancyBuffer}
                      onChange={(e) => setPropertyData(prev => ({
                        ...prev,
                        vacancyBuffer: Number(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Receita Estimada:</strong> R$ {(propertyData.dailyRate * 30 * propertyData.occupancyRate / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por mês
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opportunityCost">Custo de Oportunidade (% ao ano)</Label>
                    <Input
                      id="opportunityCost"
                      type="number"
                      value={advancedData.opportunityCostRate}
                      onChange={(e) => setAdvancedData(prev => ({
                        ...prev,
                        opportunityCostRate: Number(e.target.value)
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appreciation">Valorização Imóvel (% ao ano)</Label>
                    <Input
                      id="appreciation"
                      type="number"
                      value={advancedData.propertyAppreciationRate}
                      onChange={(e) => setAdvancedData(prev => ({
                        ...prev,
                        propertyAppreciationRate: Number(e.target.value)
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inflation">Taxa de Inflação (% ao ano)</Label>
                    <Input
                      id="inflation"
                      type="number"
                      value={advancedData.inflationRate}
                      onChange={(e) => setAdvancedData(prev => ({
                        ...prev,
                        inflationRate: Number(e.target.value)
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={advancedData.taxRate}
                      onChange={(e) => setAdvancedData(prev => ({
                        ...prev,
                        taxRate: Number(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Badge variant="secondary">
                    ROI Estimado: {(advancedData.propertyAppreciationRate - advancedData.inflationRate).toFixed(1)}% real ao ano
                  </Badge>
                  <Badge variant="secondary">
                    Payback Esperado: ~{Math.round(100 / (advancedData.propertyAppreciationRate - advancedData.opportunityCostRate))} anos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button 
            className="flex-1 bg-amber-600 hover:bg-amber-700"
            onClick={() => onOpenChange(false)}
          >
            Aplicar Configurações
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleResetDefaults}
          >
            Restaurar Padrões
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
