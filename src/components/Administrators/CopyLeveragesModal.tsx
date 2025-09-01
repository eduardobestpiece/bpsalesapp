import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useCompany } from '@/contexts/CompanyContext'
import { Progress } from '@/components/ui/progress'

interface CopyLeveragesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Company { id: string; name: string }

interface Leverage {
  id: string
  name: string
  type: string | null
  subtype: string | null
  has_fixed_property_value: boolean | null
  fixed_property_value: number | null
  daily_percentage: number | null
  rental_percentage: number | null
  occupancy_rate: number | null
  management_percentage: number | null
  total_expenses: number | null
  real_estate_percentage: number | null
  is_archived: boolean | null
}

export const CopyLeveragesModal: React.FC<CopyLeveragesModalProps> = ({ open, onOpenChange }) => {
  const { selectedCompanyId } = useCompany()
  const { toast } = useToast()

  const [companies, setCompanies] = useState<Company[]>([])
  const [leverages, setLeverages] = useState<Leverage[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedLeverages, setSelectedLeverages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  useEffect(() => {
    if (!open) return
    fetchCompanies()
    fetchLeverages()
  }, [open, selectedCompanyId])

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, status')
      .eq('status', 'active')
      .order('name')
    if (!error) setCompanies((data || []).filter(c => c.id !== selectedCompanyId))
  }

  const fetchLeverages = async () => {
    if (!selectedCompanyId) { setLeverages([]); return; }
    const { data, error } = await supabase
      .from('leverages')
      .select('id, name, type, subtype, has_fixed_property_value, fixed_property_value, daily_percentage, rental_percentage, occupancy_rate, management_percentage, total_expenses, real_estate_percentage, is_archived')
      .eq('company_id', selectedCompanyId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    if (!error) setLeverages(data || [])
  }

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => prev.includes(companyId) ? prev.filter(id => id !== companyId) : [...prev, companyId])
  }

  const toggleLeverage = (levId: string) => {
    setSelectedLeverages(prev => prev.includes(levId) ? prev.filter(id => id !== levId) : [...prev, levId])
  }

  // Mapeamento desativado temporariamente (evita dependência de tabela ausente)
  const getMappedTargetId = async (_sourceId: string, _targetCompanyId: string): Promise<string | null> => {
    return null;
  };

  const upsertMapping = async (_sourceId: string, _targetCompanyId: string, _targetId: string) => {
    // no-op
  };

  const ensureLeverageInTarget = async (companyId: string, lev: Leverage): Promise<string> => {
    const mapped = await getMappedTargetId(lev.id, companyId)
    if (mapped) return mapped
    const { data: existing } = await supabase
      .from('leverages')
      .select('id')
      .eq('company_id', companyId)
      .ilike('name', lev.name)
      .maybeSingle()
    if (existing?.id) {
      await upsertMapping(lev.id, companyId, existing.id)
      return existing.id
    }
    const insert = {
      name: lev.name,
      type: lev.type,
      subtype: lev.subtype,
      has_fixed_property_value: lev.has_fixed_property_value,
      fixed_property_value: lev.fixed_property_value,
      daily_percentage: lev.daily_percentage,
      rental_percentage: lev.rental_percentage,
      occupancy_rate: lev.occupancy_rate,
      management_percentage: lev.management_percentage,
      total_expenses: lev.total_expenses,
      real_estate_percentage: lev.real_estate_percentage,
      is_archived: false,
      company_id: companyId
    }
    const { data: created, error } = await supabase
      .from('leverages')
      .insert(insert)
      .select('id')
      .single()
    if (error) throw error
    await upsertMapping(lev.id, companyId, created!.id as string)
    return created!.id as string
  }

  const handleCopy = async () => {
    if (selectedLeverages.length === 0 || selectedCompanies.length === 0) {
      toast({ title: 'Atenção', description: 'Selecione pelo menos uma alavanca e uma empresa', variant: 'destructive' })
      return
    }
    setLoading(true)
    setProgress(0)
    setProgressText('Iniciando cópia...')
    try {
      const { data: sourceLeveragesRes } = await supabase
        .from('leverages')
        .select('*')
        .in('id', selectedLeverages)

      const sourceLeverages = sourceLeveragesRes || []
      const total = Math.max(1, selectedCompanies.length * sourceLeverages.length)
      let idx = 0
      for (const companyId of selectedCompanies) {
        for (const lev of sourceLeverages) {
          setProgressText(`Copiando alavanca: ${lev.name}`)
          await ensureLeverageInTarget(companyId, lev as Leverage)
          idx += 1
          setProgress(Math.min(100, Math.round((idx / total) * 100)))
        }
      }
      setProgress(100)
      setProgressText('Concluído')
      toast({ title: 'Sucesso', description: 'Alavancas copiadas com sucesso!' })
      setSelectedCompanies([])
      setSelectedLeverages([])
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro', description: 'Erro ao copiar alavancas: ' + (err.message || ''), variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedCompanies([])
    setSelectedLeverages([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copiar alavancas para outras empresas</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleCopy(); }} className="space-y-6 bg-[#1F1F1F] p-6 rounded-lg">
          {loading && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{progressText}</div>
              <Progress value={progress} className="h-3" />
            </div>
          )}

          <div className="space-y-3">
            <Label>Alavancas (empresa atual)</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              {leverages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma alavanca disponível</p>
              ) : (
                <div className="space-y-2">
                  {leverages.map(l => (
                    <div key={l.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedLeverages.includes(l.id) ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                      onClick={() => toggleLeverage(l.id)}
                    >
                      <span className="text-sm">{l.name}</span>
                      {selectedLeverages.includes(l.id) && (
                        <Badge variant="secondary" className="text-xs">Selecionada</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedLeverages.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedLeverages.map(id => {
                  const lev = leverages.find(l => l.id === id)
                  return (
                    <Badge key={id} variant="outline" className="text-xs">
                      {lev?.name}
                      <button onClick={() => toggleLeverage(id)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Copiar para empresas</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              {companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma empresa disponível</p>
              ) : (
                <div className="space-y-2">
                  {companies.map(c => (
                    <div key={c.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedCompanies.includes(c.id) ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                      onClick={() => toggleCompany(c.id)}
                    >
                      <span className="text-sm">{c.name}</span>
                      {selectedCompanies.includes(c.id) && (
                        <Badge variant="secondary" className="text-xs">Selecionada</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCompanies.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedCompanies.map(id => {
                  const cmp = companies.find(c => c.id === id)
                  return (
                    <Badge key={id} variant="outline" className="text-xs">
                      {cmp?.name}
                      <button onClick={() => toggleCompany(id)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="brandOutlineSecondaryHover" className="brand-radius" onClick={handleClose} disabled={loading}>Cancelar</Button>
            <Button variant="brandPrimaryToSecondary" className="brand-radius" onClick={handleCopy} disabled={loading || selectedCompanies.length===0 || selectedLeverages.length===0}>
              {loading ? 'Copiando...' : 'Copiar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 