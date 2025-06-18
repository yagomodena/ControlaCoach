
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, ListChecks, BadgeDollarSign, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Plan } from '@/types';
import { MOCK_PLANS } from '@/types'; 
import { useToast } from '@/hooks/use-toast';

const planSchema = z.object({
  name: z.string().min(3, { message: 'Nome do plano deve ter pelo menos 3 caracteres.' }),
  price: z.coerce.number().min(0, {message: 'Preço deve ser positivo ou zero.'}),
  durationDays: z.coerce.number().int().positive({ message: 'Duração deve ser um número inteiro positivo.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function PlanoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const planId = params.id as string;
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  useEffect(() => {
    setIsLoading(true);
    const foundPlan = MOCK_PLANS.find(p => p.id === planId);
    if (foundPlan) {
      setPlan(foundPlan);
      reset(foundPlan); 
    } else {
      toast({ title: "Erro", description: "Plano não encontrado.", variant: "destructive" });
      router.push('/planos');
    }
    setIsLoading(false);
  }, [planId, reset, router, toast]);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: PlanFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const planIndex = MOCK_PLANS.findIndex(p => p.id === planId);
    if (planIndex !== -1 && plan) {
        const updatedPlan = { ...plan, ...data };
        MOCK_PLANS[planIndex] = updatedPlan;
        setPlan(updatedPlan);
    }

    toast({
      title: "Plano Atualizado!",
      description: `O plano "${data.name}" foi atualizado com sucesso.`,
    });
    setIsEditMode(false);
    router.replace(`/planos/${planId}`); 
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Carregando dados do plano...</div>;
  }

  if (!plan) {
    return <div className="container mx-auto py-8 text-center text-destructive">Plano não encontrado.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value, prefix }: { icon: React.ElementType, label: string, value?: string | number | null, prefix?: string }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{prefix}{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/planos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {isEditMode ? 'Editar Plano' : 'Detalhes do Plano'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Modificando dados de "${plan.name}"` : `Visualizando dados de "${plan.name}"`}
          </p>
        </div>
        {!isEditMode && (
          <Button onClick={() => router.push(`/planos/${planId}?edit=true`)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {isEditMode ? (
        <Card className="max-w-xl mx-auto shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary"/> Editar Informações do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="price" className="flex items-center"><BadgeDollarSign className="h-4 w-4 mr-1 text-muted-foreground"/> Preço (R$)</Label>
                    <Controller
                        name="price"
                        control={control}
                        render={({ field }) => <Input id="price" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>}
                    />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="durationDays" className="flex items-center"><CalendarClock className="h-4 w-4 mr-1 text-muted-foreground"/> Duração (dias)</Label>
                    <Controller
                        name="durationDays"
                        control={control}
                        render={({ field }) => <Input id="durationDays" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} />}
                    />
                    {errors.durationDays && <p className="text-sm text-destructive">{errors.durationDays.message}</p>}
                </div>
            </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => { setIsEditMode(false); router.replace(`/planos/${planId}`); reset(plan); }}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="shadow-lg max-w-xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline flex items-center"><ListChecks className="h-6 w-6 mr-2 text-primary"/>{plan.name}</CardTitle>
                  <CardDescription>ID: {plan.id}</CardDescription>
                </div>
                 <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}
                       className={plan.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30 py-1 px-3 text-sm' : 'bg-red-500/20 text-red-700 border-red-500/30 py-1 px-3 text-sm'}
                      >
                        {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                <InfoItem icon={ListChecks} label="Nome do Plano" value={plan.name} />
                <InfoItem icon={BadgeDollarSign} label="Preço" value={plan.price.toFixed(2)} prefix="R$ " />
                <InfoItem icon={CalendarClock} label="Duração (dias)" value={plan.durationDays} />
                <InfoItem 
                    icon={plan.status === 'active' ? Edit3 : Edit3} // Placeholder, consider ShieldCheck / ShieldOff
                    label="Status" 
                    value={plan.status === 'active' ? 'Ativo' : 'Inativo'} />
            </CardContent>
        </Card>
      )}
    </div>
  );
}
