
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Plan } from '@/types';
import { BadgeDollarSign, CalendarClock, ListChecks, Save } from 'lucide-react';

export const planSchema = z.object({
  name: z.string().min(3, { message: 'Nome do plano deve ter pelo menos 3 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'Preço deve ser positivo ou zero.' }).optional(),
  durationDays: z.coerce.number().int().positive({ message: 'Duração deve ser um número inteiro positivo.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
});

export type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormProps {
  onSubmit: (data: PlanFormData) => Promise<void>;
  initialData?: Partial<Plan>;
  submitButtonText?: string;
}

export function PlanForm({ onSubmit, initialData, submitButtonText = 'Salvar Plano' }: PlanFormProps) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: initialData?.name || '',
      price: initialData?.price ?? undefined,
      durationDays: initialData?.durationDays ?? undefined, // Changed default to undefined
      status: initialData?.status || 'active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center"><ListChecks className="h-4 w-4 mr-1 text-muted-foreground"/>Nome do Plano</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input id="name" placeholder="Ex: Mensal Light, Trimestral PRO" {...field} />}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="price" className="flex items-center"><BadgeDollarSign className="h-4 w-4 mr-1 text-muted-foreground"/> Preço (R$)</Label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                placeholder="Ex: 150.00" 
                {...field} 
                value={field.value ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  field.onChange(val === '' ? undefined : parseFloat(val));
                }}
              />
            )}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationDays" className="flex items-center"><CalendarClock className="h-4 w-4 mr-1 text-muted-foreground"/> Duração (dias)</Label>
          <Controller
            name="durationDays"
            control={control}
            render={({ field }) => (
              <Input 
                id="durationDays" 
                type="number" 
                placeholder="Ex: 30" 
                {...field} 
                value={field.value ?? ''}
                onChange={e => {
                  const val = e.target.value;
                  field.onChange(val === '' ? undefined : parseInt(val, 10));
                }}
              />
            )}
          />
          {errors.durationDays && <p className="text-sm text-destructive">{errors.durationDays.message}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
         <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Salvando...' : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
