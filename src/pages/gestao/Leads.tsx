import { useMemo, useState } from 'react';
import { GestaoLayout } from '@/components/Layout/GestaoLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Columns3, Trash2 } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLeadFields } from '@/hooks/useLeadFields';
import { DynamicLeadFields } from '@/components/DynamicLeadFields';

type Lead = {
  id: string;
  created_at?: string;
  origem?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  responsavel?: string;
  reunioes?: number;
  vendas?: number;
  valor?: number;
  ip?: string;
  browser?: string;
  device?: string;
  pais?: string;
  url?: string;
  parametros?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_source?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  fbid?: string;
  crm_id?: string;
};

const ALL_COLUMNS: { key: keyof Lead | 'trash'; label: string }[] = [
  { key: 'created_at', label: 'Criado em' },
  { key: 'origem', label: 'Origem' },
  { key: 'nome', label: 'Nome do lead' },
  { key: 'telefone', label: 'Telefone do lead' },
  { key: 'email', label: 'Email do lead' },
  { key: 'responsavel', label: 'Responsável' },
  { key: 'reunioes', label: 'Reuniões' },
  { key: 'vendas', label: 'Vendas' },
  { key: 'valor', label: 'Valor' },
  { key: 'ip', label: 'IP' },
  { key: 'browser', label: 'Browser' },
  { key: 'device', label: 'Device' },
  { key: 'pais', label: 'País' },
  { key: 'url', label: 'URL' },
  { key: 'parametros', label: 'Parametros' },
  { key: 'utm_campaign', label: 'utm_campaign' },
  { key: 'utm_medium', label: 'utm_medium' },
  { key: 'utm_content', label: 'utm_content' },
  { key: 'utm_source', label: 'utm_source' },
  { key: 'utm_term', label: 'utm_term' },
  { key: 'gclid', label: 'gclid' },
  { key: 'fbclid', label: 'fbclid' },
  { key: 'fbc', label: 'fbc' },
  { key: 'fbp', label: 'fbp' },
  { key: 'fbid', label: 'fbid' },
  { key: 'crm_id', label: 'CRM ID' },
  { key: 'trash', label: 'Excluir' },
];

const DEFAULT_VISIBLE: (keyof Lead | 'trash')[] = [
  'created_at',
  'origem',
  'nome',
  'telefone',
  'email',
  'responsavel',
  'reunioes',
  'vendas',
  'valor',
];

