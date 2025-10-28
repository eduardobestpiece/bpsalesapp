import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, ImageIcon, Lock, Eye, EyeOff } from 'lucide-react';

export default function SettingsPerfil() {
  const { crmUser, updateCrmUserInContext, refreshCrmUser } = useCrmAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para mudança de senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
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
    console.log('🔄 [PERFIL] useEffect executado, crmUser:', crmUser);
    
    if (!crmUser) {
      console.log('⚠️ [PERFIL] crmUser não existe, retornando...');
      return;
    }
    
    console.log('✅ [PERFIL] crmUser existe, configurando formData...');
    const newFormData = {
      first_name: crmUser.first_name || '',
      last_name: crmUser.last_name || '',
      email: crmUser.email || '',
      phone: crmUser.phone || '',
      birth_date: (crmUser as any).birth_date || '',
      bio: (crmUser as any).bio || '',
      avatar_url: (crmUser as any).avatar_url || '',
    };
    
    console.log('📝 [PERFIL] Novo formData:', newFormData);
    console.log('📝 [PERFIL] birth_date detalhes:', {
      original: (crmUser as any).birth_date,
      processed: newFormData.birth_date,
      type: typeof newFormData.birth_date
    });
    
    setFormData(newFormData);
    setAvatarPreview((crmUser as any).avatar_url || '');
  }, [crmUser]);

  const handleInputChange = (field: string, value: string) => {
    console.log('📝 [PERFIL] handleInputChange chamado:', { field, value });
    console.log('📝 [PERFIL] formData antes da mudança:', formData);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📝 [PERFIL] formData após mudança:', newData);
      return newData;
    });
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
    console.log('🔵 [PERFIL] Iniciando handleSave...');
    console.log('🔵 [PERFIL] crmUser:', crmUser);
    console.log('🔵 [PERFIL] formData atual:', formData);
    
    if (!crmUser) {
      console.log('❌ [PERFIL] Erro: crmUser não existe');
      return;
    }
    
    setIsSaving(true);
    try {
      // Preparar dados para atualização, removendo campos vazios
      const updateData: any = {};
      
      console.log('🔵 [PERFIL] Preparando dados para atualização...');
      
      // Campos obrigatórios que sempre existem (excluindo email que não pode ser alterado)
      if (formData.first_name?.trim()) {
        updateData.first_name = formData.first_name.trim();
        console.log('✅ [PERFIL] Adicionando first_name:', updateData.first_name);
      }
      if (formData.last_name?.trim()) {
        updateData.last_name = formData.last_name.trim();
        console.log('✅ [PERFIL] Adicionando last_name:', updateData.last_name);
      }
      if (formData.phone?.trim()) {
        updateData.phone = formData.phone.trim();
        console.log('✅ [PERFIL] Adicionando phone:', updateData.phone);
      }
      
      // Campos opcionais - só incluir se existirem valores válidos
      // IMPORTANTE: birth_date deve ser null ou uma data válida, NUNCA string vazia
      console.log('🔵 [PERFIL] Verificando birth_date:', {
        value: formData.birth_date,
        type: typeof formData.birth_date,
        isEmpty: formData.birth_date === '',
        isNull: formData.birth_date === null,
        isUndefined: formData.birth_date === undefined
      });
      
      if (formData.birth_date && typeof formData.birth_date === 'string' && formData.birth_date.trim() !== '') {
        updateData.birth_date = formData.birth_date.trim();
        console.log('✅ [PERFIL] Adicionando birth_date:', updateData.birth_date);
      } else {
        console.log('⏭️ [PERFIL] Pulando birth_date (vazio ou inválido)');
      }
      
      if (formData.bio?.trim()) {
        updateData.bio = formData.bio.trim();
        console.log('✅ [PERFIL] Adicionando bio:', updateData.bio);
      }
      if (formData.avatar_url?.trim()) {
        updateData.avatar_url = formData.avatar_url.trim();
        console.log('✅ [PERFIL] Adicionando avatar_url:', updateData.avatar_url);
      }
      
      // Garantir que campos sensíveis não sejam incluídos na atualização
      delete updateData.email;
      delete updateData.password_hash;
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.role;
      delete updateData.company_id;
      delete updateData.team_id;
      delete updateData.leader_id;
      delete updateData.status;
      delete updateData.funnels;
      delete updateData.user_id;
      delete updateData.cpf;
      delete updateData.avatar_base64;
      delete updateData.updated_at;

      console.log('🔵 [PERFIL] Dados finais para atualização:', updateData);
      console.log('🔵 [PERFIL] ID do usuário:', crmUser.id);
      console.log('🔵 [PERFIL] Quantidade de campos para atualizar:', Object.keys(updateData).length);

      // Verificar se há dados para atualizar
      if (Object.keys(updateData).length === 0) {
        console.log('⚠️ [PERFIL] Nenhuma alteração detectada, cancelando atualização');
        toast.info('Nenhuma alteração detectada');
        return;
      }

      console.log('🚀 [PERFIL] Enviando requisição para Supabase...');
      console.log('🚀 [PERFIL] URL:', 'https://hpjqetugksblfiojwhzh.supabase.co/rest/v1/crm_users');
      console.log('🚀 [PERFIL] Método: PATCH');
      console.log('🚀 [PERFIL] Payload:', JSON.stringify(updateData, null, 2));

      const { data, error } = await supabase
        .from('crm_users')
        .update(updateData)
        .eq('id', crmUser.id)
        .select();

      console.log('📥 [PERFIL] Resposta do Supabase:');
      console.log('📥 [PERFIL] Data:', data);
      console.log('📥 [PERFIL] Error:', error);

      if (error) {
        console.log('❌ [PERFIL] Erro na atualização:');
        console.log('❌ [PERFIL] Error object:', error);
        console.log('❌ [PERFIL] Error message:', error.message);
        console.log('❌ [PERFIL] Error code:', error.code);
        console.log('❌ [PERFIL] Error details:', error.details);
        console.log('❌ [PERFIL] Error hint:', error.hint);
        console.log('❌ [PERFIL] Dados que causaram erro:', updateData);
        
        // Se o erro for relacionado a campos que não existem, tentar sem eles
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          console.log('🔄 [PERFIL] Tentando atualização sem campos opcionais...');
          
          // Remover campos opcionais e tentar novamente
          const safeUpdateData: any = {};
          if (formData.first_name?.trim()) safeUpdateData.first_name = formData.first_name.trim();
          if (formData.last_name?.trim()) safeUpdateData.last_name = formData.last_name.trim();
          if (formData.phone?.trim()) safeUpdateData.phone = formData.phone.trim();
          
          console.log('🔄 [PERFIL] Dados seguros para retry:', safeUpdateData);
          
          const { error: retryError } = await supabase
            .from('crm_users')
            .update(safeUpdateData)
            .eq('id', crmUser.id);
            
          if (retryError) {
            console.log('❌ [PERFIL] Erro no retry:', retryError);
            throw retryError;
          }
          
          console.log('✅ [PERFIL] Retry bem-sucedido!');
          toast.success('Perfil atualizado com sucesso! (Alguns campos não foram salvos)');
        } else {
          console.log('❌ [PERFIL] Erro não tratável, lançando exceção');
          throw error;
        }
      } else {
        console.log('✅ [PERFIL] Atualização bem-sucedida!');
        console.log('✅ [PERFIL] Dados retornados:', data);
        console.log('🔄 [PERFIL] Atualizando contexto...');
        
        await updateCrmUserInContext();
        console.log('✅ [PERFIL] Contexto atualizado');
        console.log('🔄 [PERFIL] Forçando refresh do contexto...');
        
        // Forçar refresh do contexto para garantir que os dados sejam atualizados
        await refreshCrmUser();
        console.log('✅ [PERFIL] Refresh do contexto concluído');
        console.log('✅ [PERFIL] Dados do usuário após atualização:', crmUser);
        
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      console.log('💥 [PERFIL] Erro capturado no catch:');
      console.log('💥 [PERFIL] Error object:', error);
      console.log('💥 [PERFIL] Error message:', error?.message);
      console.log('💥 [PERFIL] Error stack:', error?.stack);
      console.log('💥 [PERFIL] Error type:', typeof error);
      
      toast.error('Erro ao atualizar perfil: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      console.log('🏁 [PERFIL] Finalizando handleSave, setIsSaving(false)');
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      // Limpar campos de senha
      setPasswordData({
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitials = `${(crmUser?.first_name?.[0] || 'U')}${(crmUser?.last_name?.[0] || '')}`;

  return (
    <div className="space-y-6">
      {/* Seção de Avatar */}
      <div className="space-y-4">
        <div className="flex items-center space-x-6">
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

      {/* Separador */}
      <Separator className="my-8" />

      {/* Seção de Mudança de Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Digite uma nova senha para sua conta. A senha deve ter pelo menos 6 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordData.newPassword} 
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Digite sua nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={passwordData.confirmPassword} 
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme sua nova senha"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword} 
                variant="brandPrimaryToSecondary" 
                className="brand-radius"
              >
                {isChangingPassword ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Lock size={16} className="mr-2" />
                )}
                <span>{isChangingPassword ? 'Alterando...' : 'Alterar Senha'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
