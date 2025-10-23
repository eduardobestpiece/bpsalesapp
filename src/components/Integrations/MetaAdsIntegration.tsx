import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Facebook } from 'lucide-react';
import { useMetaAdsIntegrations } from '@/hooks/useIntegrations';
import { MetaAdsConfig, FacebookEventType } from '@/types/integrations';
import { toast } from 'sonner';

interface MetaAdsIntegrationProps {
  formId: string;
}

const FACEBOOK_EVENTS: { value: FacebookEventType; label: string }[] = [
  { value: 'Lead', label: 'Lead' },
  { value: 'CompleteRegistration', label: 'Complete Registration' },
  { value: 'Purchase', label: 'Purchase' },
  { value: 'AddToCart', label: 'Add to Cart' },
  { value: 'InitiateCheckout', label: 'Initiate Checkout' },
  { value: 'ViewContent', label: 'View Content' },
  { value: 'Search', label: 'Search' },
  { value: 'AddToWishlist', label: 'Add to Wishlist' },
  { value: 'Contact', label: 'Contact' },
  { value: 'CustomizeProduct', label: 'Customize Product' },
  { value: 'Donate', label: 'Donate' },
  { value: 'FindLocation', label: 'Find Location' },
  { value: 'Schedule', label: 'Schedule' },
  { value: 'StartTrial', label: 'Start Trial' },
  { value: 'SubmitApplication', label: 'Submit Application' },
  { value: 'Subscribe', label: 'Subscribe' },
  { value: 'Custom', label: 'Personalizado (Custom Event)' }
];

