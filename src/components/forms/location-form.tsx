
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Location } from '@/types';
import { MapPin, Save } from 'lucide-react';

export const locationSchema = z.object({
  name: z.string().min(3, { message: 'Nome do local deve ter pelo menos 3 caracteres.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
});

export type LocationFormData = z.infer<typeof locationSchema>;

interface LocationFormProps {
  onSubmit: (data: LocationFormData) => Promise<void>;
  initialData?: Partial<Location>;
  submitButtonText?: string;
  onCancel?: () => void;
}

export function LocationForm({ onSubmit, initialData, submitButtonText = 'Salvar Local', onCancel }: LocationFormProps) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: initialData?.name || '',
      status: initialData?.status || 'active',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-muted-foreground"/>Nome do Local</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input id="name" placeholder="Ex: Praia Central, Quadra A" {...field} />}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Salvando...' : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
