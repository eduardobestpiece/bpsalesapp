
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
import { useCompany } from '@/contexts/CompanyContext';

// Torna transparente a cor de fundo dominante (amostrada nas bordas) de um PNG
async function makePngBackgroundTransparent(inputFile: File): Promise<{ blob: Blob; filename: string }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(inputFile);
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Desenha a imagem original
  ctx.drawImage(img, 0, 0);
  const { width, height } = canvas;

  // Amostra pixels das bordas para determinar a cor de fundo dominante
  const sampleBorder = (step = 4) => {
    const samples: number[] = [];
    const pushPixel = (x: number, y: number) => {
      const data = ctx.getImageData(x, y, 1, 1).data;
      samples.push(data[0], data[1], data[2]);
    };
    for (let x = 0; x < width; x += step) { pushPixel(x, 0); pushPixel(x, height - 1); }
    for (let y = 0; y < height; y += step) { pushPixel(0, y); pushPixel(width - 1, y); }
    // média simples
    let r = 0, g = 0, b = 0; const n = samples.length / 3;
    for (let i = 0; i < samples.length; i += 3) { r += samples[i]; g += samples[i + 1]; b += samples[i + 2]; }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)] as const;
  };

  const [br, bg, bb] = sampleBorder(6);
  const tolerance = 28; // tolerância para variações do fundo (ajustável)
  const isBg = (r: number, g: number, b: number) => Math.abs(r - br) <= tolerance && Math.abs(g - bg) <= tolerance && Math.abs(b - bb) <= tolerance;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Se parecer com o fundo, zera alfa
    if (isBg(r, g, b)) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const blob: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/png'));
  const baseName = inputFile.name.replace(/\.[^.]+$/, '') || 'logo';
  return { blob, filename: `${baseName}-transparent.png` };
}

