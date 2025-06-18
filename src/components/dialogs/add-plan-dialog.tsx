
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlanForm, type PlanFormData } from '@/components/forms/plan-form';
import { MOCK_PLANS, type Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanAdded: () => void;
}

export function AddPlanDialog({ open, onOpenChange, onPlanAdded }: AddPlanDialogProps) {
  const { toast } = useToast();

  const handleAddPlan = async (data: PlanFormData) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const newPlan: Plan = {
      id: crypto.randomUUID(),
      ...data,
    };
    MOCK_PLANS.push(newPlan);
    toast({
      title: "Plano Adicionado!",
      description: `O plano "${data.name}" foi cadastrado com sucesso.`,
    });
    onPlanAdded(); // Callback to refresh parent component's plan list
    onOpenChange(false); // Close dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Plano</DialogTitle>
          <DialogDescription>Preencha os dados do novo plano.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PlanForm onSubmit={handleAddPlan} submitButtonText="Adicionar Plano" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
