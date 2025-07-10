
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FunnelsList } from '@/components/CRM/Configuration/FunnelsList';
import { SourcesList } from '@/components/CRM/Configuration/SourcesList';
import { TeamsList } from '@/components/CRM/Configuration/TeamsList';
import { UsersList } from '@/components/CRM/Configuration/UsersList';

const CrmConfiguracoes = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Configurações CRM</h2>
                <p className="text-muted-foreground">
                  Gerencie funis, times, origens e usuários
                </p>
              </div>

              <Tabs defaultValue="funnels" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="funnels">Funis</TabsTrigger>
                  <TabsTrigger value="sources">Origens</TabsTrigger>
                  <TabsTrigger value="teams">Times</TabsTrigger>
                  <TabsTrigger value="users">Usuários</TabsTrigger>
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
                
                <TabsContent value="users" className="mt-6">
                  <UsersList />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmConfiguracoes;
