import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Archive, Search, Camera, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AvatarCropper } from '@/components/CRM/AvatarCropper';

export default function SettingsGestao() {
  const { user, crmUser, userRole, companyId, refreshCrmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  // Estados para modais
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Estados para perfil
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    bio: '',
    avatar_url: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Estados para empresa
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [niche, setNiche] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateUF] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [primaryColor, setPrimaryColor] = useState('#A86F57');
  const [secondaryColor, setSecondaryColor] = useState('#6B7280');
  const [borderRadiusPx, setBorderRadiusPx] = useState(8);

  // Estados para busca de usuários
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Dados
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['crm_users', selectedCompanyId || companyId],
    queryFn: async () => {
      if (!selectedCompanyId && !companyId) return [];
      const { data } = await supabase
        .from('crm_users')
        .select('*')
        .eq('company_id', selectedCompanyId || companyId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!(selectedCompanyId || companyId)
  });

  const { data: perms = {} } = useQuery({
    queryKey: ['role_page_permissions', companyId, userRole],
    enabled: !!companyId && !!userRole,
    queryFn: async () => {
      const { data } = await supabase
        .from('role_page_permissions')
        .select('*')
        .eq('company_id', companyId as string)
        .eq('role', userRole as any);
      const map: Record<string, boolean> = {};
      data?.forEach((r: any) => { map[r.page] = r.allowed; });
      return map;
    }
  });

  // Simplificar permissões - permitir acesso se não houver restrições específicas
  const canProfile = perms['settings_profile'] !== false;
  const canCompany = perms['settings_company'] !== false || userRole === 'admin' || userRole === 'master';
  const canUsers = perms['settings_users'] !== false || userRole === 'admin' || userRole === 'master';

  const allowedOrder: { key: string; allowed: boolean }[] = [
    { key: 'profile', allowed: canProfile },
    { key: 'company', allowed: canCompany },
    { key: 'users', allowed: canUsers },
  ];
  const firstAllowed = allowedOrder.find(i => i.allowed)?.key;
  const [tabValue, setTabValue] = useState<string>(firstAllowed || 'profile');

  useEffect(() => {
    const next = allowedOrder.find(i => i.allowed)?.key || 'profile';
    if (!allowedOrder.find(i => i.key === tabValue && i.allowed)) {
      setTabValue(next);
    }
  }, [canProfile, canCompany, canUsers]);

  // Carregar dados do perfil
  useEffect(() => {
    console.log('crmUser mudou:', crmUser);
    if (crmUser) {
      console.log('Carregando dados do crmUser:', {
        first_name: crmUser.first_name,
        last_name: crmUser.last_name,
        email: crmUser.email,
        phone: crmUser.phone,
        birth_date: crmUser.birth_date,
        bio: crmUser.bio,
        avatar_url: crmUser.avatar_url
      });
      
      setFormData({
        first_name: crmUser.first_name || '',
        last_name: crmUser.last_name || '',
        email: crmUser.email || '',
        phone: crmUser.phone || '',
        birth_date: crmUser.birth_date || '',
        bio: crmUser.bio || '',
        avatar_url: crmUser.avatar_url || ''
      });
    }
  }, [crmUser]);

  // Dados da empresa
  const { data: companyProfile, isLoading: companyProfileLoading } = useQuery({
    queryKey: ['company_profiles', selectedCompanyId || companyId],
    queryFn: async () => {
      if (!selectedCompanyId && !companyId) return null;
      
      console.log('Carregando dados da empresa para company_id:', selectedCompanyId || companyId);
      
      // Primeiro, tentar buscar na tabela companies
      let { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', selectedCompanyId || companyId)
        .maybeSingle();
      
      console.log('Dados da tabela companies:', data);
      console.log('Erro da tabela companies:', error);
      
      // Se não encontrar na tabela companies, tentar na tabela company_profiles
      if (!data && !error) {
        console.log('Tentando buscar na tabela company_profiles...');
        const result = await supabase
          .from('company_profiles')
          .select('*')
          .eq('company_id', selectedCompanyId || companyId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
        
        console.log('Dados da tabela company_profiles:', data);
        console.log('Erro da tabela company_profiles:', error);
      }
      
      if (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!(selectedCompanyId || companyId)
  });

  const { data: companyBranding } = useQuery({
    queryKey: ['company_branding', selectedCompanyId || companyId],
    queryFn: async () => {
      if (!selectedCompanyId && !companyId) return null;
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', selectedCompanyId || companyId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao carregar branding da empresa:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!(selectedCompanyId || companyId)
  });

  // Carregar dados da empresa quando as queries retornarem
  useEffect(() => {
    console.log('companyProfile mudou:', companyProfile);
    if (companyProfile) {
      console.log('Carregando dados do companyProfile:', companyProfile);
      // Os dados podem vir da tabela companies ou company_profiles
      setName(companyProfile.name || companyProfile.company_name || '');
      setCnpj(companyProfile.cnpj || '');
      setNiche(companyProfile.niche || '');
      setCep(companyProfile.cep || '');
      setStreet(companyProfile.street || '');
      setNumber(companyProfile.number || '');
      setNeighborhood(companyProfile.neighborhood || '');
      setCity(companyProfile.city || '');
      setStateUF(companyProfile.state || '');
      setCountry(companyProfile.country || '');
      setTimezone(companyProfile.timezone || 'America/Sao_Paulo');
    }
  }, [companyProfile]);

  useEffect(() => {
    if (companyBranding) {
      setPrimaryColor(companyBranding.primary_color || '#A86F57');
      setSecondaryColor(companyBranding.secondary_color || '#6B7280');
      setBorderRadiusPx(companyBranding.border_radius_px || 8);
    }
  }, [companyBranding]);

  // Handlers para perfil
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

  const handleAvatarCrop = async (croppedImageDataUrl: string) => {
          try {
        // Converter data URL para Blob
        const response = await fetch(croppedImageDataUrl);
        const croppedImageBlob = await response.blob();
        const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      // Obter o usuário Supabase Auth para usar o auth.uid() correto
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('Usuário não autenticado');
      }
      
      // Usar estrutura de pasta que funciona com a política RLS atual
      const fileName = `${authUser.id}/avatar_${Date.now()}.jpg`;
      
      console.log('Fazendo upload do avatar para:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        console.error('Detalhes do erro:', {
          message: uploadError.message,
          details: uploadError.details,
          hint: uploadError.hint,
          code: uploadError.code
        });
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('URL pública gerada:', publicUrl);

      // Atualizar o avatar_url na tabela crm_users usando email para evitar problemas de RLS
      console.log('Atualizando crm_users com email:', crmUser?.email);
      console.log('Nova URL do avatar:', publicUrl);
      
      // Tentar atualizar usando ID primeiro, depois email como fallback
      let updateData, updateError;
      
      if (crmUser?.id) {
        console.log('Tentando atualizar usando ID:', crmUser.id);
        const result = await supabase
          .from('crm_users')
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', crmUser.id)
          .select();
        
        updateData = result.data;
        updateError = result.error;
      }
      
      // Se falhar com ID, tentar com email
      if (updateError && crmUser?.email) {
        console.log('Falhou com ID, tentando com email:', crmUser.email);
        const result = await supabase
          .from('crm_users')
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('email', crmUser.email)
          .select();
        
        updateData = result.data;
        updateError = result.error;
      }

      console.log('Resultado da atualização:', updateData);
      
      if (updateError) {
        console.error('Erro ao atualizar crm_users:', updateError);
        throw updateError;
      }
      
      console.log('crm_users atualizado com sucesso');

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      // Invalidar queries para forçar reload dos dados
      queryClient.invalidateQueries({ queryKey: ['crm_user'] });
      queryClient.invalidateQueries({ queryKey: ['crm_users'] });
      
      // Forçar refresh do contexto do usuário
      if (refreshCrmUser) {
        await refreshCrmUser();
      }
      
      // Fechar o modal e limpar o estado
      setShowAvatarCropper(false);
      setSelectedImage(null);
      
      toast.success('Avatar atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error('Erro ao atualizar avatar: ' + error.message);
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
          birth_date: formData.birth_date || null,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('email', crmUser.email);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(crmUser?.email || '', {
        redirectTo: `${window.location.origin}/crm/reset-password`
      });

      if (error) throw error;
      toast.success('E-mail de redefinição enviado!');
    } catch (error: any) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    }
  };

  // Handlers para empresa
  const handleCepChange = async (cepValue: string) => {
    setCep(cepValue);
    if (cepValue.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setStreet(data.logradouro);
          setNeighborhood(data.bairro);
          setCity(data.localidade);
          setStateUF(data.uf);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const normalizeHex = (color: string) => {
    if (color.startsWith('#')) {
      return color.length === 4 ? 
        '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] : 
        color;
    }
    return color;
  };

  const upsertProfile = useMutation({
    mutationFn: async () => {
      // Primeiro, tentar atualizar a tabela companies
      let { error } = await supabase
        .from('companies')
        .update({
          name,
          cnpj,
          niche,
          cep,
          street,
          number,
          neighborhood,
          city,
          state,
          country,
          timezone
        })
        .eq('id', selectedCompanyId || companyId);

      // Se não conseguir atualizar companies, tentar upsert em company_profiles
      if (error) {
        console.log('Erro ao atualizar companies, tentando company_profiles:', error);
        const { error: profileError } = await supabase
          .from('company_profiles')
          .upsert({
            company_id: selectedCompanyId || companyId,
            name,
            cnpj,
            niche,
            cep,
            street,
            number,
            neighborhood,
            city,
            state,
            country,
            timezone
          });

        if (profileError) throw profileError;
      }

      const { error: brandingError } = await supabase
        .from('company_branding')
        .upsert({
          company_id: selectedCompanyId || companyId,
          primary_color: primaryColor,
          secondary_color: normalizeHex(secondaryColor),
          border_radius_px: borderRadiusPx
        });

      if (brandingError) throw brandingError;
    },
    onSuccess: () => {
      toast.success('Dados da empresa salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['company_profiles', selectedCompanyId || companyId] });
      queryClient.invalidateQueries({ queryKey: ['company_branding', selectedCompanyId || companyId] });
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar dados da empresa: ' + error.message);
    }
  });

  // Filtros
  const filteredUsers = users.filter(user =>
    user.first_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Funções auxiliares
  const userInitials = crmUser
    ? `${crmUser.first_name?.charAt(0) || ''}${crmUser.last_name?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Gestão</h1>
        <p className="text-muted-foreground">Gerencie perfil, empresa e usuários</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              {canProfile && (
                <>
                  <TabsTrigger 
                    value="profile" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#e50f5f]"
                  >
                    Meu Perfil
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {canCompany && (
                <>
                  <TabsTrigger 
                    value="company" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#e50f5f]"
                  >
                    Empresa
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {canUsers && (
                <TabsTrigger 
                  value="users" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#e50f5f]"
                >
                  Usuários
                </TabsTrigger>
              )}
            </TabsList>

            {canProfile && (
              <TabsContent value="profile" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Meu Perfil</h2>
                      <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e configurações</p>
                    </div>
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

                  {/* Avatar Section */}
                  <Card className="brand-radius">
                    <CardContent className="p-6">
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
                </div>
              </TabsContent>
            )}

            {canCompany && (
              <TabsContent value="company" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Empresa</h2>
                      <p className="text-muted-foreground mt-1">Configure os dados cadastrais e o visual da sua empresa</p>
                    </div>
                    <Button 
                      onClick={() => upsertProfile.mutate()} 
                      disabled={upsertProfile.isPending}
                      className="text-white"
                      style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                    >
                      {upsertProfile.isPending ? 'Salvando...' : 'Salvar dados da empresa'}
                    </Button>
                  </div>

                  {/* Dados Cadastrais */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome da empresa</Label>
                          <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                          <Input 
                            value={cnpj} 
                            onChange={(e) => setCnpj(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Nicho</Label>
                          <Input 
                            value={niche} 
                            onChange={(e) => setNiche(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CEP</Label>
                          <Input 
                            value={cep} 
                            onChange={(e) => handleCepChange(e.target.value)} 
                            placeholder="Somente números"
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Endereço</Label>
                          <Input 
                            value={street} 
                            onChange={(e) => setStreet(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <Input 
                            value={number} 
                            onChange={(e) => setNumber(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bairro</Label>
                          <Input 
                            value={neighborhood} 
                            onChange={(e) => setNeighborhood(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Input 
                            value={city} 
                            onChange={(e) => setCity(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Input 
                            value={state} 
                            onChange={(e) => setStateUF(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>País</Label>
                          <Input 
                            value={country} 
                            onChange={(e) => setCountry(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuso horário</Label>
                          <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger className="brand-radius field-secondary-focus no-ring-focus">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                              <SelectItem value="America/Bahia">America/Bahia</SelectItem>
                              <SelectItem value="America/Fortaleza">America/Fortaleza</SelectItem>
                              <SelectItem value="America/Manaus">America/Manaus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cores & Bordas */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Cores & Bordas</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Cor primária</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="h-10 w-16 border border-border bg-background brand-radius"
                            />
                            <Input
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-40 brand-radius field-secondary-focus no-ring-focus"
                              placeholder="#A86F57"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Cor secundária</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(normalizeHex(e.target.value))}
                              className="h-10 w-16 border border-border bg-background brand-radius"
                            />
                            <Input
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(normalizeHex(e.target.value))}
                              className="w-40 brand-radius field-secondary-focus no-ring-focus"
                              placeholder="#6B7280"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Arredondamento das bordas (px)</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min={0}
                              max={32}
                              value={borderRadiusPx}
                              onChange={(e) => setBorderRadiusPx(Number(e.target.value))}
                              className="w-32 brand-radius field-secondary-focus no-ring-focus"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}

            {canUsers && (
              <TabsContent value="users" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Usuários</h2>
                      <p className="text-muted-foreground mt-1">Gerencie os usuários do CRM</p>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Pesquisar usuários..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Nome</TableHead>
                        <TableHead className="text-left">E-mail</TableHead>
                        <TableHead className="text-left">Função</TableHead>
                        <TableHead className="text-left">Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            Carregando usuários...
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {userSearchTerm ? 'Nenhum usuário encontrado com este termo.' : 'Nenhum usuário encontrado.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.first_name} {user.last_name}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role || 'Usuário'}</TableCell>
                            <TableCell>
                              <Badge
                                className="text-white"
                                style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                              >
                                Ativo
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="brandOutlineSecondaryHover"
                                  size="sm"
                                  className="brand-radius"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            )}
          </Tabs>
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