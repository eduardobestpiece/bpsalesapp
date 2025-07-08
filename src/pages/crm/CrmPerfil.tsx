
import { useState } from 'react';
import { CrmHeader } from '@/components/Layout/CrmHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from '@/components/CRM/AvatarUpload';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CrmPerfil = () => {
  const { crmUser } = useCrmAuth();
  const [isEditing, setIsEditing] = useState(false);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (avatarUrl: string) => {
    setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
    // Auto-save avatar changes
    handleSave(true);
  };

  const handleSave = async (avatarOnly = false) => {
    if (!crmUser) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
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

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Erro ao atualizar perfil');
        return;
      }

      if (!avatarOnly) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!crmUser?.email) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(crmUser.email, {
        redirectTo: `${window.location.origin}/crm/perfil`,
      });

      if (error) {
        console.error('Error sending reset email:', error);
        toast.error('Erro ao enviar email de redefinição');
        return;
      }

      toast.success('Email de redefinição de senha enviado com sucesso!');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Erro ao enviar email de redefinição');
    }
  };

  const userInitials = crmUser 
    ? `${crmUser.first_name.charAt(0)}${crmUser.last_name.charAt(0)}`
    : 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/20 via-white to-muted/10">
      <CrmHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-1">
            <div className="bg-white rounded-[calc(1.5rem-4px)] p-8 shadow-sm min-h-[600px]">
              
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-bold">Meu Perfil</h2>
                <p className="text-muted-foreground">
                  Gerencie suas informações pessoais e configurações
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Foto do Perfil</CardTitle>
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

                {/* Profile Information */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Informações Pessoais</CardTitle>
                        <Button
                          variant={isEditing ? "default" : "outline"}
                          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Salvando...' : isEditing ? 'Salvar' : 'Editar'}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">Nome</Label>
                          <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            disabled={!isEditing || isSaving}
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Sobrenome</Label>
                          <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            disabled={!isEditing || isSaving}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled={true}
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          O email não pode ser alterado
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={!isEditing || isSaving}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div>
                          <Label htmlFor="birth_date">Data de Nascimento</Label>
                          <Input
                            id="birth_date"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => handleInputChange('birth_date', e.target.value)}
                            disabled={!isEditing || isSaving}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          disabled={!isEditing || isSaving}
                          placeholder="Conte um pouco sobre você..."
                          rows={4}
                        />
                      </div>

                      {isEditing && (
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            onClick={() => handleSave()}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Security Section */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Senha</h4>
                      <p className="text-sm text-muted-foreground">
                        Redefina sua senha para manter sua conta segura
                      </p>
                    </div>
                    <Button onClick={handleResetPassword}>
                      Redefinir Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CrmPerfil;
