import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ImageIcon, Trash2, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LossReasonsManager, OriginsManager } from '@/components/Managers/DefinicoesManagers';
import { TagsManager, PhasesManager } from '@/components/Managers/TagsPhasesManagers';
import { UsersManager } from '@/components/Managers/UsersManager';
import { usePermissions } from '@/hooks/usePermissions';
import SettingsPerfil from './SettingsPerfil';

export default function SettingsGestao() {
  const { companyId } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = selectedCompanyId || companyId;
  const permissions = usePermissions();
  const [searchParams] = useSearchParams();

  // Determinar aba padrão baseado nas permissões ou parâmetro da URL
  const getDefaultTab = () => {
    // Verificar se há parâmetro 'tab' na URL
    const urlTab = searchParams.get('tab');
    if (urlTab && ['company', 'users', 'origens', 'motivos-perda', 'tags', 'fases', 'perfil'].includes(urlTab)) {
      return urlTab as 'company' | 'users' | 'origens' | 'motivos-perda' | 'tags' | 'fases' | 'perfil';
    }
    
    // Fallback para lógica baseada em permissões
    if (permissions.canAccessConfigurations) {
      return 'company';
    } else if (permissions.canAccessPerfil) {
      return 'perfil';
    }
    return 'company';
  };

  const [tabValue, setTabValue] = useState<'company' | 'users' | 'origens' | 'motivos-perda' | 'tags' | 'fases' | 'perfil'>(getDefaultTab());

  // Atualizar aba quando o parâmetro da URL mudar
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['company', 'users', 'origens', 'motivos-perda', 'tags', 'fases', 'perfil'].includes(urlTab)) {
      setTabValue(urlTab as 'company' | 'users' | 'origens' | 'motivos-perda' | 'tags' | 'fases' | 'perfil');
    }
  }, [searchParams]);

  // Estado do formulário da empresa
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [niche, setNiche] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  // Branding
  const [primaryColor, setPrimaryColor] = useState('#E50F5E');
  const [secondaryColor, setSecondaryColor] = useState('#6B7280');
  const [borderRadiusPx, setBorderRadiusPx] = useState(8);

  // Previews e upload
  const [squarePreview, setSquarePreview] = useState('');
  const [horizontalPreview, setHorizontalPreview] = useState('');
  const [horizontalDarkPreview, setHorizontalDarkPreview] = useState('');
  const [isUploadingSquare, setIsUploadingSquare] = useState(false);
  const [isUploadingHorizontal, setIsUploadingHorizontal] = useState(false);
  const [isUploadingHorizontalDark, setIsUploadingHorizontalDark] = useState(false);
  const squareInputRef = useRef<HTMLInputElement>(null);
  const horizontalInputRef = useRef<HTMLInputElement>(null);
  const horizontalDarkInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Carregar dados básicos da empresa e perfil
  const { data: companyData } = useQuery({
    queryKey: ['company_info', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const [{ data: company }, { data: profile }] = await Promise.all([
        supabase.from('companies').select('id, name').eq('id', effectiveCompanyId as string).maybeSingle(),
        supabase.from('company_profiles').select('*').eq('company_id', effectiveCompanyId as string).maybeSingle(),
      ]);
      return { company, profile } as any;
    }
  });

  // Carregar branding
  const { data: companyBranding } = useQuery({
    queryKey: ['company_branding', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      return data;
    }
  });

  useEffect(() => {
    if (companyData) {
      setCompanyName(companyData.company?.name || '');
      setCnpj(companyData.profile?.cnpj || '');
      setNiche(companyData.profile?.niche || '');
      setCep(companyData.profile?.cep || '');
      setStreet(companyData.profile?.address || '');
      setNumber(companyData.profile?.number || '');
      setNeighborhood(companyData.profile?.neighborhood || '');
      setCity(companyData.profile?.city || '');
      setStateUF(companyData.profile?.state || '');
      setCountry(companyData.profile?.country || '');
      setTimezone(companyData.profile?.timezone || 'America/Sao_Paulo');
    }
  }, [companyData]);

  useEffect(() => {
    if (companyBranding) {
      setPrimaryColor(companyBranding.primary_color || '#E50F5E');
      setSecondaryColor(companyBranding.secondary_color || '#6B7280');
      setBorderRadiusPx(typeof companyBranding.border_radius_px === 'number' ? companyBranding.border_radius_px : 8);
      setSquarePreview(companyBranding.logo_square_url || '');
      setHorizontalPreview(companyBranding.logo_horizontal_url || companyBranding.logo_vertical_url || '');
      setHorizontalDarkPreview(companyBranding.logo_horizontal_dark_url || '');
    }
  }, [companyBranding]);

  const handleCepChange = async (value: string) => {
    setCep(value);
    const clean = value.replace(/[^\d]/g, '');
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || '');
          setNeighborhood(data.bairro || '');
          setCity(data.localidade || '');
          setStateUF(data.uf || '');
        }
      } catch {}
    }
  };

  const normalizeHex = (c: string) => {
    if (!c) return c;
    if (c.startsWith('#') && c.length === 4) {
      return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    }
    return c;
  };

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
        const { error } = await supabase
          .from('company_branding')
          .update(values)
          .eq('company_id', effectiveCompanyId as string);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_branding')
          .insert(values);
        if (error) throw error;
      }
    },
    onSuccess: async (_d, variables) => {
      queryClient.setQueryData(['company_branding', effectiveCompanyId], (old: any) => ({ ...(old || { company_id: effectiveCompanyId }), ...variables }));
      await queryClient.invalidateQueries({ queryKey: ['company_branding', effectiveCompanyId] });
      toast.success('Branding salvo!');
    }
  });

  const handleSaveCompany = async () => {
    if (!effectiveCompanyId) return;
    try {
      if (companyName.trim()) {
        const { error: companyErr } = await supabase
          .from('companies')
          .update({ name: companyName.trim() })
          .eq('id', effectiveCompanyId as string);
        if (companyErr) throw companyErr;
      }
      const profilePayload: any = {
        company_id: effectiveCompanyId,
        name: companyName.trim() || null,
        cnpj: cnpj || null,
        niche: niche || null,
        cep: cep || null,
        address: street || null,
        number: number || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: stateUF || null,
        country: country || 'Brasil',
        timezone: timezone || 'America/Sao_Paulo',
      };
      const { error: profileErr } = await supabase
          .from('company_profiles')
          .upsert(profilePayload, { onConflict: 'company_id' });
      if (profileErr) throw profileErr;
      toast.success('Dados da empresa salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['company_info', effectiveCompanyId] });
    } catch (e: any) {
      toast.error('Erro ao salvar empresa: ' + (e?.message || ''));
    }
  };

  const handleUpload = async (file: File, type: 'square' | 'horizontal' | 'horizontal_dark') => {
    if (!effectiveCompanyId) {
      toast.error('Empresa não encontrada');
      return;
    }
    try {
      if (type === 'square') setIsUploadingSquare(true);
      if (type === 'horizontal') setIsUploadingHorizontal(true);
      if (type === 'horizontal_dark') setIsUploadingHorizontalDark(true);

      const ext = file.name.split('.').pop();
      const fileName = `${effectiveCompanyId}/${type}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      const payload: any = {};
      if (type === 'square') { payload.logo_square_url = publicUrl; setSquarePreview(publicUrl); }
      if (type === 'horizontal') { payload.logo_horizontal_url = publicUrl; setHorizontalPreview(publicUrl); }
      if (type === 'horizontal_dark') { payload.logo_horizontal_dark_url = publicUrl; setHorizontalDarkPreview(publicUrl); }
      await upsertBranding.mutateAsync(payload);
    } catch (e: any) {
      toast.error('Erro ao enviar logo: ' + (e?.message || ''));
    } finally {
      if (type === 'square') setIsUploadingSquare(false);
      if (type === 'horizontal') setIsUploadingHorizontal(false);
      if (type === 'horizontal_dark') setIsUploadingHorizontalDark(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Definições</h1>
        <p className="text-muted-foreground">Gerencie dados da empresa e usuários.</p>
      </div>

      <Card className="shadow-xl border-0 bg-card">
        <CardContent className="p-0">
          <Tabs value={tabValue} onValueChange={(v) => setTabValue(v as any)} className="w-full">
            <TabsList className="flex items-end border-b border-border/30 bg-transparent p-0 rounded-none justify-start w-fit">
              {/* Aba Empresa - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <>
                  <TabsTrigger 
                    value="company" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  >
                    Empresa
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

              {/* Aba Usuários - apenas para usuários que podem gerenciar usuários */}
              {permissions.canManageUsers && (
                <>
                  <TabsTrigger 
                    value="users" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  >
                    Usuários
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

              {/* Aba Origens - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <>
                  <TabsTrigger 
                    value="origens" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  >
                    Origens
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

              {/* Aba Motivos de Perda - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <>
                  <TabsTrigger 
                    value="motivos-perda" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  >
                    Motivos de perda
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

              {/* Aba Tags - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <>
                  <TabsTrigger 
                    value="tags" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  >
                    Tags
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

              {/* Aba Fases - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <>
                  <TabsTrigger 
                    value="fases" 
                    className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
                  >
                    Fases
                  </TabsTrigger>
                  <div className="w-px h-6 bg-border/30 self-center"></div>
                </>
              )}

              {/* Aba Perfil - sempre visível */}
              <TabsTrigger 
                value="perfil" 
                className="relative bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5"
              >
                Perfil
              </TabsTrigger>
            </TabsList>

              {/* Conteúdo da aba Empresa - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <TabsContent value="company" className="p-6">
              {!effectiveCompanyId ? (
                <p className="text-muted-foreground">Selecione uma empresa para editar.</p>
              ) : (
                <div className="space-y-8 max-w-5xl">
                  {/* Dados cadastrais */}
                <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Nome da empresa</Label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>CNPJ</Label>
                        <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                        </div>
                        <div className="space-y-2">
                          <Label>Nicho</Label>
                        <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Ex: Imobiliário, Financeiro" />
                      </div>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>CEP</Label>
                        <Input value={cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="Somente números" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Endereço</Label>
                        <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua, Avenida, etc." />
                      </div>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Número</Label>
                        <Input value={number} onChange={(e) => setNumber(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Bairro</Label>
                        <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                        </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Estado</Label>
                        <Input value={stateUF} onChange={(e) => setStateUF(e.target.value)} placeholder="SP" />
                        </div>
                        <div className="space-y-2">
                          <Label>País</Label>
                        <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Brasil" />
                        </div>
                        <div className="space-y-2">
                          <Label>Fuso horário</Label>
                          <Select value={timezone} onValueChange={setTimezone}>
                          <SelectTrigger>
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

                    <div className="flex justify-end">
                      <Button onClick={handleSaveCompany} className="brand-radius" variant="brandPrimaryToSecondary">
                        Salvar dados da empresa
                      </Button>
                    </div>
                  </div>

                  {/* Identidade visual */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Identidade visual</h3>
                        <p className="text-sm text-muted-foreground">Envie as logos e defina cores/raio.</p>
                        </div>
                        <Button 
                        onClick={() => upsertBranding.mutate({ primary_color: primaryColor, secondary_color: secondaryColor, border_radius_px: borderRadiusPx })} 
                          disabled={upsertBranding.isPending}
                        className="brand-radius"
                        variant="brandPrimaryToSecondary"
                        >
                        {upsertBranding.isPending ? 'Salvando...' : 'Salvar branding'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Logo Quadrada */}
                        <div className="space-y-3">
                          <Label>Logo quadrada</Label>
                          <div
                          className="relative w-full aspect-square border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                          onClick={() => squareInputRef.current?.click()}
                          >
                            {squarePreview ? (
                              <img src={squarePreview} alt="Logo quadrada" className="w-full h-full object-contain" />
                            ) : (
                              <div className="text-muted-foreground flex flex-col items-center">
                                <ImageIcon className="h-10 w-10 mb-2" />
                                <span>Clique para enviar</span>
                              </div>
                            )}
                          {isUploadingSquare && (
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

                      {/* Logo Horizontal */}
                      <div className="space-y-3">
                            <Label>Logo horizontal</Label>
                            <div
                              className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
                              style={{ minHeight: 120 }}
                          onClick={() => horizontalInputRef.current?.click()}
                            >
                              {horizontalPreview ? (
                                <img src={horizontalPreview} alt="Logo horizontal" className="h-auto max-h-28 w-auto" />
                              ) : (
                                <div className="text-muted-foreground flex flex-col items-center">
                                  <ImageIcon className="h-10 w-10 mb-2" />
                                  <span>Clique para enviar</span>
                                </div>
                              )}
                          {isUploadingHorizontal && (
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

                      {/* Logo Horizontal Dark */}
                      <div className="space-y-3">
                        <Label>Logo horizontal (dark)</Label>
                            <div
                              className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
                              style={{ minHeight: 120 }}
                          onClick={() => horizontalDarkInputRef.current?.click()}
                            >
                              {horizontalDarkPreview ? (
                            <img src={horizontalDarkPreview} alt="Logo horizontal dark" className="h-auto max-h-28 w-auto" />
                              ) : (
                                <div className="text-muted-foreground flex flex-col items-center">
                                  <ImageIcon className="h-10 w-10 mb-2" />
                                  <span>Clique para enviar</span>
                                </div>
                              )}
                          {isUploadingHorizontalDark && (
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

                    {/* Cores e raio */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                          <Label>Cor primária</Label>
                          <div className="flex items-center gap-3">
                          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-16 border border-border bg-background" />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-40" placeholder="#E50F5E" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <Label>Cor secundária</Label>
                          <div className="flex items-center gap-3">
                          <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(normalizeHex(e.target.value))} className="h-10 w-16 border border-border bg-background" />
                          <Input value={secondaryColor} onChange={(e) => setSecondaryColor(normalizeHex(e.target.value))} className="w-40" placeholder="#6B7280" />
                          </div>
                          </div>
                      <div className="space-y-2">
                        <Label>Raio das bordas (px)</Label>
                        <Input type="number" min={0} max={32} value={borderRadiusPx} onChange={(e) => setBorderRadiusPx(Number(e.target.value))} className="w-32" />
                        </div>
                      </div>
                </div>
                    </div>
            )}
              </TabsContent>
              )}

              {/* Conteúdo da aba Usuários - apenas para usuários que podem gerenciar usuários */}
              {permissions.canManageUsers && (
                <TabsContent value="users" className="p-6">
                <UsersManager companyId={effectiveCompanyId as string} />
              </TabsContent>
              )}

              {/* Conteúdo da aba Origens - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <TabsContent value="origens" className="p-6">
                  <OriginsManager />
                </TabsContent>
              )}

              {/* Conteúdo da aba Motivos de Perda - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <TabsContent value="motivos-perda" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Motivos de perda</h3>
                    <p className="text-sm text-muted-foreground">Gerencie os motivos de perda de leads</p>
                  </div>
                  <Button onClick={() => window.dispatchEvent(new Event('open-loss-reason-modal'))}>
                    <Plus className="h-4 w-4 mr-2" />Adicionar motivo
                  </Button>
                </div>
                <LossReasonsManager />
              </div>
            </TabsContent>
              )}

              {/* Conteúdo da aba Tags - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <TabsContent value="tags" className="p-6">
                  <TagsManager />
                </TabsContent>
              )}

              {/* Conteúdo da aba Fases - apenas para usuários com acesso a configurações */}
              {permissions.canAccessConfigurations && (
                <TabsContent value="fases" className="p-6">
                  <PhasesManager />
                </TabsContent>
              )}

              {/* Conteúdo da aba Perfil - sempre visível */}
              <TabsContent value="perfil" className="p-6">
              <SettingsPerfil />
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
                  </div>
  );
}