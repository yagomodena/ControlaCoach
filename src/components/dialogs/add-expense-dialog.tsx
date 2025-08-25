
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EXPENSE_CATEGORIES, type Expense } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Save } from 'lucide-react';

const expenseSchema = z.object({
  description: z.string().min(3, { message: 'Descrição deve ter pelo menos 3 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida." }),
  category: z.enum(EXPENSE_CATEGORIES, { required_error: 'Selecione uma categoria.' }),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
}

export function AddExpenseDialog({ open, onOpenChange, onExpenseAdded }: AddExpenseDialogProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: '' as any, // Use empty string to avoid uncontrolled to controlled error
      date: format(new Date(), 'yyyy-MM-dd'),
      category: undefined,
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setUserId(user ? user.uid : null));
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if(open) {
      reset({
        description: '',
        amount: '' as any,
        date: format(new Date(), 'yyyy-MM-dd'),
        category: undefined,
      });
    }
  }, [open, reset]);

  const handleAddExpense = async (data: ExpenseFormData) => {
    if (!userId) {
      toast({ title: "Erro de Autenticação", variant: "destructive" });
      return;
    }
    try {
      const expenseData: Omit<Expense, 'id'> = {
        ...data,
        date: new Date(data.date).toISOString().split('T')[0], // Ensure format
      };
      await addDoc(collection(db, 'coaches', userId, 'expenses'), expenseData);
      toast({
        title: "Saída Adicionada!",
        description: `A saída "${data.description}" foi registrada com sucesso.`,
      });
      onExpenseAdded(); // Notify parent component
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast({
        title: "Erro ao Adicionar Saída",
        description: "Não foi possível registrar a saída. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Saída</DialogTitle>
          <DialogDescription>Preencha os dados da nova despesa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleAddExpense)} className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Input id="description" placeholder="Ex: Compra de bolas" {...field} />}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => <Input id="amount" type="number" step="0.01" placeholder="50.00" {...field} />}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => <Input id="date" type="date" {...field} />}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
             <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Saída'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
