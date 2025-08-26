
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, CalendarDays, DollarSign, ShieldCheck, ShieldOff, User, Phone, BarChart, Users, CheckCircle, XCircle, Clock, Goal, PlusCircle, Search, MapPinIcon, ClockIcon, Loader2, Dumbbell, Activity, CalendarIcon, LineChart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type Student, type Plan, type Location, type DayOfWeek, type TrainingSheet, type PhysicalAssessment, type Exercise } from '@/types';
import { DAYS_OF_WEEK } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddPlanDialog } from '@/components/dialogs/add-plan-dialog';
import { ManagePlansDialog } from '@/components/dialogs/manage-plans-dialog';
import { db, auth } from '@/firebase';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, where, orderBy, arrayUnion, writeBatch } from 'firebase/firestore';
import { differenceInYears, parseISO, format, formatISO } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Legend, Line, ComposedChart, ResponsiveContainer } from 'recharts';
import { v4 as uuidv4 } from 'uuid';

const NO_LOCATION_VALUE = "__NO_LOCATION__";

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome do exercício é obrigatório.'),
  sets: z.string().min(1, 'Séries são obrigatórias.'),
  reps: z.string().min(1, 'Repetições são obrigatórias.'),
  rest: z.string().min(1, 'Descanso é obrigatório.'),
  notes: z.string().optional(),
});

const studentSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
  plan: z.string().min(1, { message: 'Selecione um plano.' }),
  technicalLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado'], { required_error: 'Selecione o nível técnico.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
  objective: z.string().optional(),
  birthDate: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  trainingSheetWorkouts: z.record(z.nativeEnum(DAYS_OF_WEEK), z.array(exerciseSchema).optional()).optional(),
  paymentStatus: z.enum(['pago', 'pendente', 'vencido']).optional(),
  dueDate: z.string().optional(),
  amountDue: z.number().optional(),
  paymentMethod: z.enum(['PIX', 'Dinheiro', 'Cartão']).optional(),
  recurringClassTime: z.string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." })
    .optional()
    .or(z.literal('')),
  recurringClassDays: z.array(z.enum(DAYS_OF_WEEK)).optional(),
  recurringClassLocation: z.string().optional(),
  lastPaymentDate: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

const sortDays = (days: DayOfWeek[] = []) => {
    return days.sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
}

