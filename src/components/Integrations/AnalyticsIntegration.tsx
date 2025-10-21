import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, BarChart3 } from 'lucide-react';
import { useAnalyticsIntegrations } from '@/hooks/useIntegrations';
import { AnalyticsConfig } from '@/types/integrations';
import { toast } from 'sonner';

interface AnalyticsIntegrationProps {
  formId: string;
}

export function AnalyticsIntegration({ formId }: AnalyticsIntegrationProps) {
  const { analytics, loading, addIntegration, updateIntegration, deleteIntegration } = useAnalyticsIntegrations(formId);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estado com persistência local para dados não salvos
  const [newConfig, setNewConfig] = useState<Partial<AnalyticsConfig>>(() => {
    const storageKey = `analytics-draft-${formId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          analytics_tag: '',
          conversion_tag: '',
          enabled: true
        };
      }
    }
    return {
      analytics_tag: '',
      conversion_tag: '',
      enabled: true
    };
  });

  // Auto-save para dados não salvos
  useEffect(() => {
    const storageKey = `analytics-draft-${formId}`;
    const hasData = newConfig.analytics_tag || newConfig.conversion_tag;
    if (hasData) {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [newConfig, formId]);

  // Restaurar estado ao carregar
  useEffect(() => {
    const storageKey = `analytics-draft-${formId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNewConfig(parsed);
        setShowAddForm(true);
      } catch {
        // Ignorar erro de parsing
      }
    }
  }, [formId]);

  const handleAddAnalytics = async () => {
    if (!newConfig.analytics_tag?.trim() || !newConfig.conversion_tag?.trim()) {
      toast.error('Tag Google Analytics e Tag de Conversão são obrigatórias');
      return;
    }

    try {
      const config: AnalyticsConfig = {
        analytics_tag: newConfig.analytics_tag.trim(),
        conversion_tag: newConfig.conversion_tag.trim(),
        enabled: true
      };

      await addIntegration({
        form_id: formId,
        integration_type: 'analytics',
        google_analytics_tag: config.analytics_tag,
        google_analytics_event: config.conversion_tag,
        is_active: true
      });

      setNewConfig({
        analytics_tag: '',
        conversion_tag: '',
        enabled: true
      });
      setShowAddForm(false);
      // Limpar draft após salvar
      const storageKey = `analytics-draft-${formId}`;
      localStorage.removeItem(storageKey);
      toast.success('Tag Google Analytics adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar tag Google Analytics:', error);
      toast.error('Erro ao adicionar tag Google Analytics');
    }
  };

  const handleUpdateAnalytics = async (id: string, updates: Partial<AnalyticsConfig>) => {
    try {
      const analytic = analytics.find(a => a.id === id);
      if (!analytic) return;

      const updateData: any = {};
      
      if (updates.analytics_tag !== undefined) updateData.google_analytics_tag = updates.analytics_tag;
      if (updates.conversion_tag !== undefined) updateData.google_analytics_event = updates.conversion_tag;
      if (updates.enabled !== undefined) updateData.is_active = updates.enabled;

      await updateIntegration(id, updateData);

      toast.success('Tag Google Analytics atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar tag Google Analytics:', error);
      toast.error('Erro ao atualizar tag Google Analytics');
    }
  };

  const handleDeleteAnalytics = async (id: string) => {
    try {
      await deleteIntegration(id);
      toast.success('Tag Google Analytics removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover tag Google Analytics:', error);
      toast.error('Erro ao remover tag Google Analytics');
    }
  };

  const handleToggleAnalytics = async (id: string, enabled: boolean) => {
    await handleUpdateAnalytics(id, { enabled });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Carregando tags Google Analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure tags do Google Analytics para tracking de conversões
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Analytics
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="analytics-tag">Tag Google Analytics</Label>
                  <Input
                    id="analytics-tag"
                    placeholder="ID do Google Analytics"
                    value={newConfig.analytics_tag}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, analytics_tag: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID da tag do Google Analytics (GA4)
                  </p>
                </div>
                <div>
                  <Label htmlFor="conversion-tag">Tag da Conversão</Label>
                  <Input
                    id="conversion-tag"
                    placeholder="ID da Tag de Conversão"
                    value={newConfig.conversion_tag}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, conversion_tag: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID da tag de conversão do Google Analytics
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddAnalytics} size="sm">
                  Adicionar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewConfig({
                      analytics_tag: '',
                      conversion_tag: '',
                      enabled: true
                    });
                  }}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {analytics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma tag Google Analytics configurada</p>
            <p className="text-sm">Adicione uma tag para tracking de conversões</p>
          </div>
        ) : (
          analytics.map((analytic) => {
            const config = {
              analytics_tag: (analytic as any).google_analytics_tag || '',
              conversion_tag: (analytic as any).google_analytics_event || '',
              enabled: analytic.is_active
            };
            return (
              <Card key={analytic.id} className="border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Analytics #{analytic.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => handleToggleAnalytics(analytic.id, enabled)}
                        className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAnalytics(analytic.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Tag Google Analytics</Label>
                        <Input
                          value={config.analytics_tag}
                          onChange={(e) => handleUpdateAnalytics(analytic.id, { analytics_tag: e.target.value })}
                          className="mt-1"
                          disabled={!config.enabled}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tag da Conversão</Label>
                        <Input
                          value={config.conversion_tag}
                          onChange={(e) => handleUpdateAnalytics(analytic.id, { conversion_tag: e.target.value })}
                          className="mt-1"
                          disabled={!config.enabled}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {config.enabled ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
