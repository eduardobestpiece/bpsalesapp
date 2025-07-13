import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { getAdministrators } from '../../../src/hooks/useCrmData'; // Supondo hook para buscar administradoras

interface InstallmentReductionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  userRole: 'master' | 'admin' | 'submaster';
  companyId: string;
}

export const InstallmentReductionModal: React.FC<InstallmentReductionModalProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  userRole,
  companyId,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialData?.name || '');
  const [administratorId, setAdministratorId] = useState(initialData?.administratorId || '');
  const [reductionValue, setReductionValue] = useState(initialData?.reductionValue || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [archived, setArchived] = useState(initialData?.archived || false);
  const [administrators, setAdministrators] = useState<any[]>([]);

  useEffect(() => {
    // Buscar administradoras da empresa
    getAdministrators(companyId).then(setAdministrators);
  }, [companyId]);

  const handleSave = () => {
    if (!name || !administratorId || !reductionValue) {
      toast({ title: 'Preencha todos os campos obrigatórios.' });
      return;
    }
    onSave({
      name,
      administratorId,
      reductionValue,
      startDate,
      endDate,
      isDefault,
      archived,
    });
    onClose();
  };

  const canEdit = userRole === 'master' || userRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>{initialData ? 'Editar Redução de Parcela' : 'Cadastrar Redução de Parcela'}</DialogTitle>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <Input
            label="Nome da Redução"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={!canEdit}
            required
          />
          <Select
            label="Administradora"
            value={administratorId}
            onValueChange={setAdministratorId}
            disabled={!canEdit}
            required
          >
            <option value="">Selecione</option>
            {administrators.map((adm: any) => (
              <option key={adm.id} value={adm.id}>{adm.name}</option>
            ))}
          </Select>
          <Input
            label="Valor/Percentual de Redução"
            value={reductionValue}
            onChange={e => setReductionValue(e.target.value)}
            disabled={!canEdit}
            required
            type="number"
          />
          <Input
            label="Data de Início"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={!canEdit}
            type="date"
          />
          <Input
            label="Data de Fim"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={!canEdit}
            type="date"
          />
          <Checkbox
            label="Padrão da Empresa"
            checked={isDefault}
            onCheckedChange={setIsDefault}
            disabled={!canEdit}
          />
          {userRole === 'master' && (
            <Checkbox
              label="Arquivado"
              checked={archived}
              onCheckedChange={setArchived}
            />
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="secondary">Cancelar</Button>
        {canEdit && (
          <Button onClick={handleSave}>{initialData ? 'Salvar' : 'Cadastrar'}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 