export default function AlunoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const studentId = params.id as string;
  const [userId, setUserId] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isManagePlansDialogOpen, setIsManagePlansDialogOpen] = useState(false);

  // State for new physical assessment
  const [newWeight, setNewWeight] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newHips, setNewHips] = useState('');
  const [newRightArm, setNewRightArm] = useState('');
  const [newLeftArm, setNewLeftArm] = useState('');
  const [newRightThigh, setNewRightThigh] = useState('');
  const [newLeftThigh, setNewLeftThigh] = useState('');
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  
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
      const plansData = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as Plan));
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
      const locationsData = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id } as Location));
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

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });
  
  const recurringClassDays = watch('recurringClassDays') || [];

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: `trainingSheetWorkouts.${sortDays(recurringClassDays)[0]}` as any, // This is tricky, need a better way
  });

  const fetchStudent = async () => {
      if (!studentId || !userId) return;
      setIsLoading(true);
      try {
        const studentDocRef = doc(db, 'coaches', userId, 'students', studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
          const studentData = { ...studentDocSnap.data(), id: studentDocSnap.id } as Student;
          setStudent(studentData);
          reset({
            ...studentData,
            birthDate: studentData.birthDate || '',
            photoURL: studentData.photoURL || null,
            trainingSheetWorkouts: studentData.trainingSheet?.workouts || {},
            recurringClassTime: studentData.recurringClassTime || '',
            recurringClassDays: studentData.recurringClassDays || [],
            recurringClassLocation: studentData.recurringClassLocation || NO_LOCATION_VALUE,
            objective: studentData.objective || '',
            dueDate: studentData.dueDate ? (studentData.dueDate.includes('T') ? studentData.dueDate.split('T')[0] : studentData.dueDate) : '',
            lastPaymentDate: studentData.lastPaymentDate ? (studentData.lastPaymentDate.includes('T') ? studentData.lastPaymentDate.split('T')[0] : studentData.lastPaymentDate) : '',
            amountDue: studentData.amountDue === null || studentData.amountDue === undefined ? undefined : studentData.amountDue,
            paymentStatus: studentData.paymentStatus || undefined,
            paymentMethod: studentData.paymentMethod || undefined,
          });
        } else {
          toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
          router.push('/alunos');
        }
      } catch (error) {
        console.error("Error fetching student details: ", error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os dados do aluno.", variant: "destructive" });
        router.push('/alunos');
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchStudent();
  }, [studentId, userId]); 

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: StudentFormData) => {
    if (!studentId || !userId) {
         toast({ title: "Erro", description: "Informações de usuário ou aluno ausentes.", variant: "destructive" });
        return;
    }
    try {
      const studentCoachDocRef = doc(db, 'coaches', userId, 'students', studentId);
      const studentRootDocRef = doc(db, 'students', studentId);

      const updatePayload: Record<string, any> = {
        name: data.name,
        phone: data.phone,
        plan: data.plan,
        technicalLevel: data.technicalLevel,
        status: data.status,
        birthDate: data.birthDate || null,
        photoURL: data.photoURL || null,
      };
      
      const hasWorkoutData = data.trainingSheetWorkouts && Object.values(data.trainingSheetWorkouts).some(workoutDay => workoutDay && workoutDay.length > 0);

      if(hasWorkoutData) {
        updatePayload.trainingSheet = {
            workouts: data.trainingSheetWorkouts,
            lastUpdated: new Date().toISOString(),
        };
      } else {
        updatePayload.trainingSheet = null;
      }

      updatePayload.objective = (data.objective && data.objective.trim() !== '') ? data.objective.trim() : null;
      updatePayload.recurringClassTime = (data.recurringClassTime && data.recurringClassTime.trim() !== '') ? data.recurringClassTime.trim() : null;
      updatePayload.recurringClassDays = (data.recurringClassDays && data.recurringClassDays.length > 0) ? data.recurringClassDays : null;
      
      updatePayload.recurringClassLocation = (data.recurringClassLocation && data.recurringClassLocation !== NO_LOCATION_VALUE && data.recurringClassLocation.trim() !== '') ? data.recurringClassLocation.trim() : null;

      updatePayload.dueDate = (data.dueDate && data.dueDate.trim() !== '') ? new Date(data.dueDate).toISOString().split('T')[0] : null;
      updatePayload.lastPaymentDate = (data.lastPaymentDate && data.lastPaymentDate.trim() !== '') ? new Date(data.lastPaymentDate).toISOString().split('T')[0] : null;
      updatePayload.amountDue = (typeof data.amountDue === 'number' && !isNaN(data.amountDue)) ? data.amountDue : null;
      updatePayload.paymentStatus = data.paymentStatus || null;
      updatePayload.paymentMethod = data.paymentMethod || null;

      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) {
          updatePayload[key] = null;
        }
      });
      
      const batch = writeBatch(db);
      batch.update(studentCoachDocRef, updatePayload);
      batch.update(studentRootDocRef, updatePayload);
      await batch.commit();

      const updatedStudentData = { ...(student || {}), ...updatePayload, id: studentId } as Student;
      setStudent(updatedStudentData);

      toast({
        title: "Aluno Atualizado!",
        description: `${data.name} foi atualizado com sucesso.`,
      });
      setIsEditMode(false);
      router.replace(`/alunos/${studentId}`);
    } catch (error) {
        console.error("Error updating student: ", error);
        toast({
            title: "Erro ao Atualizar",
            description: "Não foi possível atualizar os dados do aluno. Tente novamente.",
            variant: "destructive",
        });
    }
  };

  const handleAddAssessment = async () => {
    if (!userId || !studentId) return;

    setIsAddingAssessment(true);
    const newAssessment: PhysicalAssessment = {
      date: formatISO(new Date()),
      weight: newWeight ? parseFloat(newWeight) : undefined,
      height: newHeight ? parseFloat(newHeight) : undefined,
      bodyFatPercentage: newBodyFat ? parseFloat(newBodyFat) : undefined,
      chest: newChest ? parseFloat(newChest) : undefined,
      waist: newWaist ? parseFloat(newWaist) : undefined,
      hips: newHips ? parseFloat(newHips) : undefined,
      rightArm: newRightArm ? parseFloat(newRightArm) : undefined,
      leftArm: newLeftArm ? parseFloat(newLeftArm) : undefined,
      rightThigh: newRightThigh ? parseFloat(newRightThigh) : undefined,
      leftThigh: newLeftThigh ? parseFloat(newLeftThigh) : undefined,
    };
    
    // Check if at least one measurement is filled
    const hasData = Object.values(newAssessment).some(v => v !== undefined && v !== null && v !== '');
    if (!hasData) {
      toast({ title: "Dados Incompletos", description: "Preencha pelo menos um campo da avaliação.", variant: "destructive" });
      setIsAddingAssessment(false);
      return;
    }


    try {
      const studentCoachDocRef = doc(db, 'coaches', userId, 'students', studentId);
      const studentRootDocRef = doc(db, 'students', studentId);

      const batch = writeBatch(db);
      batch.update(studentCoachDocRef, { physicalAssessments: arrayUnion(newAssessment) });
      batch.update(studentRootDocRef, { physicalAssessments: arrayUnion(newAssessment) });
      await batch.commit();

      toast({ title: "Avaliação Adicionada!", description: "A nova avaliação física foi salva." });
      setNewWeight('');
      setNewHeight('');
      setNewBodyFat('');
      setNewChest('');
      setNewWaist('');
      setNewHips('');
      setNewRightArm('');
      setNewLeftArm('');
      setNewRightThigh('');
      setNewLeftThigh('');
      await fetchStudent(); // Re-fetch student data to update the view
    } catch (error) {
      console.error("Error adding assessment:", error);
      toast({ title: "Erro ao Salvar Avaliação", variant: "destructive" });
    } finally {
      setIsAddingAssessment(false);
    }
  };

  const handlePlansManaged = () => {
    if (!userId) return;
    const currentPlanValue = watch('plan');
    fetchActivePlans(userId); 
    const currentPlanExistsAndIsActive = activePlans.some(p => p.name === currentPlanValue && p.status === 'active');
    if (!currentPlanExistsAndIsActive && activePlans.length > 0) {
      // Optional: Select first active plan or clear
    } else if (!currentPlanExistsAndIsActive) {
       setValue('plan', '');
    }
  };
  
  const calculateAge = (birthDate: string): number | null => {
    try {
        return differenceInYears(new Date(), parseISO(birthDate));
    } catch (error) {
        return null;
    }
  };

  if (isLoading || isLoadingLocations || isLoadingPlans || !userId) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  if (!student) {
    return <div className="container mx-auto py-8 text-center text-destructive">Aluno não encontrado.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value, isLongText = false, children }: { icon: React.ElementType, label: string, value?: string | number | null | DayOfWeek[], isLongText?: boolean, children?: React.ReactNode }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {children ? children :
          Array.isArray(value) ? (
            <p className="font-medium text-foreground">{value.join(', ') || 'N/A'}</p>
          ) : isLongText && value ? (
              <p className="font-medium text-foreground whitespace-pre-wrap">{String(value)}</p>
          ) : (
              <p className="font-medium text-foreground">{value != null && value !== '' ? String(value) : 'N/A'}</p>
          )}
      </div>
    </div>
  );

  const getPaymentStatusBadge = (status?: 'pago' | 'pendente' | 'vencido') => {
    switch (status) {
      case 'pago': return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Pago</Badge>;
      case 'pendente': return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Pendente</Badge>;
      case 'vencido': return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Vencido</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  const formatDateString = (dateString?: string) => {
    if (!dateString || dateString.trim() === '') return 'N/A';
    try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
        }
        return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (e) {
        console.warn("Invalid date string for formatting:", dateString, e);
        return 'Data inválida';
    }
  };
  
  const studentAge = student.birthDate ? calculateAge(student.birthDate) : null;
  const sortedAssessments = student.physicalAssessments?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const chartData = sortedAssessments.map(a => ({
    date: formatDateString(a.date),
    Peso: a.weight,
    'Gordura (%)': a.bodyFatPercentage,
  }));

  const TrainingDayEditor = ({ day }: { day: DayOfWeek }) => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: `trainingSheetWorkouts.${day}`,
    });

    return (
      <Card className="bg-muted/30">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-lg">Treino de {day}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {fields.map((item, index) => (
            <div key={item.id} className="p-3 border rounded-md bg-background space-y-2">
              <div className="flex justify-between items-center">
                 <p className="font-semibold text-primary">Exercício {index + 1}</p>
                 <Button type="button" variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => remove(index)}>
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                 <Controller
                    name={`trainingSheetWorkouts.${day}.${index}.name`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Nome do exercício" className="col-span-2"/>}
                 />
                 <Controller
                    name={`trainingSheetWorkouts.${day}.${index}.sets`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Séries"/>}
                 />
                 <Controller
                    name={`trainingSheetWorkouts.${day}.${index}.reps`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Reps"/>}
                 />
                 <Controller
                    name={`trainingSheetWorkouts.${day}.${index}.rest`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Descanso"/>}
                 />
                  <Controller
                    name={`trainingSheetWorkouts.${day}.${index}.notes`}
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Obs (opcional)" className="col-span-2"/>}
                 />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), name: '', sets: '', reps: '', rest: '', notes: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Exercício
          </Button>
        </CardContent>
      </Card>
    );
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
            <h1 className="text-3xl font-headline font-bold text-foreground">
              {isEditMode ? 'Editar Aluno' : 'Detalhes do Aluno'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? `Modificando dados de ${student.name}` : `Visualizando dados de ${student.name}`}
            </p>
          </div>
          {!isEditMode && (
            <Button onClick={() => router.push(`/alunos/${studentId}?edit=true`)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Edit3 className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
        </div>

        {isEditMode ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="flex flex-wrap h-auto justify-start sm:justify-center mb-6 max-w-2xl mx-auto overflow-x-auto sm:overflow-x-visible">
                    <TabsTrigger value="personal">Pessoal</TabsTrigger>
                    <TabsTrigger value="sports">Info Esportiva</TabsTrigger>
                    <TabsTrigger value="schedule">Aulas & Financeiro</TabsTrigger>
                    <TabsTrigger value="training">Treino</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal">
                  <Card className="max-w-3xl mx-auto shadow-lg">
                    <CardHeader>
                      <CardTitle>Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="flex items-center gap-4">
                         <Controller name="photoURL" control={control} render={({ field }) => (
                           <Avatar className="h-20 w-20">
                            <AvatarImage src={field.value ?? undefined} alt={watch('name')} />
                            <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
                           </Avatar>
                         )} />
                         {/* Placeholder for upload logic */}
                         <Button type="button" variant="outline" onClick={() => toast({title: "Em breve!", description:"Upload de fotos será implementado em breve."})}>Alterar Foto</Button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} value={field.value ?? ''} />} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Controller name="phone" control={control} render={({ field }) => <Input id="phone" type="tel" {...field} value={field.value ?? ''} />} />
                          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                        </div>
                       </div>
                       <div className="space-y-2">
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <Controller name="birthDate" control={control} render={({ field }) => <Input id="birthDate" type="date" {...field} value={field.value ?? ''} />} />
                        {errors.birthDate && <p className="text-sm text-destructive">{errors.birthDate.message}</p>}
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="training">
                     <Card className="max-w-3xl mx-auto shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary"/>Plano de Treino</CardTitle>
                            <CardDescription>
                                {recurringClassDays.length > 0
                                ? "Defina o treino para cada dia selecionado."
                                : "Selecione os 'Dias da Semana para Aula Recorrente' na aba 'Info Esportiva' para montar os treinos."
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sortDays(recurringClassDays).length > 0 ? (
                                sortDays(recurringClassDays).map(day => (
                                    <TrainingDayEditor key={day} day={day} />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Nenhum dia de aula recorrente selecionado.
                                </p>
                            )}
                        </CardContent>
                     </Card>
                </TabsContent>
                
                <TabsContent value="sports">
                    <Card className="max-w-3xl mx-auto shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5 text-primary"/>Informações Esportivas</CardTitle>
                            <CardDescription>Acompanhe a evolução física do aluno.</CardDescription>
                        </CardHeader>
                         <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="plan">Plano</Label>
                                <div className="flex items-center gap-2">
                                <div className="flex-grow">
                                    <Controller name="plan" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={isLoadingPlans}>
                                        <SelectTrigger id="plan"><SelectValue placeholder={isLoadingPlans ? "Carregando..." : "Selecione o plano"} /></SelectTrigger>
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
                                    )} />
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="technicalLevel">Nível Técnico</Label>
                                    <Controller name="technicalLevel" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <SelectTrigger id="technicalLevel"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Iniciante">Iniciante</SelectItem><SelectItem value="Intermediário">Intermediário</SelectItem><SelectItem value="Avançado">Avançado</SelectItem></SelectContent>
                                    </Select>
                                    )} />
                                    {errors.technicalLevel && <p className="text-sm text-destructive">{errors.technicalLevel.message}</p>}
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Controller name="status" control={control} render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
                                    </Select>
                                )} />
                                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="objective">Objetivo</Label>
                                <Controller name="objective" control={control} render={({ field }) => <Textarea id="objective" placeholder="Descreva o objetivo do aluno..." {...field} value={field.value ?? ''} />} />
                                {errors.objective && <p className="text-sm text-destructive">{errors.objective.message}</p>}
                            </div>
                            <Separator />
                            <div className="space-y-4">
                              <Label className="text-base font-medium">Adicionar Nova Avaliação Física</Label>
                              <Card className="p-4 bg-muted/30 border">
                                <CardContent className="p-0 space-y-4">
                                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                      <div className="space-y-1">
                                        <Label htmlFor="newWeight" className="text-xs">Peso (kg)</Label>
                                        <Input id="newWeight" type="number" placeholder="75.5" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newHeight" className="text-xs">Altura (cm)</Label>
                                        <Input id="newHeight" type="number" placeholder="180" value={newHeight} onChange={(e) => setNewHeight(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newBodyFat" className="text-xs">% Gordura</Label>
                                        <Input id="newBodyFat" type="number" placeholder="15" value={newBodyFat} onChange={(e) => setNewBodyFat(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newChest" className="text-xs">Peito (cm)</Label>
                                        <Input id="newChest" type="number" placeholder="101" value={newChest} onChange={(e) => setNewChest(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newWaist" className="text-xs">Cintura (cm)</Label>
                                        <Input id="newWaist" type="number" placeholder="80" value={newWaist} onChange={(e) => setNewWaist(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newHips" className="text-xs">Quadril (cm)</Label>
                                        <Input id="newHips" type="number" placeholder="105" value={newHips} onChange={(e) => setNewHips(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                       <div className="space-y-1">
                                        <Label htmlFor="newLeftArm" className="text-xs">Braço E. (cm)</Label>
                                        <Input id="newLeftArm" type="number" placeholder="35" value={newLeftArm} onChange={(e) => setNewLeftArm(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newRightArm" className="text-xs">Braço D. (cm)</Label>
                                        <Input id="newRightArm" type="number" placeholder="35" value={newRightArm} onChange={(e) => setNewRightArm(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newLeftThigh" className="text-xs">Coxa E. (cm)</Label>
                                        <Input id="newLeftThigh" type="number" placeholder="60" value={newLeftThigh} onChange={(e) => setNewLeftThigh(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                      <div className="space-y-1">
                                        <Label htmlFor="newRightThigh" className="text-xs">Coxa D. (cm)</Label>
                                        <Input id="newRightThigh" type="number" placeholder="60" value={newRightThigh} onChange={(e) => setNewRightThigh(e.target.value)} disabled={isAddingAssessment}/>
                                      </div>
                                   </div>
                                   <Button type="button" onClick={handleAddAssessment} disabled={isAddingAssessment} className="w-full">
                                    {isAddingAssessment && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    {isAddingAssessment ? "Salvando..." : "Adicionar Avaliação"}
                                   </Button>
                                </CardContent>
                              </Card>
                            </div>
                         </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedule">
                    <Card className="max-w-3xl mx-auto shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/>Aulas Recorrentes</CardTitle>
                            <CardDescription>Defina o horário e os dias fixos para as aulas deste aluno. (Opcional)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="recurringClassTime" className="flex items-center"><ClockIcon className="mr-1 h-4 w-4"/>Horário da Aula</Label>
                                <Controller
                                name="recurringClassTime"
                                control={control}
                                render={({ field }) => <Input id="recurringClassTime" type="time" {...field} value={field.value ?? ''} />}
                                />
                                {errors.recurringClassTime && <p className="text-sm text-destructive">{errors.recurringClassTime.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recurringClassLocation" className="flex items-center"><MapPinIcon className="mr-1 h-4 w-4"/>Local da Aula</Label>
                                <Controller
                                name="recurringClassLocation"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value || NO_LOCATION_VALUE} disabled={isLoadingLocations}>
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
                                    const currentDays = Array.isArray(field.value) ? field.value : [];
                                    return (
                                        <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`day-edit-${day}`}
                                            checked={currentDays.includes(day)}
                                            onCheckedChange={(checked) => {
                                            const newDays = checked
                                                ? [...currentDays, day]
                                                : currentDays.filter((d) => d !== day);
                                            field.onChange(newDays);
                                            }}
                                        />
                                        <Label htmlFor={`day-edit-${day}`} className="font-normal">
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
                                    <Controller name="amountDue" control={control} render={({ field }) => <Input id="amountDue" type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => { const val = e.target.value; field.onChange(val === '' ? undefined : parseFloat(val)); }} />} />
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
                    </Card>
                </TabsContent>
                <div className="max-w-3xl mx-auto w-full px-6 pb-6 mt-4">
                    <CardFooter className="flex justify-end gap-2 p-0">
                        <Button variant="outline" type="button" onClick={() => { setIsEditMode(false); router.replace(`/alunos/${studentId}`); reset({...student, objective: student?.objective || '', recurringClassTime: student?.recurringClassTime || '', recurringClassDays: student?.recurringClassDays || [], recurringClassLocation: student?.recurringClassLocation || NO_LOCATION_VALUE, dueDate: student?.dueDate?.split('T')[0] || '', lastPaymentDate: student?.lastPaymentDate?.split('T')[0] || '', amountDue: student?.amountDue === null || student?.amountDue === undefined ? undefined : student.amountDue, paymentStatus: student?.paymentStatus || undefined, paymentMethod: student?.paymentMethod || undefined, trainingSheetWorkouts: student?.trainingSheet?.workouts || {}  } as StudentFormData); }}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting || isLoadingLocations || isLoadingPlans} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </CardFooter>
                </div>
            </Tabs>
          </form>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap h-auto justify-start sm:justify-center mb-6 max-w-2xl mx-auto overflow-x-auto sm:overflow-x-visible">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="schedule">Aulas</TabsTrigger>
              <TabsTrigger value="evolution">Evolução Física</TabsTrigger>
              <TabsTrigger value="payments">Financeiro</TabsTrigger>
              <TabsTrigger value="training_sheet">Treino</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={student.photoURL ?? undefined} alt={student.name} />
                        <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl font-headline">{student.name}</CardTitle>
                        <CardDescription>ID: {student.id}</CardDescription>
                    </div>
                  </div>
                  {student.status === 'active'
                    ? <Badge className="bg-green-500/20 text-green-700 border-green-500/30 py-1 px-3 text-sm"><ShieldCheck className="inline mr-1 h-4 w-4" />Ativo</Badge>
                    : <Badge className="bg-red-500/20 text-red-700 border-red-500/30 py-1 px-3 text-sm"><ShieldOff className="inline mr-1 h-4 w-4" />Inativo</Badge>
                  }
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                  <InfoItem icon={User} label="Nome Completo" value={student.name} />
                  <InfoItem icon={Phone} label="Telefone" value={student.phone} />
                  <InfoItem icon={CalendarDays} label="Data de Nascimento" value={student.birthDate ? `${formatDateString(student.birthDate)} (${studentAge} anos)` : 'N/A'} />
                  <InfoItem icon={CalendarIcon} label="Data de Cadastro" value={formatDateString(student.registrationDate)} />
                  <InfoItem icon={student.status === 'active' ? ShieldCheck : ShieldOff} label="Status" value={student.status === 'active' ? 'Ativo' : 'Inativo'} />
                </CardContent>
                {student.objective && (
                  <CardContent className="pt-0">
                    <InfoItem icon={Goal} label="Objetivo" value={student.objective} isLongText={true} />
                  </CardContent>
                )}
                 <CardContent className="pt-2">
                   <Label className="text-sm text-muted-foreground">Histórico de Presença (Últimos 5)</Label>
                    {student.attendanceHistory && student.attendanceHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table className="mt-2">
                          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>ID Aula Agendada</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {student.attendanceHistory.slice(0, 5).map((att, index) => (
                              <TableRow key={index}>
                                <TableCell>{formatDateString(att.date)}</TableCell>
                                <TableCell>{att.bookedClassId}</TableCell>
                                <TableCell>
                                  {att.status === 'present' && <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="inline mr-1 h-3 w-3" /> Presente</Badge>}
                                  {att.status === 'absent' && <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="inline mr-1 h-3 w-3" /> Ausente</Badge>}
                                  {att.status === 'rescheduled' && <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><Clock className="inline mr-1 h-3 w-3" /> Remarcado</Badge>}
                                  {att.status === 'pending' && <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Clock className="inline mr-1 h-3 w-3" /> Pendente</Badge>}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">Nenhum histórico de presença registrado.</p>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="evolution">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary"/>Evolução Física</CardTitle>
                        <CardDescription>Plano, nível e histórico de avaliações físicas.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="grid sm:grid-cols-2 gap-6">
                            <InfoItem icon={Users} label="Plano" value={student.plan} />
                            <InfoItem icon={BarChart} label="Nível Técnico" value={student.technicalLevel} />
                         </div>
                        <Separator />
                        <CardTitle className="text-lg">Gráfico de Evolução</CardTitle>
                         {sortedAssessments.length > 1 ? (
                          <ChartContainer config={{}} className="min-h-[250px] w-full">
                            <ResponsiveContainer>
                               <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{fontSize: 12}} />
                                <YAxis yAxisId="left" label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }} tick={{fontSize: 12}}/>
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Gordura (%)', angle: -90, position: 'insideRight' }} tick={{fontSize: 12}}/>
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="Peso" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                                <Line yAxisId="right" type="monotone" dataKey="Gordura (%)" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}}/>
                              </ComposedChart>
                            </ResponsiveContainer>
                           </ChartContainer>
                         ) : (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                Adicione pelo menos duas avaliações físicas para ver o gráfico de evolução.
                            </p>
                         )}
                        <Separator />
                        <CardTitle className="text-lg">Histórico de Avaliações</CardTitle>
                        {sortedAssessments.length > 0 ? (
                           <div className="overflow-x-auto">
                           <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Peso</TableHead>
                                    <TableHead>Altura</TableHead>
                                    <TableHead>% Gord</TableHead>
                                    <TableHead>Peito</TableHead>
                                    <TableHead>Cintura</TableHead>
                                    <TableHead>Quadril</TableHead>
                                    <TableHead>B. Esq</TableHead>
                                    <TableHead>B. Dir</TableHead>
                                    <TableHead>C. Esq</TableHead>
                                    <TableHead>C. Dir</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAssessments.map((assessment, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{formatDateString(assessment.date)}</TableCell>
                                        <TableCell>{assessment.weight || '-'}</TableCell>
                                        <TableCell>{assessment.height || '-'}</TableCell>
                                        <TableCell>{assessment.bodyFatPercentage || '-'}</TableCell>
                                        <TableCell>{assessment.chest || '-'}</TableCell>
                                        <TableCell>{assessment.waist || '-'}</TableCell>
                                        <TableCell>{assessment.hips || '-'}</TableCell>
                                        <TableCell>{assessment.leftArm || '-'}</TableCell>
                                        <TableCell>{assessment.rightArm || '-'}</TableCell>
                                        <TableCell>{assessment.leftThigh || '-'}</TableCell>
                                        <TableCell>{assessment.rightThigh || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                           </Table>
                           </div>
                        ) : (
                           <p className="text-center text-sm text-muted-foreground py-8">
                                Nenhuma avaliação física registrada. Adicione uma na aba de edição.
                           </p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="training_sheet">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Dumbbell className="mr-2 h-5 w-5 text-primary"/>Plano de Treino</CardTitle>
                        <CardDescription>Ficha de treino atual do aluno. Atualizado em: {student.trainingSheet?.lastUpdated ? formatDateString(student.trainingSheet.lastUpdated) : 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {student.trainingSheet?.workouts && Object.values(student.trainingSheet.workouts).some(day => day && day.length > 0) ? (
                            sortDays(Object.keys(student.trainingSheet.workouts) as DayOfWeek[]).map(day => {
                                const exercises = student.trainingSheet!.workouts[day];
                                if (!exercises || exercises.length === 0) return null;
                                return (
                                    <div key={day}>
                                        <h3 className="font-semibold text-lg text-foreground mb-2">Treino de {day}</h3>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Exercício</TableHead>
                                                        <TableHead>Séries</TableHead>
                                                        <TableHead>Reps</TableHead>
                                                        <TableHead>Descanso</TableHead>
                                                        <TableHead>Obs</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {exercises.map(ex => (
                                                        <TableRow key={ex.id}>
                                                            <TableCell className="font-medium">{ex.name}</TableCell>
                                                            <TableCell>{ex.sets}</TableCell>
                                                            <TableCell>{ex.reps}</TableCell>
                                                            <TableCell>{ex.rest}</TableCell>
                                                            <TableCell>{ex.notes || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-muted-foreground text-center py-4">Nenhuma ficha de treino cadastrada para este aluno.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Aulas Recorrentes Programadas</CardTitle>
                  <CardDescription>Horários e dias fixos de treino para {student.name}.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                  <InfoItem icon={ClockIcon} label="Horário Recorrente" value={student.recurringClassTime} />
                  <InfoItem icon={MapPinIcon} label="Local Recorrente" value={student.recurringClassLocation} />
                  <InfoItem icon={CalendarDays} label="Dias Recorrentes" value={student.recurringClassDays && student.recurringClassDays.length > 0 ? student.recurringClassDays : "Nenhum dia definido"} />
                </CardContent>
                {!student.recurringClassTime && (!student.recurringClassDays || student.recurringClassDays.length === 0) && (
                    <CardContent>
                        <p className="text-muted-foreground text-center py-4">Nenhuma aula recorrente configurada para este aluno.</p>
                    </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Detalhes Financeiros</CardTitle>
                  <CardDescription>Informações sobre o plano atual e status de pagamento.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem icon={DollarSign} label="Plano Atual" value={student.plan} />
                   <InfoItem icon={DollarSign} label="Status do Pagamento">
                       {getPaymentStatusBadge(student.paymentStatus)}
                   </InfoItem>
                  <InfoItem icon={CalendarDays} label="Data de Vencimento" value={formatDateString(student.dueDate)} />
                  <InfoItem icon={DollarSign} label="Valor Devido" value={student.amountDue ? `R$ ${student.amountDue.toFixed(2)}` : 'N/A'} />
                  <InfoItem icon={DollarSign} label="Método de Pagamento Preferencial" value={student.paymentMethod} />
                  <InfoItem icon={CalendarDays} label="Último Pagamento" value={formatDateString(student.lastPaymentDate)} />
                </CardContent>
                <CardFooter>
                  <Button asChild className="mt-4">
                    <Link href={`/financeiro/lembrete/${student.id}`}>
                      <DollarSign className="mr-2 h-4 w-4" /> Gerar Lembrete de Pagamento
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
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

    