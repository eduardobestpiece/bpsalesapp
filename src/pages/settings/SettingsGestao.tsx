import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Archive, Search, Camera, Save, ImageIcon, Loader2, Power, PowerOff } from 'lucide-react';
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
import { UserModal } from '@/components/CRM/Configuration/UserModal';
import { CreatePermissionModal, EditPermissionModal } from '@/components/Administrators/PermissionModal';

export default function SettingsGestao() {
  const { user, crmUser, userRole, companyId, refreshCrmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  // Estados para modais
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreatePermissionModal, setShowCreatePermissionModal] = useState(false);
  const [showEditPermissionModal, setShowEditPermissionModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);

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
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', 'user', 'admin', 'master', etc.
  const [userStatusFilter, setUserStatusFilter] = useState('active'); // 'all', 'active', 'archived'
  const [cnpjError, setCnpjError] = useState<string>('');

  // Estados para CPF
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');

  // Estados para logos
  const [squarePreview, setSquarePreview] = useState<string>('');
  const [horizontalPreview, setHorizontalPreview] = useState<string>('');
  const [horizontalDarkPreview, setHorizontalDarkPreview] = useState<string>('');
  const [isUploadingSquare, setIsUploadingSquare] = useState(false);
  const [isUploadingHorizontal, setIsUploadingHorizontal] = useState(false);
  const [isUploadingHorizontalDark, setIsUploadingHorizontalDark] = useState(false);

  // Refs para inputs de arquivo
  const squareInputRef = useRef<HTMLInputElement>(null);
  const horizontalInputRef = useRef<HTMLInputElement>(null);
  const horizontalDarkInputRef = useRef<HTMLInputElement>(null);

  // Dados
  const effectiveCompanyId = selectedCompanyId || companyId;

  // Query para branding
  const { data: branding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    }
  });

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
  const canPermissions = perms['settings_permissions'] !== false || userRole === 'admin' || userRole === 'master';
  const canEdit = userRole === 'admin' || userRole === 'master';

  // Carregar dados de branding
  useEffect(() => {
    if (branding) {
      setSquarePreview(branding.logo_square_url || '');
      setHorizontalPreview(branding.logo_horizontal_url || branding.logo_vertical_url || '');
      setHorizontalDarkPreview(branding.logo_horizontal_dark_url || '');
      setPrimaryColor(branding.primary_color || '#A86F57');
      setSecondaryColor(branding.secondary_color || '#6B7280');
      setBorderRadiusPx(typeof branding.border_radius_px === 'number' ? branding.border_radius_px : 8);
    }
  }, [branding]);



  const allowedOrder: { key: string; allowed: boolean }[] = [
    { key: 'profile', allowed: canProfile },
    { key: 'company', allowed: canCompany },
    { key: 'users', allowed: canUsers },
    { key: 'permissions', allowed: canPermissions },
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
    if (crmUser) {
      setFormData({
        first_name: crmUser.first_name || '',
        last_name: crmUser.last_name || '',
        email: crmUser.email || '',
        phone: crmUser.phone || '',
        birth_date: crmUser.birth_date || '',
        bio: crmUser.bio || '',
        avatar_url: crmUser.avatar_url || ''
      });
      // Carregar CPF (quando o campo estiver disponível no banco)
      setCpf(crmUser.cpf || '');
    }
  }, [crmUser]);

  // Dados da empresa
  const { data: companyProfile, isLoading: companyProfileLoading } = useQuery({
    queryKey: ['company_profiles', selectedCompanyId || companyId],
    queryFn: async () => {
      if (!selectedCompanyId && !companyId) return null;
      
      // Buscar dados da tabela companies (nome básico)
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', selectedCompanyId || companyId)
        .maybeSingle();
      
      // Buscar dados da tabela company_profiles (dados detalhados)
      const { data: profileData, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('company_id', selectedCompanyId || companyId)
        .maybeSingle();
      
      // Combinar dados das duas tabelas
      const combinedData = {
        ...companyData,
        ...profileData
      };
      
      if (companyError && profileError) {
        return null;
      }
      
      return combinedData;
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
    // Limpar localStorage antigo (dados não são mais necessários)
    const localStorageKey = `company_data_${selectedCompanyId || companyId}`;
    if (localStorage.getItem(localStorageKey)) {
      localStorage.removeItem(localStorageKey);
    }
    
    // Carregar dados APENAS do Supabase (banco de dados)
    if (companyProfile) {
      // Carregar dados da tabela companies (nome)
      setName(companyProfile.name || companyProfile.company_name || '');
      
      // Carregar dados da tabela company_profiles (dados detalhados)
      setCnpj(companyProfile.cnpj || '');
      setNiche(companyProfile.niche || '');
      setCep(companyProfile.cep || '');
      setStreet(companyProfile.address || companyProfile.street || '');
      setNumber(companyProfile.number || '');
      setNeighborhood(companyProfile.neighborhood || '');
      setCity(companyProfile.city || '');
      setStateUF(companyProfile.state || '');
      setCountry(companyProfile.country || '');
      setTimezone(companyProfile.timezone || 'America/Sao_Paulo');
    }
  }, [companyProfile, selectedCompanyId, companyId]);

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
          cpf: cpf, // Adicionar CPF quando o campo estiver disponível no banco
          updated_at: new Date().toISOString()
        })
        .eq('email', crmUser.email);

      if (error) throw error;
      
      // Invalidar queries para forçar recarregamento dos dados
      queryClient.invalidateQueries({ queryKey: ['crm_user'] });
      queryClient.invalidateQueries({ queryKey: ['crm_users'] });
      
      // Atualizar o contexto do usuário
      if (refreshCrmUser) {
        await refreshCrmUser();
      }
      
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Função para salvar cores
  const handlePrimaryColorSave = () => {
    upsertBranding.mutate({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      border_radius_px: borderRadiusPx
    });
  };

  // Função para fazer upload de logos
  const handleUpload = async (file: File, type: 'square' | 'horizontal' | 'horizontal_dark') => {
    if (!effectiveCompanyId) {
      toast.error('Empresa não encontrada');
      return;
    }
    try {
      if (type === 'square') setIsUploadingSquare(true);
      if (type === 'horizontal') setIsUploadingHorizontal(true);
      if (type === 'horizontal_dark') setIsUploadingHorizontalDark(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${effectiveCompanyId}/${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const updateData: any = {};
      if (type === 'square') updateData.logo_square_url = publicUrl;
      if (type === 'horizontal') updateData.logo_horizontal_url = publicUrl;
      if (type === 'horizontal_dark') updateData.logo_horizontal_dark_url = publicUrl;

      await upsertBranding.mutateAsync(updateData);

      toast.success('Logo enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar logo: ' + error.message);
    } finally {
      if (type === 'square') setIsUploadingSquare(false);
      if (type === 'horizontal') setIsUploadingHorizontal(false);
      if (type === 'horizontal_dark') setIsUploadingHorizontalDark(false);
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

  // Funções para modal de usuário
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // Funções para modal de permissões
  const handleCreatePermission = () => {
    setShowCreatePermissionModal(true);
  };

  const handleEditPermission = (permission: any) => {
    setSelectedPermission(permission);
    setShowEditPermissionModal(true);
  };

  const handleClosePermissionModals = () => {
    setShowCreatePermissionModal(false);
    setShowEditPermissionModal(false);
    setSelectedPermission(null);
  };

  // Função para ativar/desativar usuário
  const handleToggleUserStatus = async (user: any) => {
    try {
      const newStatus = user.status === 'active' ? 'archived' : 'active';
      const statusText = newStatus === 'active' ? 'ativado' : 'desativado';
      
      const { error } = await supabase
        .from('crm_users')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Se o usuário está sendo desativado e é o usuário atual logado, fazer logout
      if (newStatus === 'archived' && crmUser && user.id === crmUser.id) {
        toast.info('Você foi desconectado pois sua conta foi desativada.');
        await supabase.auth.signOut();
        return;
      }

      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['crm_users', selectedCompanyId || companyId] });
      
      toast.success(`Usuário ${statusText} com sucesso!`);
      
      // Mostrar aviso se usuário foi desativado
      if (newStatus === 'archived') {
        toast.info('O usuário foi desativado e não poderá mais acessar a plataforma.');
      }
    } catch (error: any) {
      toast.error('Erro ao alterar status do usuário: ' + error.message);
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

  // Função para validar CNPJ
  const validateCNPJ = (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let weight = 2;
    
    // Primeiro dígito verificador
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCNPJ[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    
    if (parseInt(cleanCNPJ[12]) !== digit) return false;
    
    // Segundo dígito verificador
    sum = 0;
    weight = 2;
    
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCNPJ[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    
    return parseInt(cleanCNPJ[13]) === digit;
  };

  // Função para formatar CNPJ
  const formatCNPJ = (cnpj: string): string => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  // Handler para mudança do CNPJ
  const handleCNPJChange = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    
    // Limita a 14 dígitos
    if (cleanValue.length <= 14) {
      const formattedValue = formatCNPJ(cleanValue);
      setCnpj(formattedValue);
      
      // Validação
      if (cleanValue.length === 14) {
        if (validateCNPJ(formattedValue)) {
          setCnpjError('');
        } else {
          setCnpjError('CNPJ inválido');
        }
      } else {
        setCnpjError('');
      }
    }
  };

  // Mutation para salvar branding
  const upsertBranding = useMutation({
    mutationFn: async (payload: Partial<{ logo_square_url: string; logo_horizontal_url: string; logo_horizontal_dark_url: string; primary_color: string; secondary_color: string; border_radius_px: number }>) => {
      if (!effectiveCompanyId) throw new Error('Empresa não definida');
      const values = {
        company_id: effectiveCompanyId,
        ...payload,
        ...(payload.primary_color ? { primary_color: normalizeHex(payload.primary_color) } : {}),
        ...(payload.secondary_color ? { secondary_color: normalizeHex(payload.secondary_color) } : {}),
      } as any;
      
      const { data: existing } = await supabase
        .from('company_branding')
        .select('company_id')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      
      if (existing?.company_id) {
        const { data: updated, error } = await supabase
          .from('company_branding')
          .update(values)
          .eq('company_id', effectiveCompanyId as string)
          .select('*')
          .maybeSingle();
        if (error) { throw error; }
      } else {
        const { data: inserted, error } = await supabase
          .from('company_branding')
          .insert(values)
          .select('*')
          .maybeSingle();
        if (error) { throw error; }
      }
    },
    onSuccess: async (_data, variables) => {
      queryClient.setQueryData(['company_branding', effectiveCompanyId], (old: any) => ({
        ...(old || { company_id: effectiveCompanyId }),
        ...variables,
      }));
      await queryClient.invalidateQueries({ queryKey: ['company_branding', effectiveCompanyId] });
      await queryClient.refetchQueries({ queryKey: ['company_branding', effectiveCompanyId] });
    },
    onError: (_e: any) => {}
  });

  const upsertProfile = useMutation({
    mutationFn: async () => {
      try {
        // 1. Atualizar o nome na tabela companies
        const { error: companyError } = await supabase
          .from('companies')
          .update({ name })
          .eq('id', selectedCompanyId || companyId);

        if (companyError) {
          throw companyError;
        }

        // 2. Salvar na tabela company_profiles
        // Primeiro, verificar se já existe um registro
        const { data: existingProfile } = await supabase
          .from('company_profiles')
          .select('company_id')
          .eq('company_id', selectedCompanyId || companyId)
          .maybeSingle();

        let profileError = null;
        
        if (existingProfile) {
          // Se existe, fazer UPDATE
          const { error } = await supabase
            .from('company_profiles')
            .update({
              name,
              cnpj,
              niche,
              cep,
              address: street,
              number,
              neighborhood,
              city,
              state,
              country,
              timezone
            })
            .eq('company_id', selectedCompanyId || companyId);
          profileError = error;
        } else {
          // Se não existe, fazer INSERT
          const { error } = await supabase
            .from('company_profiles')
            .insert({
              company_id: selectedCompanyId || companyId,
              name,
              cnpj,
              niche,
              cep,
              address: street,
              number,
              neighborhood,
              city,
              state,
              country,
              timezone
            });
          profileError = error;
        }

        if (profileError) {
          throw profileError;
        }

        // 3. Salvar branding
        const { error: brandingError } = await supabase
          .from('company_branding')
          .upsert({
            company_id: selectedCompanyId || companyId,
            primary_color: primaryColor,
            secondary_color: normalizeHex(secondaryColor),
            border_radius_px: borderRadiusPx
          });

        if (brandingError) {
          throw brandingError;
        }
      } catch (err) {
        throw err;
      }
    },
    onSuccess: () => {
      toast.success('Dados da empresa salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['company_profiles', selectedCompanyId || companyId] });
      queryClient.invalidateQueries({ queryKey: ['company_branding', selectedCompanyId || companyId] });
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar dados da empresa: ' + (error.message || 'Erro desconhecido'));
    }
  });

  // Filtros
  const filteredUsers = users.filter(user => {
    // Filtro de pesquisa
    const matchesSearch = user.first_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    // Filtro de cargo
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    
    // Filtro de situação
    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Funções auxiliares
  const userInitials = crmUser
    ? `${crmUser.first_name?.charAt(0) || ''}${crmUser.last_name?.charAt(0) || ''}`.toUpperCase()
    : 'U';

  // Funções para validação e formatação do CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cleanCPF[9]) !== digit) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return parseInt(cleanCPF[10]) === digit;
  };

  const formatCPF = (cpf: string): string => {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length <= 11) {
      const formattedValue = formatCPF(cleanValue);
      setCpf(formattedValue);
      if (cleanValue.length === 11) {
        if (validateCPF(formattedValue)) {
          setCpfError('');
        } else {
          setCpfError('CPF inválido');
        }
      } else {
        setCpfError('');
      }
    }
  };

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
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                    style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
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
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                    style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                  >
                    Empresa
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {canUsers && (
                <>
                  <TabsTrigger 
                    value="users" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                    style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                  >
                    Usuários
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}
              {canPermissions && (
                <TabsTrigger 
                  value="permissions" 
                  className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  style={{ '--tab-active-color': primaryColor } as React.CSSProperties}
                >
                  Permissões
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                              id="email"
                              value={formData.email}
                              disabled
                              className="bg-muted brand-radius field-secondary-focus no-ring-focus"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            O e-mail não pode ser alterado. Entre em contato com o suporte se necessário.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                              id="cpf"
                              value={cpf}
                              onChange={(e) => handleCPFChange(e.target.value)}
                              placeholder="000.000.000-00"
                              className={`brand-radius field-secondary-focus no-ring-focus ${cpfError ? 'border-red-500' : ''}`}
                            />
                            {cpfError && (
                              <p className="text-sm text-red-500">{cpfError}</p>
                            )}
                          </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Linha 1: Nome da empresa, CNPJ e Nicho */}
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
                            onChange={(e) => handleCNPJChange(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            className={`brand-radius field-secondary-focus no-ring-focus ${cnpjError ? 'border-red-500' : ''}`}
                          />
                          {cnpjError && (
                            <p className="text-sm text-red-500">{cnpjError}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Nicho</Label>
                          <Input 
                            value={niche} 
                            onChange={(e) => setNiche(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>

                        {/* Linha 2: CEP e Endereço */}
                        <div className="space-y-2">
                          <Label>CEP</Label>
                          <Input 
                            value={cep} 
                            onChange={(e) => handleCepChange(e.target.value)} 
                            placeholder="Somente números"
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Endereço</Label>
                          <Input 
                            value={street} 
                            onChange={(e) => setStreet(e.target.value)}
                            className="brand-radius field-secondary-focus no-ring-focus"
                          />
                        </div>

                        {/* Linha 3: Número, Bairro e Cidade */}
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

                        {/* Linha 4: Estado, País e Fuso horário */}
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


                  {/* Identidade visual */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Identidade visual</h3>
                          <p className="text-sm text-muted-foreground">Envie suas logos e defina a cor primária.</p>
                        </div>
                        <Button 
                          onClick={handlePrimaryColorSave} 
                          disabled={upsertBranding.isPending}
                          className="text-white"
                          style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                        >
                          {upsertBranding.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Logo Quadrada */}
                        <div className="space-y-3">
                          <Label>Logo quadrada</Label>
                          <div
                            className="w-full aspect-square border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                            onClick={() => canEdit && squareInputRef.current?.click()}
                          >
                            {squarePreview ? (
                              <img src={squarePreview} alt="Logo quadrada" className="w-full h-full object-contain" />
                            ) : (
                              <div className="text-muted-foreground flex flex-col items-center">
                                <ImageIcon className="h-10 w-10 mb-2" />
                                <span>Clique para enviar</span>
                              </div>
                            )}
                            {(isUploadingSquare) && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            ref={squareInputRef} 
                            className="hidden" 
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(f, 'square');
                            }} 
                          />
                        </div>

                        {/* Logos Horizontais: light + dark */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Logo horizontal</Label>
                            <div
                              className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
                              style={{ minHeight: 120 }}
                              onClick={() => canEdit && horizontalInputRef.current?.click()}
                            >
                              {horizontalPreview ? (
                                <img src={horizontalPreview} alt="Logo horizontal" className="h-auto max-h-28 w-auto" />
                              ) : (
                                <div className="text-muted-foreground flex flex-col items-center">
                                  <ImageIcon className="h-10 w-10 mb-2" />
                                  <span>Clique para enviar</span>
                                </div>
                              )}
                              {(isUploadingHorizontal) && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                                </div>
                              )}
                            </div>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              ref={horizontalInputRef} 
                              className="hidden" 
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(f, 'horizontal');
                              }} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Logo horizontal (dark mode)</Label>
                            <div
                              className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
                              style={{ minHeight: 120 }}
                              onClick={() => canEdit && horizontalDarkInputRef.current?.click()}
                            >
                              {horizontalDarkPreview ? (
                                <img src={horizontalDarkPreview} alt="Logo horizontal (dark)" className="h-auto max-h-28 w-auto" />
                              ) : (
                                <div className="text-muted-foreground flex flex-col items-center">
                                  <ImageIcon className="h-10 w-10 mb-2" />
                                  <span>Clique para enviar</span>
                                </div>
                              )}
                              {(isUploadingHorizontalDark) && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                                </div>
                              )}
                            </div>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              ref={horizontalDarkInputRef} 
                              className="hidden" 
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(f, 'horizontal_dark');
                              }} 
                            />
                          </div>
                        </div>

                        {/* Cores & Bordas */}
                        <div className="space-y-3">
                          <Label>Cor primária</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="h-10 w-16 border border-border bg-background"
                              style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                              disabled={!canEdit}
                            />
                            <Input
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-40"
                              placeholder="#A86F57"
                              style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                              disabled={!canEdit}
                            />
                          </div>

                          <Label>Cor secundária</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(normalizeHex(e.target.value))}
                              className="h-10 w-16 border border-border bg-background"
                              style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                              disabled={!canEdit}
                            />
                            <Input
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(normalizeHex(e.target.value))}
                              className="w-40"
                              placeholder="#6B7280"
                              style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                              disabled={!canEdit}
                            />
                          </div>

                          <Label>Arredondamento das bordas (px)</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              min={0}
                              max={32}
                              value={borderRadiusPx}
                              onChange={(e) => setBorderRadiusPx(Number(e.target.value))}
                              className="w-32"
                              style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                              disabled={!canEdit}
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
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">{filteredUsers.length}</span> usuário{filteredUsers.length !== 1 ? 's' : ''}
                      </div>
                      <Button 
                        onClick={handleAddUser}
                        className="text-white"
                        style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Usuário
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Pesquisar usuários..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="pl-10 field-secondary-focus no-ring-focus brand-radius"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                        <SelectTrigger className="w-40 field-secondary-focus no-ring-focus brand-radius">
                          <SelectValue placeholder="Cargo" />
                        </SelectTrigger>
                        <SelectContent style={{ '--brand-secondary': secondaryColor } as React.CSSProperties}>
                          <SelectItem value="all" className="dropdown-item-brand">Todos Cargos</SelectItem>
                          <SelectItem value="user" className="dropdown-item-brand">Usuário</SelectItem>
                          <SelectItem value="leader" className="dropdown-item-brand">Líder</SelectItem>
                          <SelectItem value="admin" className="dropdown-item-brand">Administrador</SelectItem>
                          <SelectItem value="submaster" className="dropdown-item-brand">SubMaster</SelectItem>
                          <SelectItem value="master" className="dropdown-item-brand">Master</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                        <SelectTrigger className="w-40 field-secondary-focus no-ring-focus brand-radius">
                          <SelectValue placeholder="Situação" />
                        </SelectTrigger>
                        <SelectContent style={{ '--brand-secondary': secondaryColor } as React.CSSProperties}>
                          <SelectItem value="all" className="dropdown-item-brand">Todas Situações</SelectItem>
                          <SelectItem value="active" className="dropdown-item-brand">Ativos</SelectItem>
                          <SelectItem value="archived" className="dropdown-item-brand">Inativos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                                style={{ 
                                  backgroundColor: user.status === 'active' 
                                    ? 'var(--brand-primary, #A86F57)' 
                                    : '#6B7280', 
                                  borderRadius: 'var(--brand-radius, 8px)' 
                                }}
                              >
                                {user.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="brandOutlineSecondaryHover"
                                  size="sm"
                                  className="brand-radius"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {user.role !== 'master' && (
                                  <Button
                                    variant="brandOutlineSecondaryHover"
                                    size="sm"
                                    className="brand-radius"
                                    onClick={() => handleToggleUserStatus(user)}
                                    title={user.status === 'active' ? 'Desativar usuário' : 'Ativar usuário'}
                                  >
                                    {user.status === 'active' ? (
                                      <PowerOff className="w-4 h-4" />
                                    ) : (
                                      <Power className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}
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

            {canPermissions && (
              <TabsContent value="permissions" className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">Permissões</h2>
                      <p className="text-muted-foreground mt-1">Gerencie as permissões de acesso do sistema</p>
                    </div>
                    <Button 
                      onClick={handleCreatePermission}
                      className="text-white"
                      style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Permissão
                    </Button>
                  </div>

                  {/* Tabela de Permissões */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Nome</TableHead>
                        <TableHead className="text-left">Situação</TableHead>
                        <TableHead className="text-left">Nível</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Administrador CRM</TableCell>
                        <TableCell>
                          <Badge
                            className="text-white"
                            style={{ 
                              backgroundColor: 'var(--brand-primary, #A86F57)', 
                              borderRadius: 'var(--brand-radius, 8px)' 
                            }}
                          >
                            Ativa
                          </Badge>
                        </TableCell>
                        <TableCell>Função</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="brandOutlineSecondaryHover"
                              size="sm"
                              className="brand-radius"
                              onClick={() => handleEditPermission({ id: 1, name: 'Administrador CRM' })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="brandOutlineSecondaryHover"
                              size="sm"
                              className="brand-radius"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Líder de Vendas</TableCell>
                        <TableCell>
                          <Badge
                            className="text-white"
                            style={{ 
                              backgroundColor: 'var(--brand-primary, #A86F57)', 
                              borderRadius: 'var(--brand-radius, 8px)' 
                            }}
                          >
                            Ativa
                          </Badge>
                        </TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="brandOutlineSecondaryHover"
                              size="sm"
                              className="brand-radius"
                              onClick={() => handleEditPermission({ id: 2, name: 'Líder de Vendas' })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="brandOutlineSecondaryHover"
                              size="sm"
                              className="brand-radius"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
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

      {/* Modal de Usuário */}
      <UserModal
        isOpen={showUserModal}
        onClose={handleCloseUserModal}
        user={selectedUser}
      />

      {/* Modais de Permissões */}
      <CreatePermissionModal
        open={showCreatePermissionModal}
        onOpenChange={setShowCreatePermissionModal}
        onSuccess={handleClosePermissionModals}
      />

      <EditPermissionModal
        open={showEditPermissionModal}
        onOpenChange={setShowEditPermissionModal}
        onSuccess={handleClosePermissionModals}
        permission={selectedPermission}
      />
    </>
  );
} 