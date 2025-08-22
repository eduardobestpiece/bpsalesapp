import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Save } from 'lucide-react';
import { AvatarCropper } from '@/components/CRM/AvatarCropper';

export default function SettingsPerfil() {
  const { crmUser, updateCrmUserInContext, refreshCrmUser } = useCrmAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
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
  }, [crmUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShowAvatarCropper(true);
    }
  };

  const handleAvatarCrop = async (croppedImageUrl: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      
      const fileName = `${user.id}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      setShowAvatarCropper(false);
      setSelectedImage(null);
      
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload do avatar');
    }
  };

  const handleSave = async () => {
    if (!crmUser) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('crm_users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          birth_date: formData.birth_date,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
        })
        .eq('id', crmUser.id);

      if (error) throw error;

      await updateCrmUserInContext();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(crmUser?.email || '', {
      redirectTo: `${window.location.origin}/configuracoes/perfil`,
    });

      if (error) throw error;

      toast.success('E-mail de redefinição enviado!');
    } catch (error) {
      toast.error('Erro ao enviar e-mail de redefinição');
    }
  };

  const userInitials = `${(crmUser?.first_name?.[0] || 'U')}${(crmUser?.last_name?.[0] || '')}`;

  return (
    <>
      {/* Cabeçalho */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
          </div>

        {/* Avatar Section */}
        <Card className="brand-radius">
          <CardHeader>
            <CardTitle className="text-foreground">Foto do Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={formData.avatar_url} alt="Avatar" />
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para alterar sua foto de perfil
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar-input')?.click()}
                    className="flex items-center space-x-2 brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]"
                  >
                    <Camera size={16} />
                    <span>Alterar Foto</span>
                  </Button>
                </div>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Informações Pessoais */}
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Seu nome"
                    className="brand-radius field-secondary-focus no-ring-focus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Seu sobrenome"
                    className="brand-radius field-secondary-focus no-ring-focus"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                  className="bg-muted brand-radius field-secondary-focus no-ring-focus"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado. Entre em contato com o suporte se necessário.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                  className="brand-radius field-secondary-focus no-ring-focus"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2 brand-radius"
                  variant="brandPrimaryToSecondary"
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </Button>
              </div>
            </div>

            {/* Segurança */}
            <div className="mt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Senha</h4>
                  <p className="text-sm text-muted-foreground">
                    Redefina sua senha para manter sua conta segura
                  </p>
                </div>
                <Button
                  onClick={handleResetPassword}
                  variant="outline"
                  className="brand-radius hover:bg-[var(--brand-secondary)] active:bg-[var(--brand-secondary)] focus:bg-[var(--brand-secondary)]"
                >
                  Redefinir Senha
                </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
      {/* Modal do Avatar Cropper */}
      {showAvatarCropper && selectedImage && (
        <AvatarCropper
          isOpen={showAvatarCropper}
          onClose={() => {
            setShowAvatarCropper(false);
            setSelectedImage(null);
          }}
          file={selectedImage}
          onCropComplete={handleAvatarCrop}
        />
      )}
    </>
  );
} 