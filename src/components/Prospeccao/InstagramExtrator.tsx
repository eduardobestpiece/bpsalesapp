import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, Plus, Eye, Archive, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface InstagramProfile {
  id: string;
  name: string;
  username: string;
  instagram_id: string;
  phone?: string;
  email?: string;
  profile_url: string;
  profile_url_normalized: string;
  bio_url?: string;
  created_at: string;
  is_archived: boolean;
  source: 'manual' | 'list' | 'google';
  raw_data?: any;
}

export function InstagramExtrator() {
  const [extractionMethod, setExtractionMethod] = useState<'single' | 'multiple' | 'from-google'>('single');
  const [singleUrl, setSingleUrl] = useState('');
  const [multipleUrls, setMultipleUrls] = useState('');
  const { toast } = useToast();
  const { companyId } = useCrmAuth();
  const queryClient = useQueryClient();

  // Buscar perfis do Instagram do banco de dados
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['prospect_instagram_profiles', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospect_instagram_profiles')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InstagramProfile[];
    },
  });

  // Mutation para extrair perfil
  const extractProfileMutation = useMutation({
    mutationFn: async (data: { urls: string[]; source: 'manual' | 'list' | 'google' }) => {
      // TODO: Implementar integração com Apify Instagram Scrapper
      // Por enquanto, simular dados
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const profilesToInsert = data.urls.map(url => {
        // Simular extração de dados do perfil
        const username = url.split('/').pop() || 'usuario_exemplo';
        return {
          company_id: companyId,
          source: data.source,
          name: `Perfil ${username}`,
          username: username,
          instagram_id: username,
          phone: '+55 11 99999-9999',
          email: `${username}@example.com`,
          profile_url: url,
          profile_url_normalized: url.split('?')[0], // Remove parâmetros
          bio_url: 'https://example.com',
          raw_data: { extracted_at: new Date().toISOString() },
        };
      });

      const { data: result, error } = await supabase
        .from('prospect_instagram_profiles')
        .insert(profilesToInsert)
        .select();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['prospect_instagram_profiles', companyId] });
      toast({
        title: "Sucesso",
        description: `${result.length} perfil(is) extraído(s) com sucesso.`,
      });
      
      // Limpar formulário
      setSingleUrl('');
      setMultipleUrls('');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao extrair perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleExtract = async () => {
    if (extractionMethod === 'single' && !singleUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL do Instagram.",
        variant: "destructive",
      });
      return;
    }

    if (extractionMethod === 'multiple' && !multipleUrls.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira as URLs do Instagram.",
        variant: "destructive",
      });
      return;
    }

    const urls = extractionMethod === 'single' 
      ? [singleUrl.trim()]
      : multipleUrls.trim().split('\n').filter(url => url.trim());

    extractProfileMutation.mutate({
      urls,
      source: extractionMethod === 'from-google' ? 'google' : 'manual',
    });
  };

  const handleViewDetails = (profile: InstagramProfile) => {
    // TODO: Implementar modal de detalhes
    console.log('Ver detalhes:', profile);
  };

  // Mutation para arquivar perfil
  const archiveProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('prospect_instagram_profiles')
        .update({ is_archived: true })
        .eq('id', profileId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospect_instagram_profiles', companyId] });
      toast({
        title: "Sucesso",
        description: "Perfil arquivado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao arquivar perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleArchive = (profileId: string) => {
    archiveProfileMutation.mutate(profileId);
  };

  const visibleProfiles = profiles.filter(p => !p.is_archived);

  return (
    <div className="space-y-6">
      {/* Formulário de Extração */}
      <Card>
        <CardHeader>
          <CardTitle>Fazer Extração</CardTitle>
          <CardDescription>
            Escolha o método de extração e configure os parâmetros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Método de Extração */}
          <div className="space-y-2">
            <Label>Método de Extração</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={extractionMethod === 'single' ? 'default' : 'outline'}
                onClick={() => setExtractionMethod('single')}
                className="justify-start"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Perfil Específico
              </Button>
              <Button
                variant={extractionMethod === 'multiple' ? 'default' : 'outline'}
                onClick={() => setExtractionMethod('multiple')}
                className="justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Múltiplos Perfis
              </Button>
              <Button
                variant={extractionMethod === 'from-google' ? 'default' : 'outline'}
                onClick={() => setExtractionMethod('from-google')}
                className="justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Do Google Scrapper
              </Button>
            </div>
          </div>

          {/* Campos de Entrada */}
          {extractionMethod === 'single' && (
            <div className="space-y-2">
              <Label htmlFor="single-url">URL do Instagram</Label>
              <Input
                id="single-url"
                placeholder="https://instagram.com/usuario"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
              />
            </div>
          )}

          {extractionMethod === 'multiple' && (
            <div className="space-y-2">
              <Label htmlFor="multiple-urls">URLs do Instagram (uma por linha)</Label>
              <Textarea
                id="multiple-urls"
                placeholder="https://instagram.com/usuario1&#10;https://instagram.com/usuario2&#10;https://instagram.com/usuario3"
                value={multipleUrls}
                onChange={(e) => setMultipleUrls(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {extractionMethod === 'from-google' && (
            <div className="space-y-2">
              <Label>Selecionar URLs do Google Scrapper</Label>
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Esta funcionalidade permitirá selecionar URLs do Instagram encontradas nas pesquisas do Google Scrapper.
                </p>
                <Button variant="outline" className="mt-2" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Selecionar URLs
                </Button>
              </div>
            </div>
          )}

          <Button onClick={handleExtract} disabled={extractProfileMutation.isPending}>
            {extractProfileMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Extraindo...
              </>
            ) : (
              <>
                <Instagram className="h-4 w-4 mr-2" />
                Iniciar Extração
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Perfis Extraídos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Perfis Extraídos</CardTitle>
              <CardDescription>
                {visibleProfiles.length} perfil(s) extraído(s)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {visibleProfiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>ID Instagram</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Link da Bio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProfiles.map((profile) => (
                  <TableRow key={profile.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {new Date(profile.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {profile.name}
                    </TableCell>
                    <TableCell>
                      @{profile.instagram_id}
                    </TableCell>
                    <TableCell>
                      {profile.phone || '-'}
                    </TableCell>
                    <TableCell>
                      {profile.email || '-'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a 
                        href={profile.profile_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.profile_url}
                      </a>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {profile.bio_url ? (
                        <a 
                          href={profile.bio_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {profile.bio_url}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(profile)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchive(profile.id)}
                                  disabled={archiveProfileMutation.isPending}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Instagram className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Nenhum perfil extraído
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Configure os parâmetros de extração acima e clique em "Iniciar Extração" para começar.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
