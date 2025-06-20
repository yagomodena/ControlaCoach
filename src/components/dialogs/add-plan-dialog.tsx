
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
import { type Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AddPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanAdded: () => void;
}

export function AddPlanDialog({ open, onOpenChange, onPlanAdded }: AddPlanDialogProps) {
  const { toast } = useToast();

  const handleAddPlan = async (data: PlanFormData) => {
    try {
      await addDoc(collection(db, 'plans'), data);
      toast({
        title: "Plano Adicionado!",
        description: `O plano "${data.name}" foi cadastrado com sucesso.`,
      });
      onPlanAdded(); 
      onOpenChange(false); 
    } catch (error) {
      console.error("Error adding plan: ", error);
      toast({
        title: "Erro ao Adicionar Plano",
        description: "Não foi possível cadastrar o plano. Tente novamente.",
        variant: "destructive",
      });
    }
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
