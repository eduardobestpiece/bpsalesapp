import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const DebugPermissions: React.FC = () => {
  const { crmUser, userRole } = useCrmAuth();
  const { 
    userPermissions, 
    canAccessSimulator, 
    canAccessSimulatorConfig, 
    canAccessSimulatorModule,
    isLoading,
    error
  } = useUserPermissions();

  const testPermissions = () => {
    console.log('=== TESTE DE PERMISSÕES ===');
    console.log('Usuário:', crmUser);
    console.log('Role:', userRole);
    console.log('Permissões:', userPermissions);
    console.log('canAccessSimulator:', canAccessSimulator());
    console.log('canAccessSimulatorConfig:', canAccessSimulatorConfig());
    console.log('canAccessSimulatorModule:', canAccessSimulatorModule());
    console.log('=== FIM TESTE ===');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-center mt-2">Carregando permissões...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar permissões: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug de Permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testPermissions} className="mb-4">
            Testar Permissões no Console
          </Button>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Informações do Usuário</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Nome:</strong> {crmUser?.first_name} {crmUser?.last_name}</p>
                <p><strong>Email:</strong> {crmUser?.email}</p>
                <p><strong>Role:</strong> <Badge variant="outline">{userRole}</Badge></p>
                <p><strong>Company ID:</strong> {crmUser?.company_id}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Permissões Encontradas ({userPermissions.length})</h3>
              {userPermissions.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma permissão customizada encontrada</p>
              ) : (
                <div className="space-y-2">
                  {userPermissions.map((perm, index) => (
                    <div key={index} className="border rounded p-3 bg-muted/50">
                      <p className="font-medium">Módulo: {perm.module_name}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Badge variant={perm.can_view === 'allowed' ? 'default' : 'secondary'}>
                          Ver: {perm.can_view}
                        </Badge>
                        <Badge variant={perm.can_edit === 'allowed' ? 'default' : 'secondary'}>
                          Editar: {perm.can_edit}
                        </Badge>
                        <Badge variant={perm.can_create === 'allowed' ? 'default' : 'secondary'}>
                          Criar: {perm.can_create}
                        </Badge>
                        <Badge variant={perm.can_archive === 'allowed' ? 'default' : 'secondary'}>
                          Arquivar: {perm.can_archive}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Teste de Acesso</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={canAccessSimulator() ? 'default' : 'destructive'}>
                    Simulador: {canAccessSimulator() ? '✅ Acesso' : '❌ Negado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canAccessSimulatorConfig() ? 'default' : 'destructive'}>
                    Configurações: {canAccessSimulatorConfig() ? '✅ Acesso' : '❌ Negado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canAccessSimulatorModule() ? 'default' : 'destructive'}>
                    Módulo Simulador: {canAccessSimulatorModule() ? '✅ Acesso' : '❌ Negado'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Debug Info</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}</p>
                <p><strong>Error:</strong> {error ? 'Sim' : 'Não'}</p>
                <p><strong>Permissões carregadas:</strong> {userPermissions.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 