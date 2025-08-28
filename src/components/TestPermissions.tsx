import React from 'react';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const TestPermissions: React.FC = () => {
  const { crmUser, userRole } = useCrmAuth();
  const { 
    userPermissions, 
    canAccessSimulator, 
    canAccessSimulatorConfig, 
    canAccessSimulatorModule,
    isLoading 
  } = useUserPermissions();

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {crmUser?.first_name} {crmUser?.last_name}</p>
            <p><strong>Email:</strong> {crmUser?.email}</p>
            <p><strong>Role:</strong> <Badge variant="outline">{userRole}</Badge></p>
            <p><strong>Company ID:</strong> {crmUser?.company_id}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões Encontradas</CardTitle>
        </CardHeader>
        <CardContent>
          {userPermissions.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma permissão customizada encontrada</p>
          ) : (
            <div className="space-y-2">
              {userPermissions.map((perm, index) => (
                <div key={index} className="border rounded p-3">
                  <p><strong>Módulo:</strong> {perm.module_name}</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}; 