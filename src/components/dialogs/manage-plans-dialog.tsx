
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Trash2, PlusCircle, ListChecks, BadgeDollarSign, CalendarClock, Loader2 } from 'lucide-react';
import { type Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddPlanDialog } from './add-plan-dialog';
import { EditPlanDialog } from './edit-plan-dialog';
import { db, auth } from '@/firebase'; // Added auth
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

interface ManagePlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlansManaged: () => void; 
}

export function ManagePlansDialog({ open, onOpenChange, onPlansManaged }: ManagePlansDialogProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Optionally handle user not authenticated if dialog is opened
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (open && userId) {
      setIsLoading(true);
      const plansCollectionRef = collection(db, 'coaches', userId, 'plans');
      const q = query(plansCollectionRef, orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const plansData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Plan));
        setPlans(plansData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching plans for dialog: ", error);
        toast({ title: "Erro ao Carregar Planos", variant: "destructive" });
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else if (!userId && open) {
        // If dialog is open but no user, clear plans and stop loading
        setPlans([]);
        setIsLoading(false);
    }
  }, [open, userId, toast]);

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o plano "${planName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteDoc(doc(db, 'coaches', userId, 'plans', planId));
        toast({ title: 'Plano Excluído!', description: `O plano "${planName}" foi removido.` });
        onPlansManaged(); 
      } catch (error) {
        toast({ title: "Erro ao Excluir Plano", variant: "destructive" });
      }
    }
  };

  const openEditDialog = (plan: Plan) => {
    setPlanToEdit(plan);
    setIsEditPlanDialogOpen(true);
  };

  const handlePlanAddedOrEdited = () => {
    onPlansManaged(); 
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Planos</DialogTitle>
            <DialogDescription>Visualize, edite, adicione ou exclua planos.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Button onClick={() => setIsAddPlanDialogOpen(true)} className="w-full sm:w-auto" disabled={!userId}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Plano
            </Button>
            <ScrollArea className="h-[300px] w-full rounded-md border">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !userId ? (
                 <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">Autenticação necessária para gerenciar planos.</p>
                 </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="flex items-center"><ListChecks className="mr-1 h-4 w-4"/>Nome</TableHead>
                      <TableHead className="hidden sm:table-cell"><BadgeDollarSign className="mr-1 h-4 w-4 inline-block"/>Preço</TableHead>
                      <TableHead className="hidden md:table-cell"><CalendarClock className="mr-1 h-4 w-4 inline-block"/>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.length > 0 ? (
                      plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">R$ {plan.price.toFixed(2)}</TableCell>
                          <TableCell className="hidden md:table-cell">{plan.durationDays} dias</TableCell>
                          <TableCell>
                            <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}
                              className={plan.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}
                            >
                              {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(plan)} aria-label="Editar Plano">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id, plan.name)} className="text-destructive hover:text-destructive/90" aria-label="Excluir Plano">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum plano cadastrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddPlanDialog
        open={isAddPlanDialogOpen}
        onOpenChange={setIsAddPlanDialogOpen}
        onPlanAdded={handlePlanAddedOrEdited}
      />

      {planToEdit && (
        <EditPlanDialog
          open={isEditPlanDialogOpen}
          onOpenChange={setIsEditPlanDialogOpen}
          plan={planToEdit}
          onPlanEdited={handlePlanAddedOrEdited}
        />
      )}
    </>
  );
}
