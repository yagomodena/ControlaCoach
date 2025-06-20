
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, PlusCircle, Search, CalendarClock, MapPinIcon, ClockIcon, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { type Plan, type Location, type DayOfWeek, DAYS_OF_WEEK } from '@/types';
import { AddPlanDialog } from '@/components/dialogs/add-plan-dialog';
import { ManagePlansDialog } from '@/components/dialogs/manage-plans-dialog';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const NO_LOCATION_VALUE = "__NO_LOCATION__";

const studentSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
  plan: z.string().min(1, { message: 'Selecione um plano.' }),
  technicalLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado'], { required_error: 'Selecione o nível técnico.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
  objective: z.string().optional(),
  recurringClassTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." })
    .optional()
    .or(z.literal('')),
  recurringClassDays: z.array(z.enum(DAYS_OF_WEEK)).optional(),
  recurringClassLocation: z.string().optional(),
  paymentStatus: z.enum(['pago', 'pendente', 'vencido']).optional(),
  dueDate: z.string().optional(),
  amountDue: z.number().optional(),
  paymentMethod: z.enum(['PIX', 'Dinheiro', 'Cartão']).optional(),
  lastPaymentDate: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function NovoAlunoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isManagePlansDialogOpen, setIsManagePlansDialogOpen] = useState(false);

  const fetchActivePlans = () => {
    setIsLoadingPlans(true);
    const plansCollectionRef = collection(db, 'plans');
    const qPlans = query(plansCollectionRef, where('status', '==', 'active'), orderBy('name', 'asc'));
    const unsubscribePlans = onSnapshot(qPlans, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Plan));
      setActivePlans(plansData);
      setIsLoadingPlans(false);
    }, (error) => {
      console.error("Error fetching active plans: ", error);
      toast({ title: "Erro ao Carregar Planos", variant: "destructive" });
      setIsLoadingPlans(false);
    });
    return unsubscribePlans;
  };

  useEffect(() => {
    const unsubscribePlans = fetchActivePlans();
    
    setIsLoadingLocations(true);
    const locationsCollectionRef = collection(db, 'locations');
    const qLocations = query(locationsCollectionRef, where('status', '==', 'active'), orderBy('name', 'asc'));
    const unsubscribeLocations = onSnapshot(qLocations, (snapshot) => {
      const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Location));
      setActiveLocations(locationsData);
      setIsLoadingLocations(false);
    }, (error) => {
      console.error("Error fetching active locations: ", error);
      toast({ title: "Erro ao Carregar Locais", variant: "destructive" });
      setIsLoadingLocations(false);
    });
    return () => {
        unsubscribePlans();
        unsubscribeLocations();
    };
  }, [toast]);

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      phone: '',
      plan: undefined,
      technicalLevel: undefined,
      status: 'active',
      objective: '',
      recurringClassTime: '',
      recurringClassDays: [],
      recurringClassLocation: NO_LOCATION_VALUE, 
      paymentStatus: 'pendente',
      dueDate: '',
      amountDue: undefined,
      paymentMethod: undefined,
      lastPaymentDate: '',
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    try {
      const studentDataToSave: Record<string, any> = {
        name: data.name,
        phone: data.phone,
        plan: data.plan,
        technicalLevel: data.technicalLevel,
        status: data.status,
        registrationDate: new Date().toISOString(),
        attendanceHistory: [],
      };
      
      if (data.objective && data.objective.trim() !== '') studentDataToSave.objective = data.objective.trim();
      else studentDataToSave.objective = null;

      if (data.recurringClassTime && data.recurringClassTime.trim() !== '') studentDataToSave.recurringClassTime = data.recurringClassTime.trim();
      else studentDataToSave.recurringClassTime = null;
      
      if (data.recurringClassDays && data.recurringClassDays.length > 0) studentDataToSave.recurringClassDays = data.recurringClassDays;
      else studentDataToSave.recurringClassDays = null;
      
      if (data.recurringClassLocation && data.recurringClassLocation !== NO_LOCATION_VALUE && data.recurringClassLocation.trim() !== '') {
        studentDataToSave.recurringClassLocation = data.recurringClassLocation;
      } else {
        studentDataToSave.recurringClassLocation = null; 
      }

      studentDataToSave.paymentStatus = data.paymentStatus || 'pendente';
      if (data.dueDate && data.dueDate.trim() !== '') studentDataToSave.dueDate = data.dueDate;
      else studentDataToSave.dueDate = null;

      if (typeof data.amountDue === 'number' && !isNaN(data.amountDue)) studentDataToSave.amountDue = data.amountDue;
      else studentDataToSave.amountDue = null;

      if (data.paymentMethod) studentDataToSave.paymentMethod = data.paymentMethod;
      else studentDataToSave.paymentMethod = null;
      
      if (data.lastPaymentDate && data.lastPaymentDate.trim() !== '') studentDataToSave.lastPaymentDate = data.lastPaymentDate;
      else studentDataToSave.lastPaymentDate = null;

      await addDoc(collection(db, 'students'), studentDataToSave);

      toast({
        title: "Aluno Adicionado!",
        description: `${data.name} foi cadastrado com sucesso.`,
      });
      router.push('/alunos');
    } catch (error) {
      console.error("Error adding student: ", error);
      toast({
        title: "Erro ao Adicionar Aluno",
        description: "Não foi possível cadastrar o aluno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handlePlansManaged = () => {
    const currentPlanValue = watch('plan');
    // Re-fetch or rely on onSnapshot to update activePlans
    // For simplicity, if using onSnapshot, this might just ensure UI re-renders if needed
    // Or explicitly call fetchActivePlans if not using onSnapshot for activePlans state here
    fetchActivePlans(); // Re-fetch to update the dropdown
    const currentPlanExistsAndIsActive = activePlans.some(p => p.name === currentPlanValue && p.status === 'active');
    if (!currentPlanExistsAndIsActive && activePlans.length > 0) {
      // Optionally set to first active plan or leave as is
    } else if (!currentPlanExistsAndIsActive) {
      setValue('plan', ''); // Clear if no active plans or current one became inactive
    }
  };


  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-8">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link href="/alunos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Adicionar Novo Aluno</h1>
            <p className="text-muted-foreground">Preencha os dados do novo aluno.</p>
          </div>
        </div>

        <Card className="max-w-3xl mx-auto shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Informações do Aluno</CardTitle>
              <CardDescription>Insira os detalhes básicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input id="name" placeholder="Ex: João da Silva" {...field} value={field.value ?? ''} />}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input id="phone" type="tel" placeholder="(XX) XXXXX-XXXX" {...field} value={field.value ?? ''} />}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plano</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow">
                      <Controller
                        name="plan"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLoadingPlans}>
                            <SelectTrigger id="plan">
                              <SelectValue placeholder={isLoadingPlans ? "Carregando..." : "Selecione o plano"} />
                            </SelectTrigger>
                            <SelectContent>
                              {activePlans.length > 0 ? (
                                activePlans.map(p => (
                                  <SelectItem key={p.id} value={p.name}>{p.name} - R$ {p.price.toFixed(2)}</SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-plans" disabled>{isLoadingPlans ? "Carregando..." : "Nenhum plano ativo"}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <Button variant="outline" size="icon" type="button" onClick={() => setIsAddPlanDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Adicionar Novo Plano</span>
                    </Button>
                    <Button variant="outline" size="icon" type="button" onClick={() => setIsManagePlansDialogOpen(true)}>
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Consultar Planos</span>
                    </Button>
                  </div>
                  {errors.plan && <p className="text-sm text-destructive">{errors.plan.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technicalLevel">Nível Técnico</Label>
                  <Controller
                    name="technicalLevel"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ''} >
                        <SelectTrigger id="technicalLevel">
                          <SelectValue placeholder="Selecione o nível" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="Intermediário">Intermediário</SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.technicalLevel && <p className="text-sm text-destructive">{errors.technicalLevel.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
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

              <div className="space-y-2">
                <Label htmlFor="objective">Objetivo</Label>
                <Controller
                  name="objective"
                  control={control}
                  render={({ field }) => <Textarea id="objective" placeholder="Descreva o objetivo do aluno..." {...field} value={field.value ?? ''} />}
                />
                {errors.objective && <p className="text-sm text-destructive">{errors.objective.message}</p>}
              </div>
            </CardContent>

            <Separator className="my-6" />

            <CardHeader className="pt-0">
              <CardTitle className="flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-primary"/>Horários e Dias de Aula Recorrentes</CardTitle>
              <CardDescription>Defina o horário e os dias fixos para as aulas deste aluno. (Opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="recurringClassTime" className="flex items-center"><ClockIcon className="mr-1 h-4 w-4"/>Horário da Aula</Label>
                  <Controller
                    name="recurringClassTime"
                    control={control}
                    render={({ field }) => <Input id="recurringClassTime" type="time" {...field} value={field.value ?? ''}/>}
                  />
                  {errors.recurringClassTime && <p className="text-sm text-destructive">{errors.recurringClassTime.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurringClassLocation" className="flex items-center"><MapPinIcon className="mr-1 h-4 w-4"/>Local da Aula</Label>
                  <Controller
                    name="recurringClassLocation"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? NO_LOCATION_VALUE} disabled={isLoadingLocations}>
                        <SelectTrigger id="recurringClassLocation">
                          <SelectValue placeholder={isLoadingLocations ? "Carregando..." : "Selecione o local"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_LOCATION_VALUE}>Nenhum local específico</SelectItem>
                          {activeLocations.map(loc => (
                            <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.recurringClassLocation && <p className="text-sm text-destructive">{errors.recurringClassLocation.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dias da Semana para Aula Recorrente</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Controller
                      key={day}
                      name="recurringClassDays"
                      control={control}
                      render={({ field }) => {
                        const currentDays = field.value || [];
                        return (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day}`}
                              checked={currentDays.includes(day)}
                              onCheckedChange={(checked) => {
                                const newDays = checked
                                  ? [...currentDays, day]
                                  : currentDays.filter((d) => d !== day);
                                field.onChange(newDays);
                              }}
                            />
                            <Label htmlFor={`day-${day}`} className="font-normal">
                              {day}
                            </Label>
                          </div>
                        );
                      }}
                    />
                  ))}
                </div>
                {errors.recurringClassDays && <p className="text-sm text-destructive">{errors.recurringClassDays.message}</p>}
              </div>
            </CardContent>

            <Separator className="my-6" />

            <CardHeader className="pt-0">
                <CardTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/>Informações de Pagamento</CardTitle>
                <CardDescription>Gerencie os detalhes financeiros do aluno. (Opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="paymentStatus">Status do Pagamento</Label>
                        <Controller name="paymentStatus" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger id="paymentStatus"><SelectValue placeholder="Selecione"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pago">Pago</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="vencido">Vencido</SelectItem>
                            </SelectContent>
                            </Select>
                        )} />
                        {errors.paymentStatus && <p className="text-sm text-destructive">{errors.paymentStatus.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Data de Vencimento</Label>
                        <Controller name="dueDate" control={control} render={({ field }) => <Input id="dueDate" type="date" {...field} value={field.value ?? ''} />} />
                        {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="amountDue">Valor Devido (R$)</Label>
                        <Controller name="amountDue" control={control} render={({ field }) => <Input id="amountDue" type="number" step="0.01" {...field} value={field.value ?? ''}  onChange={e => { const val = e.target.value; field.onChange(val === '' ? undefined : parseFloat(val)); }} />} />
                        {errors.amountDue && <p className="text-sm text-destructive">{errors.amountDue.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                         <Controller name="paymentMethod" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                            <SelectTrigger id="paymentMethod"><SelectValue placeholder="Selecione"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="Cartão">Cartão</SelectItem>
                            </SelectContent>
                            </Select>
                        )} />
                        {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
                    </div>
                </div>
                 <div className="space-y-2 md:max-w-[calc(50%-0.75rem)]">
                    <Label htmlFor="lastPaymentDate">Data do Último Pagamento</Label>
                    <Controller name="lastPaymentDate" control={control} render={({ field }) => <Input id="lastPaymentDate" type="date" {...field} value={field.value ?? ''} />} />
                    {errors.lastPaymentDate && <p className="text-sm text-destructive">{errors.lastPaymentDate.message}</p>}
                </div>
            </CardContent>


            <CardFooter className="flex justify-end gap-2 pt-6">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingLocations || isLoadingPlans} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <AddPlanDialog
        open={isAddPlanDialogOpen}
        onOpenChange={setIsAddPlanDialogOpen}
        onPlanAdded={handlePlansManaged}
      />
      <ManagePlansDialog
        open={isManagePlansDialogOpen}
        onOpenChange={setIsManagePlansDialogOpen}
        onPlansManaged={handlePlansManaged}
      />
    </>
  );
}
