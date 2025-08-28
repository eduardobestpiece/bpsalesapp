
import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCreateLead } from '@/hooks/useLeads';
import { useCrmUsers } from '@/hooks/useCrmUsers';
import { useSources } from '@/hooks/useSources';
import { useFunnels } from '@/hooks/useFunnels';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';
import { Edit2, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  lead?: any;
}

export const LeadModal = ({ isOpen, onClose, companyId, lead }: LeadModalProps) => {
  const { crmUser } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = companyId || selectedCompanyId;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneDdi: '+55',
    sourceId: '',
    responsibleId: '',
    funnelId: '',
    stageId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleName, setTitleName] = useState('');
  const [titleLastName, setTitleLastName] = useState('');
  const [isEditingResponsible, setIsEditingResponsible] = useState(false);

  // Hooks para buscar dados
  const { data: sources = [] } = useSources(effectiveCompanyId);
  const { data: crmUsers = [] } = useCrmUsers(effectiveCompanyId);
  const { data: allFunnels = [] } = useFunnels(effectiveCompanyId, 'active');
  const createLeadMutation = useCreateLead();

  // Buscar cores da empresa para o estilo das abas
  const { data: branding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .maybeSingle();
      return data;
    }
  });

  const primaryColor = branding?.primary_color || '#A86F57';

  // Filtrar funis baseado nas permissões do usuário
  const allowedFunnels = React.useMemo(() => {
    if (!allFunnels || !crmUser) return [];
    
    // Se for master ou admin, tem acesso a todos os funis
    if (crmUser.role === 'master' || crmUser.role === 'admin') {
      return allFunnels;
    }
    
    // Se for user ou leader, verificar funis atribuídos
    const assignedFunnels = crmUser.funnels || [];
    if (Array.isArray(assignedFunnels) && assignedFunnels.length > 0) {
      return allFunnels.filter(funnel => assignedFunnels.includes(funnel.id));
    }
    
    // Se não tem funis atribuídos, não tem acesso a nenhum
    return [];
  }, [allFunnels, crmUser]);

  // Buscar fases do funil selecionado
  const selectedFunnel = React.useMemo(() => {
    return allowedFunnels.find(funnel => funnel.id === formData.funnelId);
  }, [allowedFunnels, formData.funnelId]);

  const funnelStages = React.useMemo(() => {
    if (!selectedFunnel || !selectedFunnel.stages) return [];
    return selectedFunnel.stages.sort((a: any, b: any) => a.stage_order - b.stage_order);
  }, [selectedFunnel]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (lead) {
        // Edit mode
        setFormData({
          firstName: lead.first_name || '',
          lastName: lead.last_name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          phoneDdi: lead.phone_ddi || '+55',
          sourceId: lead.source_id || 'none',
          responsibleId: lead.responsible_id || '',
          funnelId: lead.funnel_id || 'none',
          stageId: lead.current_stage_id || 'none'
        });
        // Inicializar título editável
        setTitleName(lead.first_name || '');
        setTitleLastName(lead.last_name || '');
      } else {
        // Create mode
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          phoneDdi: '+55',
          sourceId: 'none',
          responsibleId: crmUser?.id || '',
          funnelId: allowedFunnels.length > 0 ? allowedFunnels[0].id : 'none',
          stageId: 'none'
        });
      }
      setEmailError('');
    }
  }, [isOpen, lead, crmUser, allowedFunnels]);

  // Reset stage when funnel changes
  useEffect(() => {
    if (formData.funnelId && formData.funnelId !== 'none' && funnelStages.length > 0) {
      setFormData(prev => ({
        ...prev,
        stageId: funnelStages[0].id
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        stageId: 'none'
      }));
    }
  }, [formData.funnelId, funnelStages]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar email em tempo real
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Email inválido');
      } else {
        setEmailError('');
      }
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Se o valor contém espaço, mover para o campo sobrenome
    if (value.includes(' ')) {
      const parts = value.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      
      setFormData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName
      }));
      
      // Mover foco para o campo sobrenome
      setTimeout(() => {
        const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
        if (lastNameInput) {
          lastNameInput.focus();
          // Posicionar o cursor no final do texto
          lastNameInput.setSelectionRange(lastName.length, lastName.length);
        }
      }, 0);
    } else {
      // Se não tem espaço, apenas atualizar o nome
      setFormData(prev => ({ ...prev, firstName: value }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleTitleSave = () => {
    setFormData(prev => ({
      ...prev,
      firstName: titleName,
      lastName: titleLastName
    }));
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleName(formData.firstName);
    setTitleLastName(formData.lastName);
    setIsEditingTitle(false);
  };

  // Obter usuário responsável selecionado
  const selectedResponsible = React.useMemo(() => {
    return crmUsers.find(user => user.id === formData.responsibleId);
  }, [crmUsers, formData.responsibleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.firstName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    if (!formData.funnelId || formData.funnelId === 'none') {
      toast.error('Selecione um funil');
      return;
    }

    if (!formData.stageId || formData.stageId === 'none') {
      toast.error('Selecione uma fase do funil');
      return;
    }

    if (!formData.responsibleId) {
      toast.error('Selecione um usuário responsável');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar dados para salvar
      const leadData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(), // Nome completo
        email: formData.email.trim(),
        phone: formData.phone,
        phone_ddi: formData.phoneDdi,
        source_id: formData.sourceId === 'none' ? null : formData.sourceId,
        responsible_id: formData.responsibleId,
        funnel_id: formData.funnelId === 'none' ? null : formData.funnelId,
        current_stage_id: formData.stageId === 'none' ? null : formData.stageId,
        company_id: effectiveCompanyId!
      };

      await createLeadMutation.mutateAsync(leadData);
      
      toast.success('Lead criado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast.error(error.message || 'Erro ao criar lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Componente de título editável
  const EditableTitle = () => {
    if (!lead) return <span>Novo Lead</span>;
    
    if (isEditingTitle) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={titleName}
            onChange={(e) => setTitleName(e.target.value)}
            className="w-32 h-8 text-sm bg-transparent border-0 p-0 text-white font-semibold focus:ring-0 focus:border-b-2 focus:border-white"
            placeholder="Nome"
          />
          <Input
            value={titleLastName}
            onChange={(e) => setTitleLastName(e.target.value)}
            className="w-32 h-8 text-sm bg-transparent border-0 p-0 text-white font-semibold focus:ring-0 focus:border-b-2 focus:border-white"
            placeholder="Sobrenome"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTitleSave}
              className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
            >
              ✓
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTitleCancel}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              ✕
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold">
          {titleName} {titleLastName}
        </span>
        <Edit2 
          className="w-4 h-4 text-muted-foreground hover:text-white cursor-pointer transition-colors" 
          onClick={() => setIsEditingTitle(true)}
        />
      </div>
    );
  };

  // Componente de usuário responsável editável
  const EditableResponsible = () => {
    if (!selectedResponsible) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs">?</AvatarFallback>
          </Avatar>
          <span className="text-sm">Selecionar usuário</span>
        </div>
      );
    }

    if (isEditingResponsible) {
      return (
        <div className="flex items-center gap-2">
          <Select
            value={formData.responsibleId}
            onValueChange={(value) => {
              handleInputChange('responsibleId', value);
              setIsEditingResponsible(false);
            }}
          >
            <SelectTrigger className="w-48 h-8 text-sm bg-transparent border border-white/20 text-white select-trigger-primary">
              <SelectValue placeholder="Selecione o usuário" />
            </SelectTrigger>
            <SelectContent className="dropdown-item-brand">
              {crmUsers.map((user) => (
                <SelectItem key={user.id} value={user.id || 'none'} className="lead-dropdown-item">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.first_name} {user.last_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditingResponsible(false)}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
          >
            ✕
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded px-2 py-1 transition-colors"
        onClick={() => setIsEditingResponsible(true)}
      >
        <Avatar className="w-6 h-6">
          <AvatarImage src={selectedResponsible.avatar_url} />
          <AvatarFallback className="text-xs">
            {selectedResponsible.first_name?.[0]}{selectedResponsible.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-white">
          {selectedResponsible.first_name} {selectedResponsible.last_name}
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  };

  return (
    <FullScreenModal
      isOpen={isOpen}
      onClose={onClose}
      title={<EditableTitle />}
      actions={
        <div className="flex items-center gap-4">
          <EditableResponsible />
          <Button
            type="submit"
            form="lead-form"
            disabled={isSubmitting || !!emailError}
            variant="brandPrimaryToSecondary"
            className="brand-radius"
          >
            {isSubmitting ? 'Criando...' : (lead ? 'Salvar' : 'Criar Lead')}
          </Button>
        </div>
      }
    >
              {lead ? (
          // Modal de Edição com Abas
          <Tabs defaultValue="contato" className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              <TabsTrigger 
                value="contato" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                style={{ 
                  '--tab-active-color': primaryColor 
                } as React.CSSProperties}
              >
                Contato
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger 
                value="adicionais" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                style={{ 
                  '--tab-active-color': primaryColor 
                } as React.CSSProperties}
              >
                Adicionais
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger 
                value="observacoes" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                style={{ 
                  '--tab-active-color': primaryColor 
                } as React.CSSProperties}
              >
                Observações
              </TabsTrigger>
              <div className="w-px h-6 bg-border/30 self-center"></div>
              <TabsTrigger 
                value="historico" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[var(--tab-active-color)]"
                style={{ 
                  '--tab-active-color': primaryColor 
                } as React.CSSProperties}
              >
                Histórico
              </TabsTrigger>
            </TabsList>

          <TabsContent value="contato" className="p-6">
            <div className="space-y-6 lead-modal-dropdown">
              <form id="lead-form" onSubmit={handleSubmit}>
              {/* Origem */}
              <div>
                <Label htmlFor="source" className="block text-sm font-medium text-white">
                  Origem
                </Label>
                <Select
                  value={formData.sourceId}
                  onValueChange={(value) => handleInputChange('sourceId', value)}
                >
                  <SelectTrigger className="w-full brand-radius select-trigger-primary">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-item-brand">
                    <SelectItem value="none" className="lead-dropdown-item">Nenhuma origem</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id || 'none'} className="lead-dropdown-item">
                        {source.name || 'Fonte sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="mt-6">
                <Label htmlFor="email" className="block text-sm font-medium text-white">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`brand-radius campo-primary-focus ${emailError ? 'border-red-500' : ''}`}
                  placeholder="Digite o email"
                  required
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              {/* Telefone com DDI */}
              <div className="mt-6">
                <Label htmlFor="phone" className="block text-sm font-medium text-white">
                  Telefone
                </Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Digite o telefone"
                  className="w-full"
                />
              </div>
            </form>
            </div>
          </TabsContent>

          <TabsContent value="adicionais" className="p-6">
            <div className="space-y-6 lead-modal-dropdown">
              <form id="lead-form" onSubmit={handleSubmit}>
              {/* Funil */}
              <div className="mt-6">
                <Label htmlFor="funnel" className="block text-sm font-medium text-white">
                  Funil *
                </Label>
                <Select
                  value={formData.funnelId}
                  onValueChange={(value) => handleInputChange('funnelId', value)}
                  disabled={allowedFunnels.length === 0}
                >
                  <SelectTrigger className="w-full brand-radius select-trigger-primary">
                    <SelectValue placeholder={allowedFunnels.length === 0 ? "Nenhum funil disponível" : "Selecione o funil"} />
                  </SelectTrigger>
                  <SelectContent className="dropdown-item-brand">
                    {allowedFunnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={funnel.id || 'none'} className="lead-dropdown-item">
                        {funnel.name || 'Funnel sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {allowedFunnels.length === 0 && (
                  <p className="text-yellow-500 text-sm mt-1">
                    Você não tem acesso a nenhum funil. Entre em contato com o administrador.
                  </p>
                )}
              </div>

              {/* Fase do Funil */}
              {formData.funnelId && formData.funnelId !== 'none' && funnelStages.length > 0 && (
                <div className="mt-6">
                  <Label htmlFor="stage" className="block text-sm font-medium text-white">
                    Fase do Funil *
                  </Label>
                  <Select
                    value={formData.stageId}
                    onValueChange={(value) => handleInputChange('stageId', value)}
                  >
                    <SelectTrigger className="w-full brand-radius select-trigger-primary">
                      <SelectValue placeholder="Selecione a fase" />
                    </SelectTrigger>
                    <SelectContent className="dropdown-item-brand">
                      {funnelStages.map((stage: any) => (
                        <SelectItem key={stage.id} value={stage.id || 'none'} className="lead-dropdown-item">
                          {stage.name || 'Fase sem nome'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            </form>
            </div>
          </TabsContent>

          <TabsContent value="observacoes" className="p-6">
            <div className="text-center text-muted-foreground py-8">
              <p>Funcionalidade de Observações em desenvolvimento...</p>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="p-6">
            <div className="text-center text-muted-foreground py-8">
              <p>Funcionalidade de Histórico em desenvolvimento...</p>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Modal de Criação (sem abas)
        <form id="lead-form" onSubmit={handleSubmit} className="space-y-6 lead-modal-dropdown">
          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-white">
                Nome *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleFirstNameChange}
                className="brand-radius campo-primary-focus"
                placeholder="Digite o nome"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-white">
                Sobrenome
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="brand-radius campo-primary-focus"
                placeholder="Digite o sobrenome"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-white">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`brand-radius campo-primary-focus ${emailError ? 'border-red-500' : ''}`}
              placeholder="Digite o email"
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          {/* Telefone com DDI */}
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-white">
              Telefone
            </Label>
            <PhoneInput
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="Digite o telefone"
              className="w-full"
            />
          </div>

          {/* Origem */}
          <div>
            <Label htmlFor="source" className="block text-sm font-medium text-white">
              Origem
            </Label>
            <Select
              value={formData.sourceId}
              onValueChange={(value) => handleInputChange('sourceId', value)}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-primary">
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent className="dropdown-item-brand">
                <SelectItem value="none" className="lead-dropdown-item">Nenhuma origem</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id || 'none'} className="lead-dropdown-item">
                    {source.name || 'Fonte sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Funil */}
          <div>
            <Label htmlFor="funnel" className="block text-sm font-medium text-white">
              Funil *
            </Label>
            <Select
              value={formData.funnelId}
              onValueChange={(value) => handleInputChange('funnelId', value)}
              disabled={allowedFunnels.length === 0}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-primary">
                <SelectValue placeholder={allowedFunnels.length === 0 ? "Nenhum funil disponível" : "Selecione o funil"} />
              </SelectTrigger>
              <SelectContent className="dropdown-item-brand">
                {allowedFunnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id || 'none'} className="lead-dropdown-item">
                    {funnel.name || 'Funnel sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allowedFunnels.length === 0 && (
              <p className="text-yellow-500 text-sm mt-1">
                Você não tem acesso a nenhum funil. Entre em contato com o administrador.
              </p>
            )}
          </div>

          {/* Fase do Funil */}
          {formData.funnelId && formData.funnelId !== 'none' && funnelStages.length > 0 && (
            <div>
              <Label htmlFor="stage" className="block text-sm font-medium text-white">
                Fase do Funil *
              </Label>
              <Select
                value={formData.stageId}
                onValueChange={(value) => handleInputChange('stageId', value)}
              >
                <SelectTrigger className="w-full brand-radius select-trigger-primary">
                  <SelectValue placeholder="Selecione a fase" />
                </SelectTrigger>
                <SelectContent className="dropdown-item-brand">
                  {funnelStages.map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id || 'none'} className="lead-dropdown-item">
                      {stage.name || 'Fase sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Usuário Responsável */}
          <div>
            <Label htmlFor="responsible" className="block text-sm font-medium text-white">
              Usuário Responsável *
            </Label>
            <Select
              value={formData.responsibleId}
              onValueChange={(value) => handleInputChange('responsibleId', value)}
            >
              <SelectTrigger className="w-full brand-radius select-trigger-primary">
                <SelectValue placeholder="Selecione o usuário responsável" />
              </SelectTrigger>
              <SelectContent className="dropdown-item-brand">
                {crmUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id || 'none'} className="lead-dropdown-item">
                    {user.first_name || ''} {user.last_name || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        </form>
      )}
    </FullScreenModal>
  );
};
