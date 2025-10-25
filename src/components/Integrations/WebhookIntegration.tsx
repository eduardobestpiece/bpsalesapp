import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { useWebhookIntegrations } from '@/hooks/useIntegrations';
import { WebhookConfig } from '@/types/integrations';
import { toast } from 'sonner';

interface WebhookIntegrationProps {
  formId: string;
}

export function WebhookIntegration({ formId }: WebhookIntegrationProps) {
  const { webhooks, loading, addIntegration, updateIntegration, deleteIntegration, toggleIntegration } = useWebhookIntegrations(formId);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estado com persistência local para dados não salvos
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>(() => {
    const storageKey = `webhook-draft-${formId}`;
    return localStorage.getItem(storageKey) || '';
  });

  // Estado de edição por linha para evitar sobrescrever com string vazia
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});

  // Auto-save para dados não salvos
  useEffect(() => {
    const storageKey = `webhook-draft-${formId}`;
    if (newWebhookUrl) {
      localStorage.setItem(storageKey, newWebhookUrl);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [newWebhookUrl, formId]);

  // Restaurar estado ao carregar
  useEffect(() => {
    const storageKey = `webhook-draft-${formId}`;
    const savedUrl = localStorage.getItem(storageKey);
    if (savedUrl) {
      setNewWebhookUrl(savedUrl);
      setShowAddForm(true);
    }
  }, [formId]);

  const handleAddWebhook = async () => {
    if (!newWebhookUrl.trim()) {
      toast.error('URL do webhook é obrigatória');
      return;
    }

    try {
      const config: WebhookConfig = {
        url: newWebhookUrl.trim(),
        enabled: true
      };

      await addIntegration({
        form_id: formId,
        integration_type: 'webhook',
        webhook_url: config.url,
        is_active: true
      });

      setNewWebhookUrl('');
      setShowAddForm(false);
      // Limpar draft após salvar
      const storageKey = `webhook-draft-${formId}`;
      localStorage.removeItem(storageKey);
      toast.success('Webhook adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar webhook:', error);
      toast.error('Erro ao adicionar webhook');
    }
  };

  const handleUpdateWebhook = async (id: string, url: string) => {
    try {
      const webhook = webhooks.find(w => w.id === id);
      if (!webhook) return;

      await updateIntegration(id, {
        webhook_url: url
      });

      toast.success('Webhook atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      toast.error('Erro ao atualizar webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await deleteIntegration(id);
      toast.success('Webhook removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover webhook:', error);
      toast.error('Erro ao remover webhook');
    }
  };

  const handleToggleWebhook = async (id: string, enabled: boolean) => {
    try {
      const webhook = webhooks.find(w => w.id === id);
      if (!webhook) return;

      await updateIntegration(id, {
        is_active: enabled
      });

      toast.success(enabled ? 'Webhook ativado' : 'Webhook desativado');
    } catch (error) {
      console.error('Erro ao alterar status do webhook:', error);
      toast.error('Erro ao alterar status do webhook');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Carregando webhooks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhook</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks para receber dados do formulário
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Webhook
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">URL do Webhook</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://exemplo.com/webhook"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL para onde os dados do formulário serão enviados
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddWebhook} size="sm">
                  Adicionar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewWebhookUrl('');
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
        {webhooks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum webhook configurado</p>
            <p className="text-sm">Adicione um webhook para receber dados do formulário</p>
          </div>
        ) : (
          webhooks.map((webhook) => {
            const currentUrl = editUrls[webhook.id] ?? ((webhook as any).webhook_url || '');
            const config = {
              url: currentUrl,
              enabled: webhook.is_active
            };
            return (
              <Card key={webhook.id} className="border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Webhook #{webhook.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => handleToggleWebhook(webhook.id, enabled)}
                        className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`webhook-url-${webhook.id}`} className="text-xs">
                        URL do Webhook
                      </Label>
                      <Input
                        id={`webhook-url-${webhook.id}`}
                        type="url"
                        value={config.url}
                        onChange={(e) => setEditUrls(prev => ({ ...prev, [webhook.id]: e.target.value }))}
                        onBlur={(e) => handleUpdateWebhook(webhook.id, e.currentTarget.value.trim())}
                        className="mt-1"
                        disabled={!config.enabled}
                      />
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