function SettingsEmpresaInner() {
  const { companyId, userRole } = useCrmAuth();
  const { selectedCompanyId } = useCompany();
  const effectiveCompanyId = selectedCompanyId || companyId; // empresa que está sendo gerida
  const queryClient = useQueryClient();

  const canEdit = useMemo(() => userRole === 'admin' || userRole === 'master', [userRole]);

  // Branding
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

  const [squarePreview, setSquarePreview] = useState<string>('');
  const [horizontalPreview, setHorizontalPreview] = useState<string>('');
  const [horizontalDarkPreview, setHorizontalDarkPreview] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#A86F57');
  const [secondaryColor, setSecondaryColor] = useState<string>('#6B7280');
  const [borderRadiusPx, setBorderRadiusPx] = useState<number>(8);
  const lastSecondaryRef = useRef<string>('#6B7280');
  const lastRadiusRef = useRef<number>(8);
  const [isUploadingSquare, setIsUploadingSquare] = useState(false);
  const [isUploadingHorizontal, setIsUploadingHorizontal] = useState(false);
  const [isUploadingHorizontalDark, setIsUploadingHorizontalDark] = useState(false);

  useEffect(() => {
    if (branding) {
      const assigned = {
        square: branding.logo_square_url || '',
        horiz: branding.logo_horizontal_url || branding.logo_vertical_url || '',
        horizDark: branding.logo_horizontal_dark_url || '',
        primary: branding.primary_color || '#A86F57',
        secondary: (branding.secondary_color ?? lastSecondaryRef.current ?? '#6B7280'),
        radius: (typeof branding.border_radius_px === 'number' ? branding.border_radius_px : (lastRadiusRef.current ?? 8)),
      };
      
      setSquarePreview(assigned.square);
      setHorizontalPreview(assigned.horiz);
      setHorizontalDarkPreview(assigned.horizDark);
      setPrimaryColor(assigned.primary);
      setSecondaryColor(assigned.secondary);
      setBorderRadiusPx(assigned.radius);
      // Atualiza refs quando a API retornar valores válidos
      if (branding.secondary_color) lastSecondaryRef.current = branding.secondary_color;
      if (typeof branding.border_radius_px === 'number') lastRadiusRef.current = branding.border_radius_px;
    }
  }, [branding]);

  const normalizeHex = (val: string): string => {
    if (!val) return '#000000';
    let v = val.trim();
    // remove múltiplos '#'
    v = v.replace(/^#+/, '');
    // manter 6 dígitos hexadecimais
    v = v.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    if (v.length < 6) {
      v = v.padEnd(6, '0');
    }
    return `#${v.toLowerCase()}`;
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
      
      // Se existe, update; se não, insert
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
      
      // Atualiza cache imediatamente com os valores salvos para evitar regressão visual
      queryClient.setQueryData(['company_branding', effectiveCompanyId], (old: any) => ({
        ...(old || { company_id: effectiveCompanyId }),
        ...variables,
      }));
      await queryClient.invalidateQueries({ queryKey: ['company_branding', effectiveCompanyId] });
      await queryClient.refetchQueries({ queryKey: ['company_branding', effectiveCompanyId] });
      
    },
    onError: (_e: any) => {}
  });

  const handleUpload = async (file: File, type: 'square' | 'horizontal' | 'horizontal_dark') => {
    if (!effectiveCompanyId) {
      toast.error('Empresa não encontrada');
      return;
    }
    try {
      
      if (type === 'square') setIsUploadingSquare(true);
      if (type === 'horizontal') setIsUploadingHorizontal(true);
      if (type === 'horizontal_dark') setIsUploadingHorizontalDark(true);

      // Se for PNG, tenta remover fundo dominante e forçar transparência
      let toUploadBlob: Blob = file;
      let uploadExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      if ((file.type && file.type.includes('png')) || uploadExt === 'png') {
        try {
          const processed = await makePngBackgroundTransparent(file);
          toUploadBlob = processed.blob;
          uploadExt = 'png';
          
        } catch (err) {
          
        }
      }

      const ext = uploadExt || 'png';
      const path = `${effectiveCompanyId}/${type}.${ext}`;
      
      const bucket = supabase.storage.from('branding');

      const { data: uploadData, error: upError } = await bucket.upload(path, toUploadBlob, {
        cacheControl: '1',
        upsert: true,
        contentType: 'image/png',
      });
      if (upError) throw upError;

      const { data: pub } = bucket.getPublicUrl(path);
      const publicUrl = pub.publicUrl + `?v=${Date.now()}`; // cache-busting
      
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
      
    } catch (e: any) {
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
      const payload = {
        primary_color: normalizeHex(primaryColor),
        secondary_color: normalizeHex(secondaryColor),
        border_radius_px: borderRadiusPx,
      };
      // Atualiza refs imediatamente para servir de fallback pós-refetch
      lastSecondaryRef.current = payload.secondary_color;
      lastRadiusRef.current = payload.border_radius_px;
      await upsertBranding.mutateAsync(payload);
      toast.success('Configurações visuais salvas!');
    } catch (e: any) {
      toast.error('Erro ao salvar cor: ' + (e?.message || 'erro desconhecido'));
    }
  };

  // Company Profile (sem mudanças)
  const { data: profile } = useQuery({
    queryKey: ['company_profile', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      if (error) throw error;
      return data as any | null;
    },
    onSuccess(_data) {}
  });

  // Fallback: caso não exista profile ainda, buscar ao menos o nome em companies
  const { data: companyRow } = useQuery({
    queryKey: ['company', effectiveCompanyId],
    enabled: !!effectiveCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id,name,status')
        .eq('id', effectiveCompanyId as string)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string; status?: string } | null;
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

  // Se não houver profile (ou nome vazio), usar nome da tabela companies
  useEffect(() => {
    if (!profile && companyRow?.name) {
      setName(prev => prev || companyRow.name);
    }
  }, [profile, companyRow]);

  const upsertProfile = useMutation({
    mutationFn: async () => {
      if (!effectiveCompanyId) throw new Error('Empresa não definida');
      const values = {
        company_id: effectiveCompanyId,
        name, cnpj, niche, cep, address: street, number, neighborhood, city, state: state, country, timezone
      };
      const { data: existing } = await supabase
        .from('company_profiles')
        .select('company_id')
        .eq('company_id', effectiveCompanyId as string)
        .maybeSingle();
      if (existing?.company_id) {
        const { error } = await supabase
          .from('company_profiles')
          .update(values)
          .eq('company_id', effectiveCompanyId as string);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_profiles')
          .insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_profile', effectiveCompanyId] });
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold">Empresa</h1>
            <p className="text-muted-foreground">Configure os dados cadastrais e o visual da sua empresa.</p>
          </div>
        </div>

        {/* Dados Cadastrais */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados da empresa</CardTitle>
                <CardDescription>Preencha as informações cadastrais.</CardDescription>
              </div>
              <Button onClick={() => upsertProfile.mutate()} disabled={!canEdit || upsertProfile.isPending}
                className="text-white"
                style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
              >
                {upsertProfile.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar dados da empresa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome da empresa</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Nicho</Label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>CEP</Label>
                <Input value={cep} onChange={(e) => handleCepChange(e.target.value)} disabled={!canEdit} placeholder="Somente números"
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input value={street} onChange={(e) => setStreet(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Número</Label>
                <Input value={number} onChange={(e) => setNumber(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Bairro</Label>
                <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Input value={state} onChange={(e) => setStateUF(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>País</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} disabled={!canEdit}
                  style={{ borderRadius: 'var(--brand-radius, 8px)' }}
                />
              </div>
              <div className="space-y-1">
                <Label>Fuso horário</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger style={{ borderRadius: 'var(--brand-radius, 8px)' }}>
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
          </CardContent>
        </Card>

        {/* Identidade visual (abaixo) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Identidade visual</CardTitle>
                <CardDescription>Envie suas logos e defina a cor primária.</CardDescription>
              </div>
              <Button onClick={handlePrimaryColorSave} disabled={!canEdit || upsertBranding.isPending}
                className="text-white"
                style={{ backgroundColor: 'var(--brand-primary, #A86F57)', borderRadius: 'var(--brand-radius, 8px)' }}
              >
                {upsertBranding.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
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
                    className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
                    style={{ minHeight: 120 }}
                    onClick={() => canEdit && horizontalInputRef.current?.click()}
                  >
                    {horizontalPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={horizontalPreview} alt="Logo horizontal" className="h-auto max-h-28 w-auto" />
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
                    className="relative w-full border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer p-3"
                    style={{ minHeight: 120 }}
                    onClick={() => canEdit && horizontalDarkInputRef.current?.click()}
                  >
                    {horizontalDarkPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={horizontalDarkPreview} alt="Logo horizontal (dark)" className="h-auto max-h-28 w-auto" />
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
    </div>
  );
}

export default function SettingsEmpresa() {
  return (
    <SettingsLayout>
      <SettingsEmpresaInner />
    </SettingsLayout>
  );
} 