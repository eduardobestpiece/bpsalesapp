
import { useEffect, useMemo, useRef, useState } from 'react';
import { SettingsLayout } from '@/components/Layout/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsLeyout() {/* página substituída por SettingsEmpresa */ return null; }
  const { companyId, userRole } = useCrmAuth();
  const queryClient = useQueryClient();

  const canEdit = useMemo(() => userRole === 'admin' || userRole === 'master', [userRole]);

  const { data: branding, isLoading } = useQuery({
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
  const [verticalPreview, setVerticalPreview] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState<string>('#A86F57');
  const [isUploadingSquare, setIsUploadingSquare] = useState(false);
  const [isUploadingVertical, setIsUploadingVertical] = useState(false);

  useEffect(() => {
    if (branding) {
      setSquarePreview(branding.logo_square_url || '');
      setVerticalPreview(branding.logo_vertical_url || '');
      setPrimaryColor(branding.primary_color || '#A86F57');
    }
  }, [branding]);

  const upsertBranding = useMutation({
    mutationFn: async (payload: Partial<{ logo_square_url: string; logo_vertical_url: string; primary_color: string }>) => {
      if (!companyId) throw new Error('Empresa não definida');
      const values = { company_id: companyId, ...payload } as any;
      // Se já existe, fazer update; senão, insert
      if (branding?.company_id) {
        const { error } = await supabase
          .from('company_branding')
          .update(values)
          .eq('company_id', companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_branding')
          .insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_branding', companyId] });
    }
  });

  const handleUpload = async (file: File, type: 'square' | 'vertical') => {
    if (!companyId) {
      toast.error('Empresa não encontrada');
      return;
    }
    try {
      type === 'square' ? setIsUploadingSquare(true) : setIsUploadingVertical(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${companyId}/${type}.${ext}`;
      const bucket = supabase.storage.from('branding');

      // Upload com upsert
      const { error: upError } = await bucket.upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (upError) throw upError;

      const { data: pub } = bucket.getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      if (type === 'square') {
        setSquarePreview(publicUrl);
        await upsertBranding.mutateAsync({ logo_square_url: publicUrl });
        toast.success('Logo quadrada atualizada!');
      } else {
        setVerticalPreview(publicUrl);
        await upsertBranding.mutateAsync({ logo_vertical_url: publicUrl });
        toast.success('Logo vertical atualizada!');
      }
    } catch (e: any) {
      toast.error('Falha no upload: ' + (e?.message || 'erro desconhecido'));
    } finally {
      setIsUploadingSquare(false);
      setIsUploadingVertical(false);
    }
  };

  const squareInputRef = useRef<HTMLInputElement>(null);
  const verticalInputRef = useRef<HTMLInputElement>(null);

  const handlePrimaryColorSave = async () => {
    try {
      await upsertBranding.mutateAsync({ primary_color: primaryColor });
      toast.success('Cor primária salva!');
    } catch (e: any) {
      toast.error('Erro ao salvar cor: ' + (e?.message || 'erro desconhecido'));
    }
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Leyout</h1>
            <p className="text-muted-foreground">Envie suas logos e defina a cor primária da marca.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo Quadrada</CardTitle>
                <CardDescription>Ideal para favicon, avatares e espaços quadrados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full aspect-square border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                    {squarePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={squarePreview} alt="Logo quadrada" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span>Sem logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" ref={squareInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'square');
                    }} />
                    <Button variant="outline" onClick={() => squareInputRef.current?.click()} disabled={!canEdit || isUploadingSquare}>
                      {isUploadingSquare ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {isUploadingSquare ? 'Enviando...' : 'Enviar logo'}
                    </Button>
                    {squarePreview && (
                      <Button variant="ghost" onClick={async () => {
                        setSquarePreview('');
                        await upsertBranding.mutateAsync({ logo_square_url: '' });
                      }} disabled={!canEdit || isUploadingSquare}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo Vertical</CardTitle>
                <CardDescription>Para cabeçalhos e espaços verticais.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full aspect-[3/4] border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                    {verticalPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={verticalPreview} alt="Logo vertical" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span>Sem logo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" ref={verticalInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, 'vertical');
                    }} />
                    <Button variant="outline" onClick={() => verticalInputRef.current?.click()} disabled={!canEdit || isUploadingVertical}>
                      {isUploadingVertical ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {isUploadingVertical ? 'Enviando...' : 'Enviar logo'}
                    </Button>
                    {verticalPreview && (
                      <Button variant="ghost" onClick={async () => {
                        setVerticalPreview('');
                        await upsertBranding.mutateAsync({ logo_vertical_url: '' });
                      }} disabled={!canEdit || isUploadingVertical}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cor primária</CardTitle>
              <CardDescription>Defina a cor principal da sua marca na plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="primary-color">Cor</Label>
                  <input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-16 rounded-md border border-border bg-background"
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="primary-color-hex">HEX</Label>
                  <Input
                    id="primary-color-hex"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-36"
                    placeholder="#A86F57"
                    disabled={!canEdit}
                  />
                </div>
                <Button onClick={handlePrimaryColorSave} disabled={!canEdit || upsertBranding.isPending}>
                  {upsertBranding.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
} 