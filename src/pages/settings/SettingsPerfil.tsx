import { useEffect, useState } from 'react';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/CRM/AvatarUpload';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalDataTab } from '@/components/CRM/Profile/PersonalDataTab';
import { IntegrationsTab } from '@/components/CRM/Profile/IntegrationsTab';

export default function SettingsPerfil() {
  const { crmUser, updateCrmUserInContext, refreshCrmUser } = useCrmAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: crmUser?.first_name || '',
    last_name: crmUser?.last_name || '',
    email: crmUser?.email || '',
    phone: crmUser?.phone || '',
    birth_date: crmUser?.birth_date || '',
    bio: crmUser?.bio || '',
    avatar_url: crmUser?.avatar_url || '',
  });

  useEffect(() => {
    // Sempre sincroniza dados ao entrar na página para evitar cache antigo
    refreshCrmUser();
  }, []);

  useEffect(() => {
    if (!crmUser) return;
    setFormData({
      first_name: crmUser.first_name || '',
      last_name: crmUser.last_name || '',
      email: crmUser.email || '',
      phone: crmUser.phone || '',
      birth_date: (crmUser as any).birth_date || '',
      bio: (crmUser as any).bio || '',
      avatar_url: (crmUser as any).avatar_url || '',
    });
  }, [crmUser?.first_name, crmUser?.last_name, crmUser?.email, crmUser?.phone, (crmUser as any)?.birth_date, (crmUser as any)?.bio, (crmUser as any)?.avatar_url]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
    handleSave(true);
  };

  const handleSave = async (avatarOnly = false) => {
    if (!crmUser) return;
    setIsSaving(true);
    try {
      
      const { error, status } = await supabase
        .from('crm_users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          birth_date: formData.birth_date || null,
          bio: formData.bio,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', crmUser.id);
      if (error && status !== 406) {
        
        toast.error('Erro ao atualizar perfil');
        return;
      }
      

      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: `${formData.first_name} ${formData.last_name}`.trim(),
          first_name: formData.first_name,
          last_name: formData.last_name,
        }
      });
      if (authErr) {
        
      }

      // Atualiza contexto e cache imediatamente com os valores do formulário
      updateCrmUserInContext({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        birth_date: formData.birth_date || null as any,
        bio: formData.bio,
        avatar_url: formData.avatar_url || null,
      });
      
      await refreshCrmUser();
      if (!avatarOnly) toast.success('Perfil atualizado com sucesso!');
    } catch (e) {
      
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!crmUser?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(crmUser.email, {
      redirectTo: `${window.location.origin}/configuracoes/perfil`,
    });
    if (error) {
      toast.error('Erro ao enviar email de redefinição');
      return;
    }
    toast.success('Email de redefinição de senha enviado com sucesso!');
  };

  const userInitials = crmUser
    ? `${crmUser.first_name.charAt(0)}${crmUser.last_name.charAt(0)}`
    : 'U';

  return (
    <SettingsLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
          </div>

          <Tabs defaultValue="dados" className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="dados">Dados pessoais</TabsTrigger>
              <TabsTrigger value="integracoes">Integrações</TabsTrigger>
            </TabsList>
            <TabsContent value="dados">
              <PersonalDataTab
                formData={formData}
                isSaving={isSaving}
                userInitials={userInitials}
                userId={crmUser?.id || ''}
                onInputChange={handleInputChange}
                onSave={() => handleSave()}
                onAvatarChange={handleAvatarChange}
              />
            </TabsContent>
            <TabsContent value="integracoes">
              <IntegrationsTab />
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Senha</h4>
                  <p className="text-sm text-muted-foreground">Redefina sua senha para manter sua conta segura</p>
                </div>
                <Button onClick={handleResetPassword} className="brand-radius" variant="brandOutlineSecondaryHover">Redefinir Senha</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
} 