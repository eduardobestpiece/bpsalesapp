
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Administrator, Product, Property, BidType } from '@/types/entities';
import { Building, Settings, Calculator, Home } from 'lucide-react';
import { useSimulatorSync } from '@/hooks/useSimulatorSync';

interface EntityConfigurationProps {
  onAdministratorChange: (admin: Administrator) => void;
  onProductChange: (product: Product) => void;
  onPropertyChange: (property: Property) => void;
}

export const EntityConfiguration = ({
  onAdministratorChange,
  onProductChange,
  onPropertyChange
}: EntityConfigurationProps) => {
  const { 
    administrator, 
    product, 
    property,
    updateSimulationValue,
    updateInstallments
  } = useSimulatorSync();

  const handleAdministratorUpdate = (field: keyof Administrator, value: any) => {
    const updated = { ...administrator, [field]: value };
    onAdministratorChange(updated);
  };

  const handleProductUpdate = (field: keyof Product, value: any) => {
    const updated = { ...product, [field]: value };
    
    // Sincronizar campos específicos com o contexto global
    if (field === 'nominalCreditValue') {
      updateSimulationValue(value);
    } else if (field === 'termMonths') {
      updateInstallments(value);
    }
    
    onProductChange(updated);
  };

  const handlePropertyUpdate = (field: keyof Property, value: any) => {
    const updated = { ...property, [field]: value };
    
    // Sincronizar o valor do imóvel com o valor do crédito quando apropriado
    if (field === 'initialValue') {
      updateSimulationValue(value);
    }
    
    onPropertyChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração de Entidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="administrator" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="administrator">Administradora</TabsTrigger>
            <TabsTrigger value="product">Produto</TabsTrigger>
            <TabsTrigger value="property">Imóvel</TabsTrigger>
          </TabsList>

          {/* Configuração da Administradora */}
          <TabsContent value="administrator" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-name">Nome da Administradora</Label>
                <Input
                  id="admin-name"
                  value={administrator.name}
                  onChange={(e) => handleAdministratorUpdate('name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="update-index">Índice de Atualização</Label>
                <Select 
                  value={administrator.updateIndex} 
                  onValueChange={(value) => handleAdministratorUpdate('updateIndex', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IPCA">IPCA</SelectItem>
                    <SelectItem value="INCC">INCC</SelectItem>
                    <SelectItem value="IGPM">IGP-M</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="update-month">Mês de Atualização</Label>
                <Select 
                  value={administrator.updateMonth.toString()} 
                  onValueChange={(value) => handleAdministratorUpdate('updateMonth', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="grace-period">Carência (meses)</Label>
                <Input
                  id="grace-period"
                  type="number"
                  value={administrator.updateGracePeriod}
                  onChange={(e) => handleAdministratorUpdate('updateGracePeriod', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="max-embedded">% Máximo Embutido</Label>
                <Input
                  id="max-embedded"
                  type="number"
                  value={administrator.maxEmbeddedPercentage}
                  onChange={(e) => handleAdministratorUpdate('maxEmbeddedPercentage', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          {/* Configuração do Produto */}
          <TabsContent value="product" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name">Nome do Produto</Label>
                <Input
                  id="product-name"
                  value={product.name}
                  onChange={(e) => handleProductUpdate('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="credit-value">Valor do Crédito (R$)</Label>
                <Input
                  id="credit-value"
                  type="number"
                  value={product.nominalCreditValue}
                  onChange={(e) => handleProductUpdate('nominalCreditValue', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="term-months">Prazo (meses)</Label>
                <Input
                  id="term-months"
                  type="number"
                  value={product.termMonths}
                  onChange={(e) => handleProductUpdate('termMonths', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="admin-tax">Taxa Admin (%)</Label>
                <Input
                  id="admin-tax"
                  type="number"
                  step="0.1"
                  value={product.adminTaxPct}
                  onChange={(e) => handleProductUpdate('adminTaxPct', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="reserve-fund">Fundo Reserva (%)</Label>
                <Input
                  id="reserve-fund"
                  type="number"
                  step="0.1"
                  value={product.reserveFundPct}
                  onChange={(e) => handleProductUpdate('reserveFundPct', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="insurance">Seguro (%)</Label>
                <Input
                  id="insurance"
                  type="number"
                  step="0.1"
                  value={product.insurancePct}
                  onChange={(e) => handleProductUpdate('insurancePct', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="reduced-pct">% Parcela Reduzida</Label>
                <Input
                  id="reduced-pct"
                  type="number"
                  value={product.reducedPercentage}
                  onChange={(e) => handleProductUpdate('reducedPercentage', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="advance-installments">Parcelas Antecipadas</Label>
                <Input
                  id="advance-installments"
                  type="number"
                  value={product.advanceInstallments}
                  onChange={(e) => handleProductUpdate('advanceInstallments', parseInt(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>

          {/* Configuração do Imóvel */}
          <TabsContent value="property" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property-type">Tipo do Imóvel</Label>
                <Select 
                  value={property.type} 
                  onValueChange={(value) => handlePropertyUpdate('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-stay">Short-Stay</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="residential">Residencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="property-value">Valor do Imóvel (R$)</Label>
                <Input
                  id="property-value"
                  type="number"
                  value={property.initialValue}
                  onChange={(e) => handlePropertyUpdate('initialValue', parseFloat(e.target.value))}
                />
              </div>

              {property.type === 'short-stay' && (
                <>
                  <div>
                    <Label htmlFor="daily-rate">Diária (R$)</Label>
                    <Input
                      id="daily-rate"
                      type="number"
                      value={property.dailyRate || 0}
                      onChange={(e) => handlePropertyUpdate('dailyRate', parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="occupancy-rate">Taxa Ocupação (%)</Label>
                    <Input
                      id="occupancy-rate"
                      type="number"
                      value={property.occupancyRatePct || 80}
                      onChange={(e) => handlePropertyUpdate('occupancyRatePct', parseFloat(e.target.value))}
                    />
                  </div>
                </>
              )}

              {(property.type === 'commercial' || property.type === 'residential') && (
                <div>
                  <Label htmlFor="monthly-rent">Aluguel Mensal (R$)</Label>
                  <Input
                    id="monthly-rent"
                    type="number"
                    value={property.monthlyRent || 0}
                    onChange={(e) => handlePropertyUpdate('monthlyRent', parseFloat(e.target.value))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="fixed-costs">Custos Fixos Mensais (R$)</Label>
                <Input
                  id="fixed-costs"
                  type="number"
                  value={property.fixedMonthlyCosts}
                  onChange={(e) => handlePropertyUpdate('fixedMonthlyCosts', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="appreciation">Valorização Anual (%)</Label>
                <Input
                  id="appreciation"
                  type="number"
                  step="0.1"
                  value={property.annualAppreciationPct}
                  onChange={(e) => handlePropertyUpdate('annualAppreciationPct', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="contemplation-month">Mês de Contemplação</Label>
                <Input
                  id="contemplation-month"
                  type="number"
                  value={property.contemplationMonth || 24}
                  onChange={(e) => handlePropertyUpdate('contemplationMonth', parseInt(e.target.value))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
