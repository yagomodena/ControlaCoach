
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlanForm, type PlanFormData } from '@/components/forms/plan-form';
import { MOCK_PLANS, type Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onPlanEdited: () => void;
}

export function EditPlanDialog({ open, onOpenChange, plan, onPlanEdited }: EditPlanDialogProps) {
  const { toast } = useToast();

  const handleEditPlan = async (data: PlanFormData) => {
    if (!plan) return;
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    
    const planIndex = MOCK_PLANS.findIndex(p => p.id === plan.id);
    if (planIndex !== -1) {
      MOCK_PLANS[planIndex] = { ...MOCK_PLANS[planIndex], ...data };
    }
    
    toast({
      title: "Plano Atualizado!",
      description: `O plano "${data.name}" foi atualizado com sucesso.`,
    });
    onPlanEdited(); // Callback to refresh parent component's plan list
    onOpenChange(false); // Close dialog
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Plano: {plan.name}</DialogTitle>
          <DialogDescription>Modifique os dados do plano abaixo.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PlanForm onSubmit={handleEditPlan} initialData={plan} submitButtonText="Salvar Alterações" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
