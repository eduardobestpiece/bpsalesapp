
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Mail } from 'lucide-react';
import { SimulatorData } from '@/types/simulator';
import { calculateConsortium, calculateAirbnb } from '@/utils/calculations';

interface ProposalGeneratorProps {
  data: SimulatorData;
}

export const ProposalGenerator = ({ data }: ProposalGeneratorProps) => {
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isOpen, setIsOpen] = useState(false);

  const consortiumCalc = calculateConsortium(data);
  const airbnbCalc = calculateAirbnb(consortiumCalc);

  const generateProposal = () => {
    const proposalData = {
      client: clientData,
      simulation: data,
      results: {
        consortium: consortiumCalc,
        airbnb: airbnbCalc
      },
      generatedAt: new Date().toLocaleString('pt-BR')
    };

    // In a real application, this would generate a PDF or send to backend

    
    // For now, just download as JSON
    const blob = new Blob([JSON.stringify(proposalData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposta-${clientData.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="lg">
          <FileText className="mr-2 h-4 w-4" />
          Gerar Proposta
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Proposta Comercial</DialogTitle>
          <DialogDescription>
            Complete os dados do cliente para gerar uma proposta personalizada
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome Completo</Label>
                  <Input
                    id="clientName"
                    value={clientData.name}
                    onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">E-mail</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input
                  id="clientPhone"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientNotes">Observações</Label>
                <Textarea
                  id="clientNotes"
                  value={clientData.notes}
                  onChange={(e) => setClientData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o cliente ou negociação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Proposal Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Proposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Valor do Crédito</div>
                    <div className="text-xl font-bold text-amber-600">
                      R$ {consortiumCalc.creditValue.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Renda Passiva Estimada</div>
                    <div className="text-xl font-bold text-green-600">
                      R$ {airbnbCalc.activeCashGeneration.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    Parcela: R$ {consortiumCalc.installmentAfterContemplation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                  <Badge variant="secondary">
                    Prazo: {data.simulationTime} meses
                  </Badge>
                  <Badge variant="secondary">
                    Contemplação: {data.contemplationPeriod} meses
                  </Badge>
                  <Badge variant="secondary">
                    ROI: {airbnbCalc.cashFlowPercentage.toFixed(2)}%
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Estratégia:</strong> Alavancagem patrimonial através de consórcio imobiliário 
                  com locação por temporada (Airbnb) para geração de renda passiva.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={generateProposal}
              disabled={!clientData.name || !clientData.email}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Gerar e Baixar Proposta
            </Button>
            <Button 
              variant="outline"
              disabled={!clientData.email}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Enviar por E-mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
