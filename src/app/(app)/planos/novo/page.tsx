
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ListChecks, BadgeDollarSign, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { MOCK_PLANS, type Plan } from '@/types';

const planSchema = z.object({
  name: z.string().min(3, { message: 'Nome do plano deve ter pelo menos 3 caracteres.' }),
  price: z.coerce.number().min(0, {message: 'Preço deve ser positivo ou zero.'}),
  durationDays: z.coerce.number().int().positive({ message: 'Duração deve ser um número inteiro positivo.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.'}),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function NovoPlanoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      price: 0,
      durationDays: 30,
      status: 'active',
    },
  });

  const onSubmit = async (data: PlanFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newPlan: Plan = {
      id: crypto.randomUUID(), 
      ...data,
    };
    MOCK_PLANS.push(newPlan); 
    
    toast({
      title: "Plano Adicionado!",
      description: `O plano "${data.name}" foi cadastrado com sucesso.`,
    });
    router.push('/planos'); 
  };

  return (
    <div className="container mx-auto py-8">
       <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/planos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Adicionar Novo Plano</h1>
          <p className="text-muted-foreground">Preencha os dados do novo plano.</p>
        </div>
      </div>

      <Card className="max-w-xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary"/> Informações do Plano</CardTitle>
            <CardDescription>Insira os detalhes abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano</Label>
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
                        render={({ field }) => <Input id="price" type="number" step="0.01" placeholder="Ex: 150.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="durationDays" className="flex items-center"><CalendarClock className="h-4 w-4 mr-1 text-muted-foreground"/> Duração (dias)</Label>
                    <Controller
                        name="durationDays"
                        control={control}
                        render={({ field }) => <Input id="durationDays" type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} />}
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
