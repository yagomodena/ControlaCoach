
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
import { Edit3, Trash2, PlusCircle, ListChecks, BadgeDollarSign, CalendarClock } from 'lucide-react';
import { MOCK_PLANS, type Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddPlanDialog } from './add-plan-dialog';
import { EditPlanDialog } from './edit-plan-dialog';

interface ManagePlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlansManaged: () => void; // Callback to refresh plans in parent
}

export function ManagePlansDialog({ open, onOpenChange, onPlansManaged }: ManagePlansDialogProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);

  const refreshLocalPlans = () => {
    setPlans([...MOCK_PLANS]); // Create a new array to trigger re-render
  };

  useEffect(() => {
    if (open) {
      refreshLocalPlans();
    }
  }, [open]);

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      const index = MOCK_PLANS.findIndex(p => p.id === planId);
      if (index > -1) {
        MOCK_PLANS.splice(index, 1);
        toast({ title: 'Plano Excluído!', description: 'O plano foi removido com sucesso.' });
        refreshLocalPlans();
        onPlansManaged(); // Notify parent
      }
    }
  };

  const openEditDialog = (plan: Plan) => {
    setPlanToEdit(plan);
    setIsEditPlanDialogOpen(true);
  };

  const handlePlanAddedOrEdited = () => {
    refreshLocalPlans();
    onPlansManaged(); // Notify parent
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
            <Button onClick={() => setIsAddPlanDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Plano
            </Button>
            <ScrollArea className="h-[300px] w-full rounded-md border">
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)} className="text-destructive hover:text-destructive/90" aria-label="Excluir Plano">
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
