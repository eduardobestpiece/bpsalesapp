import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

export function IntegrationsTab() {
  const { user, crmUser } = useCrmAuth();
  const [googleConnected, setGoogleConnected] = useState(false);

  // Evolution API form state
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [instanceKey, setInstanceKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Detect Google connection via identities
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const identities = (data?.user as any)?.identities || [];
      const hasGoogle = identities.some((i: any) => i.provider === 'google');
      setGoogleConnected(!!hasGoogle);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [user?.id]);

  // Load Evolution connection
  useEffect(() => {
    const load = async () => {
      if (!crmUser?.email) return;
      const { data, error } = await (supabase as any)
        .from('evolution_connections')
        .select('*')
        .eq('owner_email', crmUser.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        setName(data.name || '');
        setBaseUrl(data.base_url || '');
        setInstanceName(data.instance_name || '');
        setInstanceKey(data.instance_key || '');
      }
    };
    load();
  }, [crmUser?.email]);

  const connectGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: `${window.location.origin}/configuracoes/perfil?google_callback=1`,
        },
      } as any);
      if (error) {
        toast.error('Erro ao iniciar conexão com Google');
        return;
      }
      // O fluxo redirecionará; ao voltar, detectaremos identities e atualizaremos o status
    } catch (e) {
      toast.error('Erro ao iniciar conexão com Google');
    }
  };

  const saveEvolution = async () => {
    if (!crmUser?.email) return;
    if (!name || !baseUrl || !instanceName || !instanceKey) {
      toast.error('Preencha todos os campos da Evolution API');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        owner_email: crmUser.email,
        name,
        base_url: baseUrl,
        instance_name: instanceName,
        instance_key: instanceKey,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from('evolution_connections')
        .upsert(payload)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      toast.success('Configuração da Evolution salva!');
    } catch (e) {
      toast.error('Erro ao salvar configuração da Evolution');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Google (Calendário, Gmail e Agenda)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecte sua conta Google para autorizar acesso ao Calendário e Gmail.
          </p>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              Status: <span className={googleConnected ? 'text-green-600' : 'text-muted-foreground'}>
                {googleConnected ? 'Conectado' : 'Não conectado'}
              </span>
            </div>
            <Button onClick={connectGoogle} className="brand-radius" variant="brandOutlineSecondaryHover">
              {googleConnected ? 'Reconectar Google' : 'Conectar Google'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Evolution API (WhatsApp)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Nome da Conexão</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
            </div>
            <div>
              <Label>Domínio (URL Evolution API)</Label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://seu-dominio.com" className="brand-radius field-secondary-focus no-ring-focus" />
            </div>
            <div>
              <Label>Nome da Instância</Label>
              <Input value={instanceName} onChange={(e) => setInstanceName(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
            </div>
            <div>
              <Label>Chave da Instância</Label>
              <Input value={instanceKey} onChange={(e) => setInstanceKey(e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveEvolution} disabled={saving} className="brand-radius" variant="brandPrimaryToSecondary">
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
