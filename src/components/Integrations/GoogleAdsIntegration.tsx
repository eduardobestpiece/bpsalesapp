import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Search } from 'lucide-react';
import { useGoogleAdsIntegrations } from '@/hooks/useIntegrations';
import { GoogleAdsConfig } from '@/types/integrations';
import { toast } from 'sonner';

interface GoogleAdsIntegrationProps {
  formId: string;
}

export function GoogleAdsIntegration({ formId }: GoogleAdsIntegrationProps) {
  const { googleAds, loading, addIntegration, updateIntegration, deleteIntegration } = useGoogleAdsIntegrations(formId);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estado com persistência local para dados não salvos
  const [newConfig, setNewConfig] = useState<Partial<GoogleAdsConfig>>(() => {
    const storageKey = `google-ads-draft-${formId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          google_tag: '',
          conversion_tag: '',
          enabled: true
        };
      }
    }
    return {
      google_tag: '',
      conversion_tag: '',
      enabled: true
    };
  });

  // Auto-save para dados não salvos
  useEffect(() => {
    const storageKey = `google-ads-draft-${formId}`;
    const hasData = newConfig.google_tag || newConfig.conversion_tag;
    if (hasData) {
      localStorage.setItem(storageKey, JSON.stringify(newConfig));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [newConfig, formId]);

  // Restaurar estado ao carregar
  useEffect(() => {
    const storageKey = `google-ads-draft-${formId}`;
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

  const handleAddGoogleAds = async () => {
    if (!newConfig.google_tag?.trim() || !newConfig.conversion_tag?.trim()) {
      toast.error('Tag Google e Tag de Conversão são obrigatórias');
      return;
    }

    try {
      const config: GoogleAdsConfig = {
        google_tag: newConfig.google_tag.trim(),
        conversion_tag: newConfig.conversion_tag.trim(),
        enabled: true
      };

      await addIntegration({
        form_id: formId,
        integration_type: 'google_ads',
        google_ads_tag: config.google_tag,
        google_ads_event: config.conversion_tag,
        is_active: true
      });

      setNewConfig({
        google_tag: '',
        conversion_tag: '',
        enabled: true
      });
      setShowAddForm(false);
      // Limpar draft após salvar
      const storageKey = `google-ads-draft-${formId}`;
      localStorage.removeItem(storageKey);
      toast.success('Tag Google Ads adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar tag Google Ads:', error);
      toast.error('Erro ao adicionar tag Google Ads');
    }
  };

  const handleUpdateGoogleAds = async (id: string, updates: Partial<GoogleAdsConfig>) => {
    try {
      const googleAd = googleAds.find(g => g.id === id);
      if (!googleAd) return;

      const updateData: any = {};
      
      if (updates.google_tag !== undefined) updateData.google_ads_tag = updates.google_tag;
      if (updates.conversion_tag !== undefined) updateData.google_ads_event = updates.conversion_tag;
      if (updates.enabled !== undefined) updateData.is_active = updates.enabled;

      await updateIntegration(id, updateData);

      toast.success('Tag Google Ads atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar tag Google Ads:', error);
      toast.error('Erro ao atualizar tag Google Ads');
    }
  };

  const handleDeleteGoogleAds = async (id: string) => {
    try {
      await deleteIntegration(id);
      toast.success('Tag Google Ads removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover tag Google Ads:', error);
      toast.error('Erro ao remover tag Google Ads');
    }
  };

  const handleToggleGoogleAds = async (id: string, enabled: boolean) => {
    await handleUpdateGoogleAds(id, { enabled });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Carregando tags Google Ads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            Google Ads
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure tags do Google Ads para tracking de conversões
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Tag
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="google-tag">Tag Google</Label>
                  <Input
                    id="google-tag"
                    placeholder="ID da Tag do Google"
                    value={newConfig.google_tag}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, google_tag: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ID da tag do Google Ads
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
                    ID da tag de conversão do Google Ads
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddGoogleAds} size="sm">
                  Adicionar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewConfig({
                      google_tag: '',
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
        {googleAds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma tag Google Ads configurada</p>
            <p className="text-sm">Adicione uma tag para tracking de conversões</p>
          </div>
        ) : (
          googleAds.map((googleAd) => {
            const config = {
              google_tag: (googleAd as any).google_ads_tag || '',
              conversion_tag: (googleAd as any).google_ads_event || '',
              enabled: googleAd.is_active
            };
            return (
              <Card key={googleAd.id} className="border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Tag #{googleAd.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => handleToggleGoogleAds(googleAd.id, enabled)}
                        className="data-[state=checked]:bg-[var(--brand-primary,#E50F5E)]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoogleAds(googleAd.id)}
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
                        <Label className="text-xs">Tag Google</Label>
                        <Input
                          value={config.google_tag}
                          onChange={(e) => handleUpdateGoogleAds(googleAd.id, { google_tag: e.target.value })}
                          className="mt-1"
                          disabled={!config.enabled}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Tag da Conversão</Label>
                        <Input
                          value={config.conversion_tag}
                          onChange={(e) => handleUpdateGoogleAds(googleAd.id, { conversion_tag: e.target.value })}
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
