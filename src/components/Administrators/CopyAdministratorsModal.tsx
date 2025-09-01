import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { Progress } from '@/components/ui/progress';

interface CopyAdministratorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Administrator {
  id: string;
  name: string;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
}

export const CopyAdministratorsModal: React.FC<CopyAdministratorsModalProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const { selectedCompanyId } = useCompany();
  
  const [administrators, setAdministrators] = useState<Administrator[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedAdministrators, setSelectedAdministrators] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');

  // Helpers de mapeamento anti-duplicação (desativados temporariamente)
  const getMappedTargetId = async (_sourceTable: string, _sourceId: string, _targetCompanyId: string): Promise<string | null> => {
    return null; // recurso de mapeamento desativado
  };

  const upsertMapping = async (_sourceTable: string, _sourceId: string, _targetCompanyId: string, _targetId: string): Promise<void> => {
    // no-op: recurso de mapeamento desativado
  };

  // Buscar administradoras e empresas
  useEffect(() => {
    if (open) {
      fetchAdministrators();
      fetchCompanies();
    }
  }, [open]);

  const fetchAdministrators = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, name, company_id')
        .eq('is_archived', false)
        .eq('company_id', selectedCompanyId)
        .order('name');
      
      if (error) throw error;
      setAdministrators(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar administradoras',
        variant: 'destructive'
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar empresas',
        variant: 'destructive'
      });
    }
  };

  const handleCopyAdministrators = async () => {
    if (selectedAdministrators.length === 0 || selectedCompanies.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos uma administradora e uma empresa',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressText('Preparando cópia...');
    try {
      // Buscar administradoras completas (fonte)
      const { data: adminsToCopy, error: adminsErr } = await supabase
        .from('administrators')
        .select('*')
        .in('id', selectedAdministrators);
      if (adminsErr) throw adminsErr;

      const totalSteps = selectedCompanies.length * (selectedAdministrators.length || 1) * 5; // admin, reduções, tipos, vínculos, produtos
      let step = 0;
      const tick = (label: string) => {
        step += 1;
        setProgress(Math.min(100, Math.round((step / Math.max(1, totalSteps)) * 100)));
        setProgressText(label);
      };

      // Utilitários para evitar duplicidade por nome
      const ensureAdminInTarget = async (companyId: string, sourceAdmin: any): Promise<string> => {
        // trava por mapeamento
        const mapped = await getMappedTargetId('administrators', sourceAdmin.id, companyId);
        if (mapped) return mapped;
        const { data: existing } = await supabase
          .from('administrators')
          .select('id')
          .eq('company_id', companyId)
          .ilike('name', sourceAdmin.name)
          .maybeSingle();
        if (existing?.id) {
          await upsertMapping('administrators', sourceAdmin.id, companyId, existing.id);
          return existing.id;
        }
        const insertAdmin = {
          name: sourceAdmin.name,
          credit_update_type: sourceAdmin.credit_update_type,
          update_month: sourceAdmin.update_month,
          grace_period_days: sourceAdmin.grace_period_days,
          max_embedded_percentage: sourceAdmin.max_embedded_percentage,
          special_entry_type: sourceAdmin.special_entry_type,
          special_entry_percentage: sourceAdmin.special_entry_percentage,
          special_entry_fixed_value: sourceAdmin.special_entry_fixed_value,
          special_entry_installments: sourceAdmin.special_entry_installments,
          is_archived: false,
          is_default: false,
          update_type: sourceAdmin.update_type,
          post_contemplation_adjustment: sourceAdmin.post_contemplation_adjustment,
          company_id: companyId
        };
        const { data: created, error } = await supabase
          .from('administrators')
          .insert(insertAdmin)
          .select('id')
          .single();
        if (error) throw error;
        await upsertMapping('administrators', sourceAdmin.id, companyId, created!.id as string);
        return created!.id as string;
      };

      const ensureReductionInTarget = async (companyId: string, adminId: string, reduction: any): Promise<string> => {
        const mapped = await getMappedTargetId('installment_reductions', reduction.id, companyId);
        if (mapped) return mapped;
        const { data: existing } = await supabase
          .from('installment_reductions')
          .select('id')
          .eq('company_id', companyId)
          .eq('administrator_id', adminId)
          .ilike('name', reduction.name)
          .maybeSingle();
        if (existing?.id) {
          await upsertMapping('installment_reductions', reduction.id, companyId, existing.id);
          return existing.id;
        }
        const insert = {
          name: reduction.name,
          company_id: companyId,
          administrator_id: adminId,
          reduction_percent: reduction.reduction_percent,
          applications: reduction.applications || [],
          is_archived: false,
        };
        const { data: created, error } = await supabase
          .from('installment_reductions')
          .insert(insert)
          .select('id')
          .single();
        if (error) throw error;
        await upsertMapping('installment_reductions', reduction.id, companyId, created!.id as string);
        return created!.id as string;
      };

      const ensureTypeInTarget = async (companyId: string, adminId: string, type: any): Promise<string> => {
        const mapped = await getMappedTargetId('installment_types', type.id, companyId);
        if (mapped) return mapped;
        const { data: existing } = await supabase
          .from('installment_types')
          .select('id')
          .eq('company_id', companyId)
          .eq('administrator_id', adminId)
          .ilike('name', type.name)
          .maybeSingle();
        if (existing?.id) {
          await upsertMapping('installment_types', type.id, companyId, existing.id);
          return existing.id;
        }
        const insert = {
          name: type.name,
          administrator_id: adminId,
          company_id: companyId,
          reduction_percentage: type.reduction_percentage,
          reduces_credit: type.reduces_credit,
          reduces_admin_tax: type.reduces_admin_tax,
          reduces_insurance: type.reduces_insurance,
          reduces_reserve_fund: type.reduces_reserve_fund,
          optional_insurance: type.optional_insurance,
          installment_count: type.installment_count,
          admin_tax_percent: type.admin_tax_percent,
          reserve_fund_percent: type.reserve_fund_percent,
          insurance_percent: type.insurance_percent,
          is_archived: false,
          is_default: false,
          annual_update_rate: type.annual_update_rate
        };
        const { data: created, error } = await supabase
          .from('installment_types')
          .insert(insert)
          .select('id')
          .single();
        if (error) throw error;
        await upsertMapping('installment_types', type.id, companyId, created!.id as string);
        return created!.id as string;
      };

      const ensureProductInTarget = async (companyId: string, adminId: string, product: any): Promise<string> => {
        const mapped = await getMappedTargetId('products', product.id, companyId);
        if (mapped) return mapped;
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('company_id', companyId)
          .eq('administrator_id', adminId)
          .ilike('name', product.name)
          .maybeSingle();
        if (existing?.id) {
          await upsertMapping('products', product.id, companyId, existing.id);
          return existing.id;
        }
        const insert = {
          name: product.name,
          type: product.type,
          administrator_id: adminId,
          company_id: companyId,
          credit_value: product.credit_value,
          admin_tax_percent: product.admin_tax_percent,
          reserve_fund_percent: product.reserve_fund_percent,
          insurance_percent: product.insurance_percent,
          installment_value: product.installment_value,
          is_archived: false
        };
        const { data: created, error } = await supabase
          .from('products')
          .insert(insert)
          .select('id')
          .single();
        if (error) throw error;
        await upsertMapping('products', product.id, companyId, created!.id as string);
        return created!.id as string;
      };

      for (const targetCompanyId of selectedCompanies) {
        for (const admin of adminsToCopy || []) {
          // 1) Admin
          tick(`Copiando administradora "${admin.name}"`);
          const newAdminId = await ensureAdminInTarget(targetCompanyId, admin);

          // 2) Reduções (map antigo->novo)
          const { data: srcReductions } = await supabase
            .from('installment_reductions')
            .select('*')
            .eq('administrator_id', admin.id);
          const reductionMap = new Map<string, string>();
          for (const r of srcReductions || []) {
            tick(`Copiando redução: ${r.name}`);
            const newId = await ensureReductionInTarget(targetCompanyId, newAdminId, r);
            reductionMap.set(r.id, newId);
          }

          // 3) Tipos (map antigo->novo)
          const { data: srcTypes } = await supabase
            .from('installment_types')
            .select('*')
            .eq('administrator_id', admin.id);
          const typeMap = new Map<string, string>();
          for (const t of srcTypes || []) {
            tick(`Copiando tipo: ${t.name}`);
            const newId = await ensureTypeInTarget(targetCompanyId, newAdminId, t);
            typeMap.set(t.id, newId);
          }

          // 4) Vinculos tipo x redução
          if ((srcTypes || []).length) {
            const { data: typeRels } = await supabase
              .from('installment_type_reductions')
              .select('*')
              .in('installment_type_id', (srcTypes || []).map(t => t.id));
            for (const rel of typeRels || []) {
              const newTypeId = typeMap.get(rel.installment_type_id);
              const newReductionId = reductionMap.get(rel.installment_reduction_id);
              if (!newTypeId || !newReductionId) continue;
              tick('Vinculando tipo ↔ redução');
              // evitar duplicar
              const { data: exists } = await supabase
                .from('installment_type_reductions')
                .select('id')
                .eq('installment_type_id', newTypeId)
                .eq('installment_reduction_id', newReductionId)
                .maybeSingle();
              if (!exists) {
                await supabase
                  .from('installment_type_reductions')
                  .insert({ installment_type_id: newTypeId, installment_reduction_id: newReductionId });
              }
            }
          }

          // 5) Produtos (map antigo->novo)
          const { data: srcProducts } = await supabase
            .from('products')
            .select('*')
            .eq('administrator_id', admin.id);
          const productMap = new Map<string, string>();
          for (const p of srcProducts || []) {
            tick(`Copiando produto: ${p.name}`);
            const newId = await ensureProductInTarget(targetCompanyId, newAdminId, p);
            productMap.set(p.id, newId);
          }

          // 6) Vinculos produto x tipo
          if ((srcProducts || []).length) {
            const { data: pits } = await supabase
              .from('product_installment_types')
              .select('*')
              .in('product_id', (srcProducts || []).map(p => p.id));
            for (const rel of pits || []) {
              const newProdId = productMap.get(rel.product_id);
              const newTypeId = typeMap.get(rel.installment_type_id);
              if (!newProdId || !newTypeId) continue;
              tick('Vinculando produto ↔ tipo');
              const { data: exists } = await supabase
                .from('product_installment_types')
                .select('id')
                .eq('product_id', newProdId)
                .eq('installment_type_id', newTypeId)
                .maybeSingle();
              if (!exists) {
                await supabase
                  .from('product_installment_types')
                  .insert({ product_id: newProdId, installment_type_id: newTypeId });
              }
            }
          }
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Administradoras e dados vinculados copiados com sucesso!'
      });

      // Limpar seleções
      setSelectedAdministrators([]);
      setSelectedCompanies([]);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar dados: ' + (err.message || ''),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setProgress(100);
      setProgressText('Concluído');
    }
  };

  const toggleAdministrator = (adminId: string) => {
    setSelectedAdministrators(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleClose = () => {
    setSelectedAdministrators([]);
    setSelectedCompanies([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copiar administradoras e dados vinculados</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCopyAdministrators} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
          {loading && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{progressText}</div>
              <Progress value={progress} className="h-3" />
            </div>
          )}
          {/* Administradoras */}
          <div className="space-y-3">
            <Label>Administradora</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {administrators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma administradora disponível</p>
              ) : (
                <div className="space-y-2">
                  {administrators.map((admin) => (
                    <div
                      key={admin.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedAdministrators.includes(admin.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleAdministrator(admin.id)}
                    >
                      <span className="text-sm">{admin.name}</span>
                      {selectedAdministrators.includes(admin.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedAdministrators.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedAdministrators.map((adminId) => {
                  const admin = administrators.find(a => a.id === adminId);
                  return (
                    <Badge key={adminId} variant="outline" className="text-xs">
                      {admin?.name}
                      <button
                        onClick={() => toggleAdministrator(adminId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Empresas */}
          <div className="space-y-3">
            <Label>Fazer uma cópia para</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma empresa disponível</p>
              ) : (
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                        selectedCompanies.includes(company.id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleCompany(company.id)}
                    >
                      <span className="text-sm">{company.name}</span>
                      {selectedCompanies.includes(company.id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedCompanies.map((companyId) => {
                  const company = companies.find(c => c.id === companyId);
                  return (
                    <Badge key={companyId} variant="outline" className="text-xs">
                      {company?.name}
                      <button
                        onClick={() => toggleCompany(companyId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="brandOutlineSecondaryHover" className="brand-radius" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              variant="brandPrimaryToSecondary"
              className="brand-radius"
              onClick={handleCopyAdministrators} 
              disabled={selectedAdministrators.length === 0 || selectedCompanies.length === 0 || loading}
            >
              {loading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 