export function MetaAdsIntegration({ formId }: MetaAdsIntegrationProps) {
  const { metaAds, loading, addIntegration, updateIntegration, deleteIntegration } = useMetaAdsIntegrations(formId);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estado com persistência local para dados não salvos
  const [newConfig, setNewConfig] = useState<Partial<MetaAdsConfig>>(() => {
    const storageKey = `meta-ads-draft-${formId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          pixel_code: '',
          api_token: '',
          event_type: 'Lead',
          custom_event_name: '',
          test_code: '',
          enabled: true
        };
      }
    }
    return {
      pixel_code: '',
      api_token: '',
      event_type: 'Lead',
      custom_event_name: '',
      test_code: '',
      enabled: true
    };
  });

  // Auto-save para dados não salvos
  useEffect(() => {
    const storageKey = `meta-ads-draft-${formId}`;
    const hasData = newConfig.pixel_code || newConfig.api_token || newConfig.test_code;
    if (hasData) {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [newConfig, formId]);

  // Restaurar estado ao carregar
  useEffect(() => {
    const storageKey = `meta-ads-draft-${formId}`;
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

  const handleAddMetaAds = async () => {
    if (!newConfig.pixel_code?.trim() || !newConfig.api_token?.trim()) {
      toast.error('Código do Pixel e Token API são obrigatórios');
      return;
    }

    // Validação: Evento Custom requer Nome do Evento Personalizado
    if ((newConfig.event_type === 'Custom') && !newConfig.custom_event_name?.trim()) {
      toast.error('Informe o Nome do Evento Personalizado para usar evento Custom');
      return;
    }

    try {
      const config: MetaAdsConfig = {
        pixel_code: newConfig.pixel_code.trim(),
        api_token: newConfig.api_token.trim(),
        event_type: newConfig.event_type || 'Lead',
        custom_event_name: newConfig.custom_event_name?.trim(),
        test_code: newConfig.test_code?.trim() || '',
        enabled: true
      };

      await addIntegration({
        form_id: formId,
        integration_type: 'meta_ads',
        meta_pixel_id: config.pixel_code,
        meta_pixel_token: config.api_token,
        meta_pixel_event: config.event_type,
        meta_capi_test: config.test_code,
        meta_event_name: config.custom_event_name || null,
        is_active: true
      });

      setNewConfig({
        pixel_code: '',
        api_token: '',
        event_type: 'Lead',
        custom_event_name: '',
        test_code: '',
        enabled: true
      });
      setShowAddForm(false);
      // Limpar draft após salvar
      const storageKey = `meta-ads-draft-${formId}`;
      localStorage.removeItem(storageKey);
      toast.success('Pixel Meta Ads adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar pixel Meta Ads:', error);
      toast.error('Erro ao adicionar pixel Meta Ads');
    }
  };

  const handleUpdateMetaAds = async (id: string, updates: Partial<MetaAdsConfig>) => {
    try {
      const metaAd = metaAds.find(m => m.id === id);
      if (!metaAd) return;

      const updateData: any = {};
      
      if (updates.pixel_code !== undefined) updateData.meta_pixel_id = updates.pixel_code;
      if (updates.api_token !== undefined) updateData.meta_pixel_token = updates.api_token;
      if (updates.event_type !== undefined) updateData.meta_pixel_event = updates.event_type;
      if ((updates as any).custom_event_name !== undefined) updateData.meta_event_name = (updates as any).custom_event_name;
      if (updates.test_code !== undefined) updateData.meta_capi_test = updates.test_code;
      if (updates.enabled !== undefined) updateData.is_active = updates.enabled;

      await updateIntegration(id, updateData);

      toast.success('Pixel Meta Ads atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar pixel Meta Ads:', error);
      toast.error('Erro ao atualizar pixel Meta Ads');
    }
  };

  const handleDeleteMetaAds = async (id: string) => {
    try {
      await deleteIntegration(id);
      toast.success('Pixel Meta Ads removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover pixel Meta Ads:', error);
      toast.error('Erro ao remover pixel Meta Ads');
    }
  };

  const handleToggleMetaAds = async (id: string, enabled: boolean) => {
    const metaAd = metaAds.find(m => m.id === id) as any;
    if (!metaAd) return;
    const isCustom = (metaAd?.meta_pixel_event === 'Custom');
    const hasCustomName = !!(metaAd?.meta_event_name && String(metaAd.meta_event_name).trim());
    if (enabled && isCustom && !hasCustomName) {
      toast.error('Defina o Nome do Evento Personalizado antes de ativar quando Evento = Custom');
      return;
    }
    await handleUpdateMetaAds(id, { enabled });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Carregando pixels Meta Ads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Meta Ads
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure pixels do Facebook/Meta para tracking de conversões
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Pixel
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pixel-code">Código Pixel</Label>
                  <Input
                    id="pixel-code"
                    placeholder="ID do Pixel do Meta"
                    value={newConfig.pixel_code}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, pixel_code: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="api-token">Token API</Label>
                  <Input
                    id="api-token"
                    placeholder="Token do Pixel API"
                    value={newConfig.api_token}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, api_token: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-type">Evento</Label>
                  <Select
                    value={newConfig.event_type}
                    onValueChange={(value) => setNewConfig(prev => ({ ...prev, event_type: value as FacebookEventType }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACEBOOK_EVENTS.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {newConfig.event_type === 'Custom' && (
                  <div>
                    <Label htmlFor="custom-event-name">Nome do Evento Personalizado</Label>
                    <Input
                      id="custom-event-name"
                      placeholder="Ex.: LeadQualificado, OrcamentoEnviado"
                      value={newConfig.custom_event_name || ''}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, custom_event_name: e.target.value }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use nomes seguindo o padrão do Meta (camelCase ou PascalCase). Evite espaços e caracteres especiais.
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="test-code">Código de Teste (Opcional)</Label>
                  <Input
                    id="test-code"
                    placeholder="Código de teste do pixel"
                    value={newConfig.test_code}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, test_code: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleAddMetaAds} 
                  size="sm"
                  disabled={!newConfig.pixel_code?.trim() || !newConfig.api_token?.trim() || (newConfig.event_type === 'Custom' && !newConfig.custom_event_name?.trim())}
                >
                  Adicionar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewConfig({
                      pixel_code: '',
                      api_token: '',
                      event_type: 'Lead',
                      test_code: '',
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
        {metaAds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Facebook className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum pixel Meta Ads configurado</p>
            <p className="text-sm">Adicione um pixel para tracking de conversões</p>
          </div>
        ) : (
          metaAds.map((metaAd) => {
            const config = {
              pixel_code: (metaAd as any).meta_pixel_id || '',
              api_token: (metaAd as any).meta_pixel_token || '',
              event_type: (metaAd as any).meta_pixel_event || 'Lead',
              custom_event_name: (metaAd as any).meta_event_name || '',
              test_code: (metaAd as any).meta_capi_test || '',
              enabled: metaAd.is_active
            };
            return (
              <Card key={metaAd.id} className="border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Pixel #{metaAd.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => handleToggleMetaAds(metaAd.id, enabled)}
                        className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMetaAds(metaAd.id)}
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
                        <Label className="text-xs">Código Pixel</Label>
                        <Input
                          value={config.pixel_code}
                          onChange={(e) => handleUpdateMetaAds(metaAd.id, { pixel_code: e.target.value })}
                          className="mt-1"
                          disabled={!config.enabled}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Token API</Label>
                        <Input
                          value={config.api_token}
                          onChange={(e) => handleUpdateMetaAds(metaAd.id, { api_token: e.target.value })}
                          className="mt-1"
                          disabled={!config.enabled}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Evento</Label>
                        <Select
                          value={config.event_type}
                          onValueChange={(value) => handleUpdateMetaAds(metaAd.id, { event_type: value as FacebookEventType })}
                          disabled={!config.enabled}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FACEBOOK_EVENTS.map((event) => (
                              <SelectItem key={event.value} value={event.value}>
                                {event.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {config.event_type === 'Custom' && (
                        <div>
                          <Label className="text-xs">Nome do Evento Personalizado</Label>
                          <Input
                            value={config.custom_event_name}
                            onChange={(e) => handleUpdateMetaAds(metaAd.id, { custom_event_name: e.target.value } as any)}
                            className="mt-1"
                            disabled={!config.enabled}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Utilize nomes válidos segundo o Meta (ex.: QualifiedLead). Evite espaços.
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Código de Teste</Label>
                        <Input
                          value={config.test_code}
                          onChange={(e) => handleUpdateMetaAds(metaAd.id, { test_code: e.target.value })}
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
