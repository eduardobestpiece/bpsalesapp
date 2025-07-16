
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeverageSelector } from './LeverageSelector';

interface LeverageData {
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

interface LeverageConfigurationProps {
  selectedLeverage: string;
  leverageData: LeverageData | null;
  valorImovelManual: number | '';
  embutido: 'com' | 'sem';
  onLeverageChange: (leverageId: string) => void;
  onLeverageData: (leverage: LeverageData | null) => void;
  onValorImovelChange: (valor: number | '') => void;
  onEmbutidoChange: (embutido: 'com' | 'sem') => void;
  valorBase: number;
  percentualEmbutido: number;
  creditoRecomendado: number | null;
}

export const LeverageConfiguration = ({
  selectedLeverage,
  leverageData,
  valorImovelManual,
  embutido,
  onLeverageChange,
  onLeverageData,
  onValorImovelChange,
  onEmbutidoChange,
  valorBase,
  percentualEmbutido,
  creditoRecomendado
}: LeverageConfigurationProps) => {
  
  // Determinar se a alavanca tem valor fixo
  const hasValorFixo = !!leverageData?.fixed_property_value;
  
  // Só mostrar campo valor imóvel se alavanca selecionada e não for valor fixo
  const showValorImovel = leverageData && !hasValorFixo;
  
  // Valor do imóvel considerado (NUNCA inclui embutido)
  const valorImovel = hasValorFixo ? leverageData?.fixed_property_value || 0 : Number(valorImovelManual) || 0;
  
  // Percentual de despesas da alavanca (0-1)
  const percentualDespesas = (leverageData?.total_expenses || 0) / 100;
  
  // Percentual de ocupação da alavanca (0-1)
  const percentualOcupacao = (leverageData?.occupancy_rate || 0) / 100;
  
  // Crédito por imóvel com embutido
  const creditoPorImovelComEmbutido = embutido !== 'com' || !valorImovel ? valorImovel : 
    valorImovel + (valorImovel * (percentualEmbutido + (percentualEmbutido * percentualEmbutido)));
  
  // Número de imóveis
  const numeroImoveis = !creditoPorImovelComEmbutido || creditoPorImovelComEmbutido === 0 ? 0 : 
    Math.ceil(valorBase / creditoPorImovelComEmbutido);
  
  // Despesas
  const despesas = !valorImovel || percentualDespesas === 0 ? 0 : valorImovel * percentualDespesas;
  
  // Ocupação (em dias)
  const ocupacaoDias = !percentualOcupacao ? 0 : Math.round(30 * percentualOcupacao);

  return (
    <>
      {/* Exibir Crédito Recomendado no topo, apenas se embutido estiver ativado */}
      {embutido === 'com' && creditoRecomendado && (
        <div className="bg-blue-50 border-blue-200 rounded-lg p-3 mb-2">
          <span className="text-blue-800 font-semibold">Crédito Recomendado: </span>
          <span className="text-blue-900 font-bold text-lg">
            {creditoRecomendado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      )}
      
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          {/* Esquerda: Características do Imóvel */}
          <div className="flex-1 min-w-[280px]">
            <div className="mb-2 text-lg font-bold">Características do Imóvel</div>
            <div className="flex gap-2 mb-2">
              <LeverageSelector
                selectedLeverage={selectedLeverage}
                onLeverageChange={onLeverageChange}
                onLeverageData={onLeverageData}
              />
              {showValorImovel && (
                <Input
                  type="number"
                  value={valorImovelManual}
                  onChange={e => onValorImovelChange(e.target.value === '' ? '' : Number(e.target.value))}
                  className="font-bold text-lg bg-input text-foreground border-2 rounded-xl px-4 py-2 w-48"
                  style={{ minWidth: 180 }}
                  placeholder="Valor do imóvel"
                />
              )}
            </div>
            
            {/* Botões Com/Sem embutido */}
            <div className="flex gap-2 mb-2">
              <Button
                variant={embutido === 'com' ? 'default' : 'outline'}
                onClick={() => onEmbutidoChange('com')}
              >
                Com embutido
              </Button>
              <Button
                variant={embutido === 'sem' ? 'default' : 'outline'}
                onClick={() => onEmbutidoChange('sem')}
              >
                Sem embutido
              </Button>
            </div>
            
            {/* Informações do imóvel */}
            {leverageData && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                <div>
                  <b>Valor da diária:</b>{' '}
                  {leverageData?.daily_percentage && valorImovel 
                    ? (leverageData.daily_percentage / 100 * valorImovel).toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }) 
                    : '-'
                  }
                </div>
                <div><b>Ocupação:</b> {ocupacaoDias} dias</div>
                <div><b>Despesas:</b> {despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div><b>Número de imóveis:</b> {numeroImoveis}</div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  );
};
