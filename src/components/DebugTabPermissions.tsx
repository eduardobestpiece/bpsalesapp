import React from 'react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const DebugTabPermissions: React.FC = () => {
  const { userRole, companyId } = useCrmAuth();
  const queryClient = useQueryClient();

  // Query para buscar permissões das abas
  const { data: perms = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['role_page_permissions', companyId, userRole],
    enabled: !!companyId && !!userRole,
    queryFn: async () => {
      console.log('[DEBUG] Buscando permissões das abas...');
      console.log('[DEBUG] companyId:', companyId);
      console.log('[DEBUG] userRole:', userRole);
      
      const { data, error } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', companyId as string)
        .eq('role', userRole as any);
      
      console.log('[DEBUG] Resultado da query:', data);
      console.log('[DEBUG] Erro da query:', error);
      
      if (error) {
        console.error('[DEBUG] Erro ao buscar permissões:', error);
        throw error;
      }
      
      const map: Record<string, boolean> = {};
      data?.forEach((r: any) => { 
        map[r.page] = r.allowed;
        console.log(`[DEBUG] Permissão: ${r.page} = ${r.allowed}`);
      });
      
      console.log('[DEBUG] Mapa final de permissões:', map);
      return map;
    }
  });

  // Verificar permissões específicas das abas
  const canAdmins = perms['simulator_config_administrators'] !== false;
  const canReductions = perms['simulator_config_reductions'] !== false;
  const canInstallments = perms['simulator_config_installments'] !== false;
  const canProducts = perms['simulator_config_products'] !== false;
  const canLeverages = perms['simulator_config_leverages'] !== false;

  // Controla a aba ativa: escolhe a primeira permitida
  const allowedOrder: { key: string; allowed: boolean }[] = [
    { key: 'administrators', allowed: canAdmins },
    { key: 'reductions', allowed: canReductions },
    { key: 'installments', allowed: canInstallments },
    { key: 'products', allowed: canProducts },
    { key: 'leverages', allowed: canLeverages },
  ];
  
  const firstAllowed = allowedOrder.find(i => i.allowed)?.key;

  const handleClearCache = () => {
    console.log('[DEBUG] Limpando cache do React Query...');
    queryClient.clear();
    console.log('[DEBUG] Cache limpo. Recarregando dados...');
    refetch();
  };

  const handleRefetch = () => {
    console.log('[DEBUG] Recarregando dados...');
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-center mt-2">Carregando permissões das abas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar permissões das abas: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug - Permissões das Abas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={handleRefetch} variant="outline">
              Recarregar Dados
            </Button>
            <Button onClick={handleClearCache} variant="destructive">
              Limpar Cache
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Informações do Usuário</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Role:</strong> <Badge variant="outline">{userRole}</Badge></p>
                <p><strong>Company ID:</strong> {companyId}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Permissões das Abas</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={canAdmins ? 'default' : 'destructive'}>
                    Administradoras: {canAdmins ? '✅ Permitido' : '❌ Negado'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (simulator_config_administrators: {perms['simulator_config_administrators'] ? 'true' : 'false'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canReductions ? 'default' : 'destructive'}>
                    Reduções: {canReductions ? '✅ Permitido' : '❌ Negado'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (simulator_config_reductions: {perms['simulator_config_reductions'] ? 'true' : 'false'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canInstallments ? 'default' : 'destructive'}>
                    Parcelas: {canInstallments ? '✅ Permitido' : '❌ Negado'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (simulator_config_installments: {perms['simulator_config_installments'] ? 'true' : 'false'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canProducts ? 'default' : 'destructive'}>
                    Produtos: {canProducts ? '✅ Permitido' : '❌ Negado'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (simulator_config_products: {perms['simulator_config_products'] ? 'true' : 'false'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canLeverages ? 'default' : 'destructive'}>
                    Alavancas: {canLeverages ? '✅ Permitido' : '❌ Negado'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (simulator_config_leverages: {perms['simulator_config_leverages'] ? 'true' : 'false'})
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Lógica de Abas</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Primeira aba permitida:</strong> {firstAllowed || 'Nenhuma'}</p>
                <p><strong>Total de abas permitidas:</strong> {allowedOrder.filter(i => i.allowed).length}</p>
                <p><strong>Abas permitidas:</strong> {allowedOrder.filter(i => i.allowed).map(i => i.key).join(', ') || 'Nenhuma'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Todas as Permissões</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(perms).map(([page, allowed]) => (
                  <div key={page} className="flex items-center gap-2">
                    <span className="font-mono text-xs">{page}:</span>
                    <Badge variant={allowed ? 'default' : 'secondary'}>
                      {allowed ? 'true' : 'false'}
                    </Badge>
                  </div>
                ))}
                {Object.keys(perms).length === 0 && (
                  <p className="text-muted-foreground">Nenhuma permissão encontrada</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 