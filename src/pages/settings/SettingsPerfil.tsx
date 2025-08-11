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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Foto do Perfil</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AvatarUpload
                  currentAvatar={formData.avatar_url}
                  onAvatarChange={handleAvatarChange}
                  userId={crmUser?.id || ''}
                  userInitials={userInitials}
                />
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
                    <Button onClick={() => handleSave()} disabled={isSaving} className="brand-radius" variant="brandPrimaryToSecondary">
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nome</Label>
                      <Input id="first_name" value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Sobrenome</Label>
                      <Input id="last_name" value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} disabled className="brand-radius bg-muted text-foreground disabled:opacity-75" />
                    <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="(11) 99999-9999" className="brand-radius field-secondary-focus no-ring-focus" />
                    </div>
                    <div>
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e) => handleInputChange('birth_date', e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={4} value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} className="brand-radius field-secondary-focus no-ring-focus" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

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