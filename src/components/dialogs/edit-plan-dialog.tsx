
'use client';

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
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
import { db, auth } from '@/firebase'; // Added auth
import { doc, updateDoc } from 'firebase/firestore';

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onPlanEdited: () => void;
}

export function EditPlanDialog({ open, onOpenChange, plan, onPlanEdited }: EditPlanDialogProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Optionally handle user not authenticated if dialog is opened somehow
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleEditPlan = async (data: PlanFormData) => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (!plan?.id) {
        toast({ title: "Erro", description: "ID do plano inválido.", variant: "destructive" });
        return;
    }
    try {
      const planDocRef = doc(db, 'coaches', userId, 'plans', plan.id);
      // Ensure data structure matches PlanFormData (price can be 0, duration must be positive)
      const dataToUpdate: Partial<Plan> = {
        name: data.name,
        price: data.price ?? 0, // Default to 0 if undefined
        durationDays: data.durationDays,
        status: data.status,
      };
      await updateDoc(planDocRef, dataToUpdate);
      
      toast({
        title: "Plano Atualizado!",
        description: `O plano "${data.name}" foi atualizado com sucesso.`,
      });
      onPlanEdited(); 
      onOpenChange(false);
    } catch (error) {
        console.error("Error updating plan: ", error);
        toast({
            title: "Erro ao Atualizar Plano",
            description: "Não foi possível atualizar o plano. Tente novamente.",
            variant: "destructive",
        });
    }
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
          <PlanForm 
            onSubmit={handleEditPlan} 
            initialData={{
                ...plan, 
                price: plan.price ?? undefined, // Pass undefined if price is null/0 to PlanForm
                durationDays: plan.durationDays ?? undefined
            }} 
            submitButtonText="Salvar Alterações" 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
