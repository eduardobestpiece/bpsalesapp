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

export default function SettingsPerfil() {
  const { crmUser, updateCrmUserInContext, refreshCrmUser } = useCrmAuth();
  const [isSaving, setIsSaving] = useState(false);
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
    console.log('🔍 Debug - crmUser carregado:', crmUser);
    console.log('🔍 Debug - avatar_url do crmUser:', (crmUser as any).avatar_url);
    
    setFormData({
      first_name: crmUser.first_name || '',
      last_name: crmUser.last_name || '',
      email: crmUser.email || '',
      phone: crmUser.phone || '',
      birth_date: (crmUser as any).birth_date || '',
      bio: (crmUser as any).bio || '',
      avatar_url: (crmUser as any).avatar_url || '',
    });
    
    console.log('🔍 Debug - formData atualizado:', {
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

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('🔍 Debug - Arquivo selecionado:', file.name, file.size, file.type);
      setSelectedImage(file);
      
      // Fazer upload automaticamente após seleção
      await handleUploadAvatar(file);
    }
  };

  const handleUploadAvatar = async (file?: File) => {
    const imageToUpload = file || selectedImage;
    
    console.log('🔍 Debug - handleUploadAvatar chamado!');
    console.log('🔍 Debug - imageToUpload:', imageToUpload);
    console.log('🔍 Debug - crmUser:', crmUser);
    
    if (!imageToUpload || !crmUser) {
      console.log('❌ Debug - Condições não atendidas para upload');
      return;
    }
    
    try {
      console.log('🔍 Debug - Tamanho do arquivo:', imageToUpload.size, 'bytes');
      console.log('🔍 Debug - Tipo do arquivo:', imageToUpload.type);
      
      // Verificar se o arquivo é muito grande (limite de 2MB para Base64)
      if (imageToUpload.size > 2 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 2MB para avatar.');
      }
      
      // Verificar se o arquivo é válido
      if (!imageToUpload.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem válida.');
      }
      
      // Verificar se o arquivo não está corrompido
      if (imageToUpload.size === 0) {
        throw new Error('Arquivo está vazio ou corrompido.');
      }
      
      console.log('🔍 Debug - Validações do arquivo passaram!');
      
      // Converter imagem para Base64 usando múltiplas estratégias
      console.log('🔍 Debug - Convertendo imagem para Base64 usando múltiplas estratégias...');
      
      const base64String = await new Promise<string>(async (resolve, reject) => {
        try {
          // Estratégia 1: Criar Blob e usar ArrayBuffer
          console.log('🔍 Debug - Estratégia 1: Criando Blob do arquivo...');
          const blob = new Blob([imageToUpload], { type: imageToUpload.type });
          console.log('🔍 Debug - Blob criado com sucesso! Tamanho:', blob.size, 'bytes');
          
          const arrayBuffer = await blob.arrayBuffer();
          console.log('🔍 Debug - ArrayBuffer do Blob obtido! Tamanho:', arrayBuffer.byteLength, 'bytes');
          
          // Converter ArrayBuffer para Base64
          console.log('🔍 Debug - Convertendo ArrayBuffer para Base64...');
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          
          const base64 = btoa(binary);
          const mimeType = imageToUpload.type || 'image/png';
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          console.log('🔍 Debug - Base64 gerado com sucesso via Blob! Tamanho:', dataUrl.length, 'caracteres');
          resolve(dataUrl);
          
        } catch (blobError) {
          console.error('❌ Debug - Erro na estratégia Blob:', blobError);
          
          try {
            // Estratégia 2: URL.createObjectURL + fetch
            console.log('🔍 Debug - Estratégia 2: Usando URL.createObjectURL...');
            const objectUrl = URL.createObjectURL(imageToUpload);
            console.log('🔍 Debug - ObjectURL criado:', objectUrl);
            
            const response = await fetch(objectUrl);
            console.log('🔍 Debug - Fetch response obtido!');
            
            const arrayBuffer = await response.arrayBuffer();
            console.log('🔍 Debug - ArrayBuffer via fetch obtido! Tamanho:', arrayBuffer.byteLength, 'bytes');
            
            // Converter ArrayBuffer para Base64
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            
            const base64 = btoa(binary);
            const mimeType = imageToUpload.type || 'image/png';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            
            // Limpar ObjectURL
            URL.revokeObjectURL(objectUrl);
            
            console.log('🔍 Debug - Base64 gerado com sucesso via ObjectURL! Tamanho:', dataUrl.length, 'caracteres');
            resolve(dataUrl);
            
          } catch (objectUrlError) {
            console.error('❌ Debug - Erro na estratégia ObjectURL:', objectUrlError);
            
            try {
              // Estratégia 3: FileReader tradicional (último recurso)
              console.log('🔍 Debug - Estratégia 3: Tentando FileReader tradicional...');
              const reader = new FileReader();
              
              reader.onload = () => {
                console.log('🔍 Debug - FileReader: Sucesso!');
                const result = reader.result as string;
                console.log('🔍 Debug - FileReader: Resultado obtido, tamanho:', result.length, 'caracteres');
                resolve(result);
              };
              
              reader.onerror = (event) => {
                console.error('❌ Debug - FileReader: Erro:', event);
                console.error('❌ Debug - FileReader: Erro details:', reader.error);
                reject(new Error(`Todas as estratégias falharam. Último erro: ${reader.error?.message || 'Erro desconhecido'}`));
              };
              
              reader.readAsDataURL(imageToUpload);
              
            } catch (readerError) {
              console.error('❌ Debug - FileReader: Erro ao chamar readAsDataURL:', readerError);
              reject(new Error(`Todas as estratégias falharam. Erro final: ${readerError}`));
            }
          }
        }
      });
      
      console.log('🔍 Debug - Base64 gerado com sucesso! Tamanho:', base64String.length, 'caracteres');
      
      // Atualizar estado local
      setFormData(prev => ({ ...prev, avatar_url: base64String }));
      
      // Salvar automaticamente no banco de dados
      const { error: updateError } = await supabase
        .from('crm_users')
        .update({ 
          avatar_url: base64String,
          avatar_base64: base64String 
        })
        .eq('id', crmUser.id);
      
      if (updateError) {
        console.error('❌ Debug - Erro ao salvar avatar:', updateError);
        throw updateError;
      }
      
      console.log('✅ Debug - Avatar salvo com sucesso no banco!');
      
      // Atualizar contexto do usuário com o avatar_url
      await updateCrmUserInContext({ avatar_url: base64String });
      
      // Recarregar dados do usuário para garantir sincronização
      await refreshCrmUser();
      
      toast.success('Avatar enviado e salvo com sucesso!');
    } catch (e) {
      console.error('❌ Debug - Erro no upload do avatar:', e);
      
      let errorMessage = 'Erro ao enviar avatar';
      let showRetryOption = true;
      
      if (e instanceof Error) {
        if (e.message.includes('muito grande')) {
          errorMessage = 'Arquivo muito grande. Máximo 2MB para avatar.';
        } else if (e.message.includes('Todas as estratégias falharam')) {
          errorMessage = 'Não foi possível processar este arquivo. Pode ser um problema de permissão ou formato.';
          showRetryOption = false;
        } else if (e.message.includes('ler arquivo')) {
          errorMessage = 'Erro ao processar arquivo. Tente novamente.';
        } else {
          errorMessage = `Erro: ${e.message}`;
        }
      }
      
      // Mostrar toast com opção de continuar sem avatar
      if (showRetryOption) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage, {
          duration: 8000,
          action: {
            label: 'Continuar sem foto',
            onClick: () => {
              console.log('🔍 Debug - Usuário escolheu continuar sem avatar');
              toast.success('Perfil salvo sem foto. Você pode tentar adicionar uma foto mais tarde.');
            }
          }
        });
      }
    }
  };

  const handleSave = async () => {
    if (!crmUser) return;
    setIsSaving(true);
    try {
      // Preparar dados para atualização, convertendo strings vazias para null
      const updateData = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null, // Manter avatar_url mesmo se vazio
      };

      console.log('🔍 Debug - Dados sendo enviados:', updateData);
      console.log('🔍 Debug - ID do usuário:', crmUser.id);

      const { error } = await supabase
        .from('crm_users')
        .update(updateData)
        .eq('id', crmUser.id);

      if (error) {
        console.error('❌ Debug - Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Debug - Perfil atualizado com sucesso!');
      await updateCrmUserInContext();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Debug - Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = `${(crmUser?.first_name?.[0] || 'U')}${(crmUser?.last_name?.[0] || '')}`;

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
      </div>

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
              <p className="text-sm text-muted-foreground">Selecione um arquivo para alterar sua foto</p>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleImageSelect} className="max-w-xs" />
                <Button variant="outline" size="sm" onClick={handleUploadAvatar} disabled={!selectedImage}>
                  <Camera size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Dica: Se houver problemas com o upload, você pode continuar sem foto e tentar novamente mais tarde.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input id="first_name" value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input id="last_name" value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={formData.email} disabled />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input id="birth_date" type="date" value={formData.birth_date} onChange={(e) => handleInputChange('birth_date', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} rows={4} />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving} variant="brandPrimaryToSecondary" className="brand-radius">
                <Save size={16} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 