export default function GestaoLeads() {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads', selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('company_id', selectedCompanyId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Lead[];
    }
  });

  // Carregar campos dinâmicos de lead
  const { data: leadFields = [], isLoading: loadingFields } = useLeadFields();
  const [visibleColumns, setVisibleColumns] = useState<(keyof Lead | 'trash')[]>(DEFAULT_VISIBLE);
  const [openModal, setOpenModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState<Lead>({
    id: '',
    created_at: '',
    responsavel: '',
    ip: '',
    browser: '',
    device: '',
    pais: '',
    url: '',
    parametros: '',
    utm_campaign: '',
    utm_medium: '',
    utm_content: '',
    utm_source: '',
    utm_term: '',
    gclid: '',
    fbclid: '',
    fbc: '',
    fbp: '',
    fbid: '',
    crm_id: '',
  });

  // Estado para campos dinâmicos
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const columnsMap = useMemo(() => {
    const map: Record<string, string> = {};
    ALL_COLUMNS.forEach(c => { map[c.key as string] = c.label; });
    return map;
  }, []);

  const startCreate = () => {
    setEditingLead(null);
    setForm({ id: '', created_at: '', responsavel: '', ip: '', browser: '', device: '', pais: '', url: '', parametros: '', utm_campaign: '', utm_medium: '', utm_content: '', utm_source: '', utm_term: '', gclid: '', fbclid: '', fbc: '', fbp: '', fbid: '', crm_id: '' });
    setDynamicFields({});
    setFieldErrors({});
    setShowAdvanced(false);
    setOpenModal(true);
  };

  const startEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm({ ...lead });
    // Carregar campos dinâmicos do lead se existirem
    setDynamicFields({});
    setFieldErrors({});
    setShowAdvanced(false);
    setOpenModal(true);
  };

  const saveLead = async () => {
    if (!selectedCompanyId) return;
    
    // Validar campos obrigatórios
    const errors: Record<string, string> = {};
    leadFields.forEach(field => {
      if (field.required) {
        const value = dynamicFields[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
          errors[field.id] = `${field.name} é obrigatório`;
        }
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      let leadId: string;
      
      if (editingLead) {
        const { error } = await supabase
          .from('leads')
          .update({
            created_at: form.created_at || null,
            responsavel: form.responsavel || null,
            ip: form.ip || null,
            browser: form.browser || null,
            device: form.device || null,
            pais: form.pais || null,
            url: form.url || null,
            parametros: form.parametros || null,
            utm_campaign: form.utm_campaign || null,
            utm_medium: form.utm_medium || null,
            utm_content: form.utm_content || null,
            utm_source: form.utm_source || null,
            utm_term: form.utm_term || null,
            gclid: form.gclid || null,
            fbclid: form.fbclid || null,
            fbc: form.fbc || null,
            fbp: form.fbp || null,
            fbid: form.fbid || null,
            crm_id: form.crm_id || null,
          })
          .eq('id', editingLead.id);
        if (error) throw error;
        leadId = editingLead.id;
      } else {
        const payload: any = {
          company_id: selectedCompanyId,
          created_at: form.created_at || null,
          responsavel: form.responsavel || null,
          ip: form.ip || null,
          browser: form.browser || null,
          device: form.device || null,
          pais: form.pais || null,
          url: form.url || null,
          parametros: form.parametros || null,
          utm_campaign: form.utm_campaign || null,
          utm_medium: form.utm_medium || null,
          utm_content: form.utm_content || null,
          utm_source: form.utm_source || null,
          utm_term: form.utm_term || null,
          gclid: form.gclid || null,
          fbclid: form.fbclid || null,
          fbc: form.fbc || null,
          fbp: form.fbp || null,
          fbid: form.fbid || null,
          crm_id: form.crm_id || null,
        };
        const { data, error } = await supabase.from('leads').insert(payload).select().single();
        if (error) throw error;
        leadId = data.id;
      }
      
      // Salvar campos dinâmicos se existirem
      if (Object.keys(dynamicFields).length > 0) {
        const customValues = Object.entries(dynamicFields).map(([fieldId, value]) => {
          const baseRecord = {
            lead_id: leadId,
            field_id: fieldId,
            created_at: new Date().toISOString()
          };
          
          // Determinar o tipo de valor e salvar na coluna apropriada
          if (typeof value === 'string') {
            return { ...baseRecord, value_text: value };
          } else if (typeof value === 'number') {
            return { ...baseRecord, value_numeric: value };
          } else if (value instanceof Date) {
            return { ...baseRecord, value_timestamp: value.toISOString() };
          } else if (Array.isArray(value) || typeof value === 'object') {
            return { ...baseRecord, value_jsonb: value };
          } else {
            return { ...baseRecord, value_text: String(value) };
          }
        });
        
        if (customValues.length > 0) {
          const { error: customError } = await supabase
            .from('lead_custom_values')
            .upsert(customValues, { onConflict: 'lead_id,field_id' });
          if (customError) throw customError;
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: ['leads', selectedCompanyId] });
      setOpenModal(false);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['leads', selectedCompanyId] });
  };

  const toggleColumn = (key: keyof Lead | 'trash') => {
    setVisibleColumns(prev => {
      const exists = prev.includes(key);
      if (exists) {
        const next = prev.filter(k => k !== key);
        // assegurar ao menos 1 coluna
        return next.length > 0 ? next : prev;
      } else {
        return [...prev, key];
      }
    });
  };

  const isVisible = (key: keyof Lead | 'trash') => visibleColumns.includes(key);

  return (
    <GestaoLayout>
      <div className="max-w-[1200px] mx-auto space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Leads</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="brand-radius" title="Escolher colunas">
                    <Columns3 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {ALL_COLUMNS.map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.key as string}
                      checked={isVisible(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="brand-radius" onClick={startCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingLead ? 'Editar lead' : 'Adicionar lead'}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {/* Campos dinâmicos baseados na configuração da empresa */}
                    {loadingFields ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground">Carregando campos...</div>
                      </div>
                    ) : leadFields.length > 0 ? (
                      <DynamicLeadFields
                        fields={leadFields}
                        values={dynamicFields}
                        onChange={(fieldId, value) => setDynamicFields(prev => ({ ...prev, [fieldId]: value }))}
                        errors={fieldErrors}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Nenhum campo personalizado configurado. Configure campos em Definições → Campos Lead.
                      </div>
                    )}
                    
                    {/* Campos adicionais sempre presentes */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-4">Campos Adicionais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Criado em</Label>
                          <Input type="datetime-local" value={form.created_at || ''} onChange={e => setForm(prev => ({ ...prev, created_at: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-sm">Responsável</Label>
                          <Input value={form.responsavel || ''} onChange={e => setForm(prev => ({ ...prev, responsavel: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Toggle avançado */}
                  <div className="py-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={showAdvanced} onCheckedChange={(v) => setShowAdvanced(Boolean(v))} />
                      Mostrar campos avançados
                    </label>
                  </div>

                  {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                      <div>
                        <Label className="text-sm">IP</Label>
                        <Input value={form.ip || ''} onChange={e => setForm(prev => ({ ...prev, ip: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Browser</Label>
                        <Input value={form.browser || ''} onChange={e => setForm(prev => ({ ...prev, browser: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Device</Label>
                        <Input value={form.device || ''} onChange={e => setForm(prev => ({ ...prev, device: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">País</Label>
                        <Input value={form.pais || ''} onChange={e => setForm(prev => ({ ...prev, pais: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm">URL</Label>
                        <Input value={form.url || ''} onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm">Parâmetros</Label>
                        <Input value={form.parametros || ''} onChange={e => setForm(prev => ({ ...prev, parametros: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">utm_campaign</Label>
                        <Input value={form.utm_campaign || ''} onChange={e => setForm(prev => ({ ...prev, utm_campaign: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">utm_medium</Label>
                        <Input value={form.utm_medium || ''} onChange={e => setForm(prev => ({ ...prev, utm_medium: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">utm_content</Label>
                        <Input value={form.utm_content || ''} onChange={e => setForm(prev => ({ ...prev, utm_content: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">utm_source</Label>
                        <Input value={form.utm_source || ''} onChange={e => setForm(prev => ({ ...prev, utm_source: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">utm_term</Label>
                        <Input value={form.utm_term || ''} onChange={e => setForm(prev => ({ ...prev, utm_term: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">gclid</Label>
                        <Input value={form.gclid || ''} onChange={e => setForm(prev => ({ ...prev, gclid: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">fbclid</Label>
                        <Input value={form.fbclid || ''} onChange={e => setForm(prev => ({ ...prev, fbclid: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">fbc</Label>
                        <Input value={form.fbc || ''} onChange={e => setForm(prev => ({ ...prev, fbc: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">fbp</Label>
                        <Input value={form.fbp || ''} onChange={e => setForm(prev => ({ ...prev, fbp: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">fbid</Label>
                        <Input value={form.fbid || ''} onChange={e => setForm(prev => ({ ...prev, fbid: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-sm">CRM ID</Label>
                        <Input value={form.crm_id || ''} onChange={e => setForm(prev => ({ ...prev, crm_id: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button onClick={saveLead}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map(colKey => (
                      <TableHead key={colKey as string}>{columnsMap[colKey as string]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground py-6">
                        Nenhum lead cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map(lead => (
                      <TableRow key={lead.id} className="cursor-pointer" onClick={() => startEdit(lead)}>
                        {visibleColumns.map(colKey => {
                          if (colKey === 'trash') {
                            return (
                              <TableCell key={`${lead.id}_trash`} onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}>
                                <Button variant="outline" size="icon" className="h-8 w-8" title="Excluir">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            );
                          }
                          const value = (lead as any)[colKey];
                          return (
                            <TableCell key={`${lead.id}_${colKey}`}>{value ?? '-'}</TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </GestaoLayout>
  );
}



