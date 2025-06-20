
'use client';

import React, { useState, useEffect } from 'react'; 
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
import { db, auth } from '@/firebase'; 
import { collection, addDoc } from 'firebase/firestore';

interface AddPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanAdded: () => void;
}

export function AddPlanDialog({ open, onOpenChange, onPlanAdded }: AddPlanDialogProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleAddPlan = async (data: PlanFormData) => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    try {
      const planDataToSave: Omit<Plan, 'id'> = { 
         name: data.name,
         price: data.price ?? 0,
         durationDays: data.durationDays,
         status: data.status,
         chargeOnEnrollment: data.chargeOnEnrollment,
      };
      await addDoc(collection(db, 'coaches', userId, 'plans'), planDataToSave);
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
          <PlanForm 
            onSubmit={handleAddPlan} 
            submitButtonText="Adicionar Plano" 
            initialData={{ 
                name: '', 
                price: undefined, 
                durationDays: undefined, 
                status: 'active',
                chargeOnEnrollment: true, 
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
