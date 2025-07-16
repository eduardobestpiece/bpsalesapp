
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSimulatorSync } from '@/hooks/useSimulatorSync';

export const CapitalGain = () => {
  const { 
    product, 
    updateSimulationValue,
    simulationData
  } = useSimulatorSync();
  
  const [purchasePercentage, setPurchasePercentage] = useState(20);
  const [creditValue, setCreditValue] = useState(product.nominalCreditValue || 1000000);
  const [paidInstallments, setPaidInstallments] = useState(120000);
  
  // Sincronizar o valor do crédito com o produto do contexto
  useEffect(() => {
    setCreditValue(product.nominalCreditValue);
  }, [product.nominalCreditValue]);
  
  // Atualizar o contexto quando o valor do crédito mudar neste componente
  const handleCreditValueChange = (value: number) => {
    setCreditValue(value);
    updateSimulationValue(value);
  };
  
  const monteoPayment = (creditValue * purchasePercentage) / 100;
  const profit = monteoPayment - paidInstallments;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Input Form */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Simulação de Ganho de Capital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="percentage">Percentual de Compra (%)</Label>
            <Input
              id="percentage"
              type="number"
              value={purchasePercentage}
              onChange={(e) => setPurchasePercentage(Number(e.target.value))}
              placeholder="Ex: 20"
            />
            <p className="text-sm text-muted-foreground">
              Percentual que a Monteo paga pelo crédito
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit">Valor do Crédito (R$)</Label>
            <Input
              id="credit"
              type="number"
              value={creditValue}
              onChange={(e) => handleCreditValueChange(Number(e.target.value))}
              placeholder="Ex: 1000000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid">Valor Pago em Parcelas (R$)</Label>
            <Input
              id="paid"
              type="number"
              value={paidInstallments}
              onChange={(e) => setPaidInstallments(Number(e.target.value))}
              placeholder="Ex: 120000"
            />
          </div>

          <Button className="w-full bg-amber-600 hover:bg-amber-700">
            Calcular Ganho
          </Button>
        </CardContent>
      </Card>

      {/* Right Panel - Results */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Resultado do Ganho de Capital</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Valor do Crédito</div>
              <div className="text-2xl font-bold">
                R$ {creditValue.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Pagamento da Monteo</div>
              <div className="text-2xl font-bold text-amber-600">
                R$ {monteoPayment.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground">Valor Pago pelo Cliente</div>
              <div className="text-2xl font-bold">
                R$ {paidInstallments.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <div className="text-sm text-muted-foreground">Lucro Líquido</div>
              <div className="text-3xl font-bold text-green-600">
                R$ {profit.toLocaleString('pt-BR')}
              </div>
              {profit > 0 && (
                <Badge className="mt-2 bg-green-100 text-green-800">
                  Operação Rentável
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Como funciona:</h4>
            <p className="text-sm text-muted-foreground">
              A Monteo compra seu crédito por {purchasePercentage}% do valor total. 
              Você recebe de volta tudo que já pagou em parcelas mais o lucro adicional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
