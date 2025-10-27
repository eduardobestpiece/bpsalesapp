import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, ImageIcon } from 'lucide-react';

export default function SettingsPerfil() {
  const { crmUser, updateCrmUserInContext, refreshCrmUser } = useCrmAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
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
    setAvatarPreview((crmUser as any).avatar_url || '');
  }, [crmUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Função para abrir modal de crop quando arquivo é selecionado
  const handleFileSelect = (file: File) => {
    if (!crmUser) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }
    
    setSelectedImageFile(file);
    setIsCropModalOpen(true);
  };

  // Função de upload após crop
  const handleUploadAvatar = async (croppedFile: File) => {
    if (!crmUser) {
      toast.error('Usuário não encontrado');
      return;
    }
    
    setIsUploadingAvatar(true);
    try {
      console.log('🔄 Iniciando upload do avatar...');
      console.log('📁 Arquivo:', croppedFile.name, 'Tamanho:', croppedFile.size, 'bytes');
      console.log('👤 Usuário ID:', crmUser.id);
      
      const ext = croppedFile.name.split('.').pop();
      const fileName = `${crmUser.id}/avatar_${Date.now()}.${ext}`;
      
      console.log('📝 Nome do arquivo:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, croppedFile);
        
      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Upload concluído com sucesso!');
      
      const { data: { publicUrl } } = await supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);
      
      console.log('🔗 URL pública:', publicUrl);

      // Atualizar preview local
      setAvatarPreview(publicUrl);
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast.success('Avatar enviado com sucesso!');
      
    } catch (error: any) {
      console.error('❌ Erro ao enviar avatar:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        code: error.code
      });
      toast.error('Erro ao enviar avatar: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsUploadingAvatar(false);
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

  const userInitials = `${(crmUser?.first_name?.[0] || 'U')}${(crmUser?.last_name?.[0] || '')}`;

  return (
    <div className="space-y-6">
      {/* Seção de Avatar */}
      <div className="space-y-4">
        <Label>Foto do Perfil</Label>
        <div className="flex items-center space-x-6">
          {/* Preview atual */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarPreview} alt="Avatar" />
            <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
          </Avatar>
          
          {/* Upload area - baseado no sistema de logos */}
          <div className="space-y-2">
            <Label>Nova foto de perfil</Label>
            <div
              className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
              style={{ minHeight: 120, aspectRatio: '1/1' }}
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  className="h-auto max-h-28 w-auto rounded-full object-cover" 
                  style={{ aspectRatio: '1/1' }}
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span>Clique para enviar</span>
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <Input 
              type="file" 
              accept="image/*" 
              ref={avatarInputRef} 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }} 
            />
          </div>
        </div>
      </div>

      {/* Campos do formulário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="first_name">Nome</Label>
          <Input 
            id="first_name" 
            value={formData.first_name} 
            onChange={(e) => handleInputChange('first_name', e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Sobrenome</Label>
          <Input 
            id="last_name" 
            value={formData.last_name} 
            onChange={(e) => handleInputChange('last_name', e.target.value)} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={formData.email} disabled />
        <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input 
          id="phone" 
          value={formData.phone} 
          onChange={(e) => handleInputChange('phone', e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">Data de Nascimento</Label>
        <Input 
          id="birth_date" 
          type="date" 
          value={formData.birth_date} 
          onChange={(e) => handleInputChange('birth_date', e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea 
          id="bio" 
          value={formData.bio} 
          onChange={(e) => handleInputChange('bio', e.target.value)} 
          rows={4} 
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          variant="brandPrimaryToSecondary" 
          className="brand-radius"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Save size={16} className="mr-2" />
          )}
          <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </Button>
      </div>

      {/* Modal de Crop */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedImageFile(null);
        }}
        onCropComplete={(croppedFile) => {
          setIsCropModalOpen(false);
          setSelectedImageFile(null);
          handleUploadAvatar(croppedFile);
        }}
        imageFile={selectedImageFile}
        isUploading={isUploadingAvatar}
      />
    </div>
  );
}
