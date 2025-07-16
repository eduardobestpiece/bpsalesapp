
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatrimonialLeverage } from './PatrimonialLeverage';
import { CapitalGain } from './CapitalGain';
import { SimulatorProvider } from '@/contexts/SimulatorContext';

export const SimulatorTabs = () => {
  return (
    <SimulatorProvider>
      <div className="w-full">
        <Tabs defaultValue="patrimonial" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="patrimonial" className="text-lg">
              Alavancagem Patrimonial
            </TabsTrigger>
            <TabsTrigger value="capital" className="text-lg">
              Ganho de Capital
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="patrimonial" className="mt-0">
            <PatrimonialLeverage />
          </TabsContent>
          
          <TabsContent value="capital" className="mt-0">
            <CapitalGain />
          </TabsContent>
        </Tabs>
      </div>
    </SimulatorProvider>
  );
};
