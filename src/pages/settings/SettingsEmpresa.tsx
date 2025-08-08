
import { useEffect, useMemo, useRef, useState } from 'react';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Upload, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsEmpresa() {
  const { companyId, userRole } = useCrmAuth();
  const queryClient = useQueryClient();

  const canEdit = useMemo(() => userRole === 'admin' || userRole === 'master', [userRole]);

  // Branding
  const { data: branding } = useQuery({
    queryKey: ['company_branding', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    }
  });

  const [squarePreview, setSquarePreview] = useState<string>('');
  const [horizontalPreview, setHorizontalPreview] = useState<string>('');
  const [horizontalDarkPreview, setHorizontalDarkPreview] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#A86F57');
  const [isUploadingSquare, setIsUploadingSquare] = useState(false);
  const [isUploadingHorizontal, setIsUploadingHorizontal] = useState(false);
  const [isUploadingHorizontalDark, setIsUploadingHorizontalDark] = useState(false);

  useEffect(() => {
    if (branding) {
      setSquarePreview(branding.logo_square_url || '');
      setHorizontalPreview(branding.logo_horizontal_url || branding.logo_vertical_url || '');
      setHorizontalDarkPreview(branding.logo_horizontal_dark_url || '');
      setPrimaryColor(branding.primary_color || '#A86F57');
    }
  }, [branding]);

  const upsertBranding = useMutation({
    mutationFn: async (payload: Partial<{ logo_square_url: string; logo_horizontal_url: string; logo_horizontal_dark_url: string; primary_color: string }>) => {
      if (!companyId) throw new Error('Empresa não definida');
      const values = { company_id: companyId, ...payload } as any;
      console.debug('[Branding/Upsert] payload', values);
      // Se existe, update; se não, insert
      const { data: existing } = await supabase
        .from('company_branding')
        .select('company_id')
        .eq('company_id', companyId)
        .maybeSingle();
      console.debug('[Branding/Upsert] existing?', existing);
      if (existing?.company_id) {
        const { error } = await supabase
          .from('company_branding')
          .update(values)
          .eq('company_id', companyId);
        if (error) {
          console.error('[Branding/Upsert] update error', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('company_branding')
          .insert(values);
        if (error) {
          console.error('[Branding/Upsert] insert error', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      console.debug('[Branding/Upsert] success, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['company_branding', companyId] });
    }
  });

  const handleUpload = async (file: File, type: 'square' | 'horizontal' | 'horizontal_dark') => {
    if (!companyId) {
      toast.error('Empresa não encontrada');
      return;
    }
    try {
      console.group('[Branding/Upload]');
      console.debug('type', type);
      console.debug('companyId', companyId);
      console.debug('file', { name: file.name, size: file.size, type: file.type });

      if (type === 'square') setIsUploadingSquare(true);
      if (type === 'horizontal') setIsUploadingHorizontal(true);
      if (type === 'horizontal_dark') setIsUploadingHorizontalDark(true);

      const { data: authData } = await supabase.auth.getUser();
      console.debug('authUser', authData?.user?.id, authData?.user?.email);

      // Conferir vínculo crm_users
      if (authData?.user?.id) {
        const { data: crmCheck } = await supabase
          .from('crm_users')
          .select('id, company_id, role')
          .eq('id', authData.user.id)
          .maybeSingle();
        console.debug('crm_users check', crmCheck);
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${companyId}/${type}.${ext}`;
      console.debug('storage path', path);
      const bucket = supabase.storage.from('branding');

      const { data: uploadData, error: upError } = await bucket.upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/png',
      });
      console.debug('upload result', uploadData, upError);
      if (upError) throw upError;

      const { data: pub } = bucket.getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      console.debug('publicUrl', publicUrl);

      if (type === 'square') {
        setSquarePreview(publicUrl);
        await upsertBranding.mutateAsync({ logo_square_url: publicUrl });
        toast.success('Logo quadrada atualizada!');
      } else if (type === 'horizontal') {
        setHorizontalPreview(publicUrl);
        await upsertBranding.mutateAsync({ logo_horizontal_url: publicUrl });
        toast.success('Logo horizontal atualizada!');
      } else {
        setHorizontalDarkPreview(publicUrl);
        await upsertBranding.mutateAsync({ logo_horizontal_dark_url: publicUrl });
        toast.success('Logo horizontal (dark) atualizada!');
      }
      console.groupEnd();
    } catch (e: any) {
      console.error('[Branding/Upload] error', e);
      toast.error('Falha no upload: ' + (e?.message || 'erro desconhecido'));
    } finally {
      setIsUploadingSquare(false);
      setIsUploadingHorizontal(false);
      setIsUploadingHorizontalDark(false);
    }
  };

  const squareInputRef = useRef<HTMLInputElement>(null);
  const horizontalInputRef = useRef<HTMLInputElement>(null);
  const horizontalDarkInputRef = useRef<HTMLInputElement>(null);

  const handlePrimaryColorSave = async () => {
    try {
      await upsertBranding.mutateAsync({ primary_color: primaryColor });
      toast.success('Cor primária salva!');
    } catch (e: any) {
      toast.error('Erro ao salvar cor: ' + (e?.message || 'erro desconhecido'));
    }
  };

  // Company Profile (sem mudanças)
  const { data: profile } = useQuery({
    queryKey: ['company_profile', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
    onSuccess(data) {
      console.debug('[CompanyProfile] loaded', data);
    }
  });

  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [niche, setNiche] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateUF] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCnpj(profile.cnpj || '');
      setNiche(profile.niche || '');
      setCep(profile.cep || '');
      setStreet(profile.address || '');
      setNumber(profile.number || '');
      setNeighborhood(profile.neighborhood || '');
      setCity(profile.city || '');
      setStateUF(profile.state || '');
      setCountry(profile.country || 'Brasil');
      setTimezone(profile.timezone || 'America/Sao_Paulo');
    }
  }, [profile]);

  const upsertProfile = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Empresa não definida');
      const values = {
        company_id: companyId,
        name, cnpj, niche, cep, address: street, number, neighborhood, city, state: state, country, timezone
      };
      const { data: existing } = await supabase
        .from('company_profiles')
        .select('company_id')
        .eq('company_id', companyId)
        .maybeSingle();
      if (existing?.company_id) {
        const { error } = await supabase
          .from('company_profiles')
          .update(values)
          .eq('company_id', companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_profiles')
          .insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_profile', companyId] });
      toast.success('Informações da empresa salvas!');
    },
    onError: (e: any) => toast.error('Erro ao salvar: ' + (e?.message || 'erro'))
  });

  const handleCepChange = async (value: string) => {
    const onlyDigits = value.replace(/\D/g, '');
    setCep(onlyDigits);
    if (onlyDigits.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${onlyDigits}/json/`);
        const data = await res.json();
        if (data.erro) {
          toast.error('CEP não encontrado');
          return;
        }
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setStateUF(data.uf || '');
        if (!country) setCountry('Brasil');
      } catch (e) {
        toast.error('Erro ao buscar CEP');
      }
    }
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold">Empresa</h1>
              <p className="text-muted-foreground">Configure os dados cadastrais e o visual da sua empresa.</p>
            </div>
          </div>

          {/* Linha: Logo Quadrada | Logos Horizontais (light/dark) | Cor Primária */}
          <Card>
            <CardHeader>
              <CardTitle>Identidade visual</CardTitle>
              <CardDescription>Envie suas logos e defina a cor primária.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Logo Quadrada */}
                <div className="space-y-3">
                  <Label>Logo quadrada</Label>
                  <div
                    className="w-full aspect-square border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => canEdit && squareInputRef.current?.click()}
                  >
                    {squarePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={squarePreview} alt="Logo quadrada" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span>Clique para enviar</span>
                      </div>
                    )}
                    {(isUploadingSquare) && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>
                    )}
                  </div>
                  <Input type="file" accept="image/*" ref={squareInputRef} className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f, 'square');
                  }} />
                </div>

                {/* Logos Horizontais: light + dark */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logo horizontal</Label>
                    <div
                      className="relative w-full aspect-[5/2] border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => canEdit && horizontalInputRef.current?.click()}
                    >
                      {horizontalPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={horizontalPreview} alt="Logo horizontal" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center">
                          <ImageIcon className="h-10 w-10 mb-2" />
                          <span>Clique para enviar</span>
                        </div>
                      )}
                      {(isUploadingHorizontal) && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>
                      )}
                    </div>
                    <Input type="file" accept="image/*" ref={horizontalInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'horizontal');
                    }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo horizontal (dark mode)</Label>
                    <div
                      className="relative w-full aspect-[5/2] border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => canEdit && horizontalDarkInputRef.current?.click()}
                    >
                      {horizontalDarkPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={horizontalDarkPreview} alt="Logo horizontal (dark)" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-muted-foreground flex flex-col items-center">
                          <ImageIcon className="h-10 w-10 mb-2" />
                          <span>Clique para enviar</span>
                        </div>
                      )}
                      {(isUploadingHorizontalDark) && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>
                      )}
                    </div>
                    <Input type="file" accept="image/*" ref={horizontalDarkInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'horizontal_dark');
                    }} />
                  </div>
                </div>

                {/* Cor Primária */}
                <div className="space-y-3">
                  <Label>Cor primária</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-16 rounded-md border border-border bg-background"
                      disabled={!canEdit}
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-40"
                      placeholder="#A86F57"
                      disabled={!canEdit}
                    />
                  </div>
                  <Button onClick={handlePrimaryColorSave} disabled={!canEdit || upsertBranding.isPending}>
                    {upsertBranding.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Salvar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Cadastrais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da empresa</CardTitle>
              <CardDescription>Preencha as informações cadastrais.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nome da empresa</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>CNPJ</Label>
                  <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Nicho</Label>
                  <Input value={niche} onChange={(e) => setNiche(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>CEP</Label>
                  <Input value={cep} onChange={(e) => handleCepChange(e.target.value)} disabled={!canEdit} placeholder="Somente números" />
                </div>
                <div className="space-y-1">
                  <Label>Endereço</Label>
                  <Input value={street} onChange={(e) => setStreet(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>Número</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Input value={state} onChange={(e) => setStateUF(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
                  <Label>País</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} disabled={!canEdit} />
                </div>
                <div className="space-y-1">
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
                      <SelectItem value="America/Belem">America/Belem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={() => upsertProfile.mutate()} disabled={!canEdit || upsertProfile.isPending}>
                  {upsertProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar dados da empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
} 