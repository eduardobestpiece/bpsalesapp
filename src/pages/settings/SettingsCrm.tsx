
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { FunnelsList } from '@/components/CRM/Configuration/FunnelsList';
import { SourcesList } from '@/components/CRM/Configuration/SourcesList';
import { TeamsList } from '@/components/CRM/Configuration/TeamsList';

export default function SettingsCrm() {
  return (
    <SettingsLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted/30">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-full mx-auto">
            <div className="bg-card/95 backdrop-blur-sm rounded-3xl shadow-xl border border-border p-1">
              <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-2xl font-bold text-foreground">Configurações CRM</h2>
                  <p className="text-muted-foreground">Gerencie funis, times e origens</p>
                </div>
                <Tabs defaultValue="funnels" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="funnels">Funis</TabsTrigger>
                    <TabsTrigger value="sources">Origens</TabsTrigger>
                    <TabsTrigger value="teams">Times</TabsTrigger>
                  </TabsList>
                  <TabsContent value="funnels" className="mt-6">
                    <FunnelsList />
                  </TabsContent>
                  <TabsContent value="sources" className="mt-6">
                    <SourcesList />
                  </TabsContent>
                  <TabsContent value="teams" className="mt-6">
                    <TeamsList />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SettingsLayout>
  );
} 