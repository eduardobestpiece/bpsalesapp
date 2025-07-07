
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditAccessPanel } from './CreditAccessPanel';

interface SimulationData {
  administrator: string;
  consortiumType: 'property' | 'vehicle';
  installmentType: string;
  value: number;
  term: number;
  updateRate: number;
  searchType: 'contribution' | 'credit';
}

interface SimulationResultsPanelProps {
  data: SimulationData;
}

export const SimulationResultsPanel = ({ data }: SimulationResultsPanelProps) => {
  return (
    <Tabs defaultValue="credit-access" className="w-full h-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="credit-access">Crédito acessado</TabsTrigger>
        <TabsTrigger value="patrimonial" disabled>Alavancagem Patrimonial</TabsTrigger>
        <TabsTrigger value="capital-gain" disabled>Ganho de capital</TabsTrigger>
        <TabsTrigger value="redeemable" disabled>Capital resgatável</TabsTrigger>
      </TabsList>
      
      <TabsContent value="credit-access" className="h-full">
        <CreditAccessPanel data={data} />
      </TabsContent>
      
      <TabsContent value="patrimonial" className="flex items-center justify-center h-32">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Em breve</p>
        </div>
      </TabsContent>
      
      <TabsContent value="capital-gain" className="flex items-center justify-center h-32">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Em breve</p>
        </div>
      </TabsContent>
      
      <TabsContent value="redeemable" className="flex items-center justify-center h-32">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Em breve</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};
