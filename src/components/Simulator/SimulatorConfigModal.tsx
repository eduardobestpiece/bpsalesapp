import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '../ui/dialog';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';

interface SimulatorConfigModalProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onSaveAndApply: () => void;
  onReset: () => void;
}

export const SimulatorConfigModal: React.FC<SimulatorConfigModalProps> = ({
  open,
  onClose,
  onApply,
  onSaveAndApply,
  onReset,
}) => {
  // Estado global Manual/Sistema
  const [isManualGlobal, setIsManualGlobal] = useState(false);

  // Placeholders para os campos
  // Em breve: estados dinâmicos e integração

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle className="flex items-center justify-between">
        Mais configurações
        <div className="flex items-center gap-2">
          <span className="text-xs">Sistema</span>
          <Switch checked={isManualGlobal} onCheckedChange={setIsManualGlobal} />
          <span className="text-xs">Manual</span>
        </div>
      </DialogTitle>
      <DialogContent className="space-y-4">
        {/* Administradora */}
        <div>
          <label className="block font-medium">Administradora</label>
          <Select /* opções dinâmicas em breve */ />
        </div>
        {/* Tipo de Crédito */}
        <div>
          <label className="block font-medium">Tipo de Crédito</label>
          <Select /* opções dinâmicas em breve */ />
        </div>
        {/* Parcelas */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Parcelas</label>
          <Checkbox /* Manual/Sistema individual */ />
          <span className="text-xs">Manual</span>
        </div>
        <Select /* ou <Input type="number" /> se manual */ />
        {/* Taxa de administração */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Taxa de administração</label>
          <Checkbox /* Manual/Sistema individual */ />
          <span className="text-xs">Manual</span>
        </div>
        <Input type="number" placeholder="%" />
        {/* Fundo de reserva */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Fundo de reserva</label>
          <Checkbox /* Manual/Sistema individual */ />
          <span className="text-xs">Manual</span>
        </div>
        <Input type="number" placeholder="%" />
        {/* Ativar seguro */}
        <div>
          <label className="font-medium">Ativar seguro</label>
          <div className="flex gap-4 mt-1">
            <label className="flex items-center gap-1">
              <input type="radio" name="seguro" value="nao_incluir" defaultChecked /> Não incluir
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" name="seguro" value="incluir" /> Incluir
            </label>
          </div>
          {/* Se incluir, mostrar campo percentual */}
          {/* <Input type="number" placeholder="%" /> */}
        </div>
        {/* Redução de parcela */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Redução de parcela</label>
          <Checkbox /* Manual/Sistema individual */ />
          <span className="text-xs">Manual</span>
        </div>
        {/* Campos dinâmicos em breve */}
        {/* Atualização anual do crédito */}
        <div className="flex items-center gap-2">
          <label className="font-medium">Atualização anual do crédito</label>
          <Checkbox /* Manual/Sistema individual */ />
          <span className="text-xs">Manual</span>
        </div>
        {/* Campos dinâmicos em breve */}
      </DialogContent>
      <DialogActions>
        <Button variant="outline" onClick={onReset}>Redefinir</Button>
        <Button variant="secondary" onClick={onApply}>Aplicar</Button>
        <Button onClick={onSaveAndApply}>Salvar e Aplicar</Button>
      </DialogActions>
    </Dialog>
  );
}; 