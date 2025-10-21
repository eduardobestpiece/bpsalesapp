import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const CreatePermissionModal = ({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess?: () => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Permissão</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">Gestão de permissões do CRM foi removida.</div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
      </div>
      </DialogContent>
    </Dialog>
  );
};

export const EditPermissionModal = ({ open, onOpenChange, permission, onSuccess }: { open: boolean; onOpenChange: (o: boolean) => void; permission?: any; onSuccess?: () => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Permissão</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">Gestão de permissões do CRM foi removida.</div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </div>
      </DialogContent>
    </Dialog>
  );
}; 