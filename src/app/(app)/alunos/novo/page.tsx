
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, PlusCircle, Search, CalendarClock, MapPinIcon, ClockIcon, DollarSign, Loader2, CalendarIcon, KeyRound } from 'lucide-react';
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
import { db, auth } from '@/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { formatISO, addDays } from 'date-fns';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const NO_LOCATION_VALUE = "__NO_LOCATION__";

const studentSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres.' }),
  plan: z.string().min(1, { message: 'Selecione um plano.' }),
  technicalLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado'], { required_error: 'Selecione o nível técnico.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
  birthDate: z.string().optional().nullable(),
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
  const [userId, setUserId] = useState<string | null>(null);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isManagePlansDialogOpen, setIsManagePlansDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);

  const fetchActivePlans = (currentUserId: string) => {
    setIsLoadingPlans(true);
    const plansCollectionRef = collection(db, 'coaches', currentUserId, 'plans');
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
    if (!userId) return;

    const unsubscribePlans = fetchActivePlans(userId);
    
    setIsLoadingLocations(true);
    const locationsCollectionRef = collection(db, 'coaches', userId, 'locations');
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
  }, [userId, toast]);

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      plan: undefined,
      technicalLevel: undefined,
      status: 'active',
      objective: '',
      birthDate: '',
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
    if (!userId) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
    }
    try {
      
      const tempApp = auth.app;
      const studentAuth = getAuth(tempApp);
      const userCredential = await createUserWithEmailAndPassword(studentAuth, data.email, data.password);
      const studentUser = userCredential.user;

      const registrationDate = new Date();
      const registrationDateISO = formatISO(registrationDate, { representation: 'date' });
      const selectedPlanDetails = activePlans.find(p => p.name === data.plan);

      if (!selectedPlanDetails) {
        toast({ title: "Erro", description: "Plano selecionado não encontrado.", variant: "destructive" });
        return;
      }
      
      let initialDueDate: Date;
      if (selectedPlanDetails.chargeOnEnrollment) {
        initialDueDate = registrationDate;
      } else {
        initialDueDate = addDays(registrationDate, selectedPlanDetails.durationDays);
      }

      const studentDataToSave: Record<string, any> = {
        authId: studentUser.uid,
        email: data.email,
        name: data.name,
        phone: data.phone,
        plan: data.plan,
        technicalLevel: data.technicalLevel,
        status: data.status,
        registrationDate: registrationDateISO,
        attendanceHistory: [],
        paymentStatus: 'pendente',
        dueDate: formatISO(initialDueDate, { representation: 'date' }),
        lastPaymentDate: null,
        amountDue: selectedPlanDetails.price,
        photoURL: null,
        physicalAssessments: [],
        trainingSheet: null,
        birthDate: (data.birthDate && data.birthDate.trim() !== '') ? data.birthDate.trim() : null,
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
      
      if (data.paymentStatus && data.paymentStatus !== 'pendente') studentDataToSave.paymentStatus = data.paymentStatus;
      if (data.dueDate && data.dueDate.trim() !== '' && data.dueDate !== formatISO(initialDueDate, { representation: 'date' })) studentDataToSave.dueDate = data.dueDate;
      if (typeof data.amountDue === 'number' && !isNaN(data.amountDue) && data.amountDue !== selectedPlanDetails.price) studentDataToSave.amountDue = data.amountDue;
      
      studentDataToSave.paymentMethod = data.paymentMethod || null;
      studentDataToSave.lastPaymentDate = (data.lastPaymentDate && data.lastPaymentDate.trim() !== '') ? data.lastPaymentDate : null;
      
      await addDoc(collection(db, 'coaches', userId, 'students'), studentDataToSave);

      toast({
        title: "Aluno Adicionado!",
        description: `${data.name} foi cadastrado com sucesso.`,
      });
      router.push('/alunos');
    } catch (error: any) {
      console.error("Error adding student: ", error);
      let description = "Não foi possível cadastrar o aluno. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este email já está em uso por outra conta.";
      }
      toast({
        title: "Erro ao Adicionar Aluno",
        description: description,
        variant: "destructive",
      });
    }
  };

  const handlePlansManaged = () => {
    if (!userId) return;
    fetchActivePlans(userId);
  };

  if (isLoadingPlans || isLoadingLocations || !userId) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

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

        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-lg">
                    <CardHeader>
                        <CardTitle>Informações do Aluno</CardTitle>
                        <CardDescription>Insira os detalhes básicos, informações de contato e esportivas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Controller name="name" control={control} render={({ field }) => <Input id="name" placeholder="Ex: João da Silva" {...field} />} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                                <Controller name="phone" control={control} render={({ field }) => <Input id="phone" type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />} />
                                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate" className="flex items-center"><CalendarIcon className="mr-1 h-4 w-4"/>Data de Nascimento</Label>
                                <Controller name="birthDate" control={control} render={({ field }) => <Input id="birthDate" type="date" {...field} value={field.value ?? ''} />} />
                                {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="technicalLevel">Nível Técnico</Label>
                                <Controller name="technicalLevel" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="technicalLevel"><SelectValue placeholder="Selecione o nível" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Iniciante">Iniciante</SelectItem><SelectItem value="Intermediário">Intermediário</SelectItem><SelectItem value="Avançado">Avançado</SelectItem></SelectContent>
                                    </Select>
                                )} />
                                {errors.technicalLevel && <p className="text-sm text-destructive">{errors.technicalLevel.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="objective">Objetivo</Label>
                            <Controller name="objective" control={control} render={({ field }) => <Textarea id="objective" placeholder="Descreva o objetivo do aluno..." {...field} value={field.value ?? ''} />} />
                            {errors.objective && <p className="text-sm text-destructive">{errors.objective.message}</p>}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary"/>Acesso do Aluno</CardTitle>
                            <CardDescription>Crie as credenciais para o aluno acessar o portal.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email de Acesso</Label>
                                <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" placeholder="aluno@email.com" {...field} />} />
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha de Acesso</Label>
                                <Controller name="password" control={control} render={({ field }) => <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...field} />} />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status do Aluno</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="status"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                                    <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
                                    </Select>
                                )} />
                                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Card className="mt-8 shadow-lg">
                <CardHeader>
                    <CardTitle>Plano e Pagamento</CardTitle>
                    <CardDescription>Defina o plano e as condições de pagamento iniciais.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="plan">Plano</Label>
                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <Controller name="plan" control={control} render={({ field }) => (
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        const selectedPlan = activePlans.find(p => p.name === value);
                                        if (selectedPlan) {
                                            setValue('amountDue', selectedPlan.price);
                                            const regDate = new Date();
                                            let initialDueDateValue: Date;
                                            if (selectedPlan.chargeOnEnrollment) {
                                                initialDueDateValue = regDate;
                                            } else {
                                                initialDueDateValue = addDays(regDate, selectedPlan.durationDays);
                                            }
                                            setValue('dueDate', formatISO(initialDueDateValue, { representation: 'date' }));
                                        } else {
                                            setValue('amountDue', undefined);
                                            setValue('dueDate', '');
                                        }
                                    }} value={field.value} disabled={isLoadingPlans}>
                                        <SelectTrigger id="plan"><SelectValue placeholder={isLoadingPlans ? "Carregando..." : "Selecione o plano"} /></SelectTrigger>
                                        <SelectContent>
                                            {activePlans.length > 0 ? (
                                                activePlans.map(p => (<SelectItem key={p.id} value={p.name}>{p.name} - R$ {p.price.toFixed(2)}</SelectItem>))
                                            ) : (
                                                <SelectItem value="no-plans" disabled>{isLoadingPlans ? "Carregando..." : "Nenhum plano ativo"}</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                            <Button variant="outline" size="icon" type="button" onClick={() => setIsAddPlanDialogOpen(true)}><PlusCircle className="h-4 w-4" /><span className="sr-only">Adicionar</span></Button>
                            <Button variant="outline" size="icon" type="button" onClick={() => setIsManagePlansDialogOpen(true)}><Search className="h-4 w-4" /><span className="sr-only">Gerenciar</span></Button>
                        </div>
                        {errors.plan && <p className="text-sm text-destructive">{errors.plan.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="paymentStatus">Status (Inicial)</Label>
                            <Controller name="paymentStatus" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || 'pendente'}><SelectTrigger id="paymentStatus"><SelectValue placeholder="Pendente"/></SelectTrigger>
                                <SelectContent><SelectItem value="pago">Pago</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="vencido">Vencido</SelectItem></SelectContent>
                                </Select>
                            )} />
                            {errors.paymentStatus && <p className="text-sm text-destructive">{errors.paymentStatus.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Vencimento (Inicial)</Label>
                            <Controller name="dueDate" control={control} render={({ field }) => <Input id="dueDate" type="date" {...field} value={field.value ?? ''} />} />
                            <p className="text-xs text-muted-foreground">Auto com base no plano.</p>
                            {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amountDue">Valor Devido (R$)</Label>
                            <Controller name="amountDue" control={control} render={({ field }) => <Input id="amountDue" type="number" step="0.01" {...field} value={field.value ?? ''}  onChange={e => { const val = e.target.value; field.onChange(val === '' ? undefined : parseFloat(val)); }} />} />
                            <p className="text-xs text-muted-foreground">Auto com base no plano.</p>
                            {errors.amountDue && <p className="text-sm text-destructive">{errors.amountDue.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="paymentMethod">Método Pag.</Label>
                            <Controller name="paymentMethod" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || ''}><SelectTrigger id="paymentMethod"><SelectValue placeholder="Selecione"/></SelectTrigger>
                                <SelectContent><SelectItem value="PIX">PIX</SelectItem><SelectItem value="Dinheiro">Dinheiro</SelectItem><SelectItem value="Cartão">Cartão</SelectItem></SelectContent>
                                </Select>
                            )} />
                            {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-6">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting || isLoadingLocations || isLoadingPlans} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </div>

      <AddPlanDialog open={isAddPlanDialogOpen} onOpenChange={setIsAddPlanDialogOpen} onPlanAdded={handlePlansManaged} />
      <ManagePlansDialog open={isManagePlansDialogOpen} onOpenChange={setIsManagePlansDialogOpen} onPlansManaged={handlePlansManaged} />
    </>
  );
}

    