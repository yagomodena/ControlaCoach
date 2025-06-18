
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, CalendarDays, DollarSign, ShieldCheck, ShieldOff, User, Phone, BarChart, Users, CheckCircle, XCircle, Clock, Goal, PlusCircle, Search, MapPinIcon, ClockIcon } from 'lucide-react';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Student, Plan, Location, DayOfWeek } from '@/types';
import { MOCK_STUDENTS, MOCK_PLANS, MOCK_LOCATIONS, DAYS_OF_WEEK } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AddPlanDialog } from '@/components/dialogs/add-plan-dialog';
import { ManagePlansDialog } from '@/components/dialogs/manage-plans-dialog';

const studentSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }),
  plan: z.string().min(1, { message: 'Selecione um plano.' }),
  technicalLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado'], { required_error: 'Selecione o nível técnico.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
  objective: z.string().optional(),
  paymentStatus: z.enum(['pago', 'pendente', 'vencido']).optional(),
  dueDate: z.string().optional(),
  amountDue: z.number().optional(),
  paymentMethod: z.enum(['PIX', 'Dinheiro', 'Cartão']).optional(),
  recurringClassTime: z.string().optional().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." }),
  recurringClassDays: z.array(z.enum(DAYS_OF_WEEK)).optional(),
  recurringClassLocation: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function AlunoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [activePlans, setActivePlans] = useState<Plan[]>([]);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [isAddPlanDialogOpen, setIsAddPlanDialogOpen] = useState(false);
  const [isManagePlansDialogOpen, setIsManagePlansDialogOpen] = useState(false);

  const refreshActivePlans = () => {
    setActivePlans(MOCK_PLANS.filter(p => p.status === 'active'));
  };

  const refreshActiveLocations = () => {
    setActiveLocations(MOCK_LOCATIONS.filter(loc => loc.status === 'active'));
  };

  useEffect(() => {
    refreshActivePlans();
    refreshActiveLocations();
  }, []);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, watch, setValue } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  useEffect(() => {
    setIsLoading(true);
    const foundStudent = MOCK_STUDENTS.find(s => s.id === studentId);
    if (foundStudent) {
      setStudent(foundStudent);
      reset({
        ...foundStudent,
        recurringClassTime: foundStudent.recurringClassTime || '',
        recurringClassDays: foundStudent.recurringClassDays || [],
        recurringClassLocation: foundStudent.recurringClassLocation || '',
      } as StudentFormData);
    } else {
      toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
      router.push('/alunos');
    }
    setIsLoading(false);
  }, [studentId, reset, router, toast]);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: StudentFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedStudentData = { 
      ...student, 
      ...data,
      objective: data.objective || undefined,
      recurringClassTime: data.recurringClassTime || undefined,
      recurringClassDays: data.recurringClassDays?.length ? data.recurringClassDays : undefined,
      recurringClassLocation: data.recurringClassLocation || undefined,
    } as Student;
    setStudent(updatedStudentData);
    
    const studentIndex = MOCK_STUDENTS.findIndex(s => s.id === studentId);
    if (studentIndex !== -1) {
        MOCK_STUDENTS[studentIndex] = updatedStudentData;
    }

    toast({
      title: "Aluno Atualizado!",
      description: `${data.name} foi atualizado com sucesso.`,
    });
    setIsEditMode(false);
    router.replace(`/alunos/${studentId}`);
  };

  const handlePlansManaged = () => {
    const currentPlanValue = watch('plan');
    refreshActivePlans();
    const currentPlanExistsAndIsActive = MOCK_PLANS.some(p => p.name === currentPlanValue && p.status === 'active');
    if (!currentPlanExistsAndIsActive && MOCK_PLANS.filter(p => p.status === 'active').length > 0) {
       // setValue('plan', ''); 
    } else if (!currentPlanExistsAndIsActive) {
       setValue('plan', ''); 
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Carregando dados do aluno...</div>;
  }

  if (!student) {
    return <div className="container mx-auto py-8 text-center text-destructive">Aluno não encontrado.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value, isLongText = false }: { icon: React.ElementType, label: string, value?: string | number | null | DayOfWeek[], isLongText?: boolean }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {Array.isArray(value) ? (
          <p className="font-medium text-foreground">{value.join(', ') || 'N/A'}</p>
        ) : isLongText && value ? (
            <p className="font-medium text-foreground whitespace-pre-wrap">{String(value)}</p>
        ) : (
            <p className="font-medium text-foreground">{value != null ? String(value) : 'N/A'}</p>
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
            <Button onClick={() => setIsEditMode(true)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Edit3 className="mr-2 h-4 w-4" /> Editar
            </Button>
          )}
        </div>

        {isEditMode ? (
          <Card className="max-w-3xl mx-auto shadow-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Editar Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Controller name="phone" control={control} render={({ field }) => <Input id="phone" type="tel" {...field} />} />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plano</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow">
                        <Controller name="plan" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="plan"><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                            <SelectContent>
                              {activePlans.length > 0 ? (
                                activePlans.map(p => (
                                  <SelectItem key={p.id} value={p.name}>{p.name} - R$ {p.price.toFixed(2)}</SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-plans" disabled>Nenhum plano ativo</SelectItem>
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
                  <div className="space-y-2">
                    <Label htmlFor="technicalLevel">Nível Técnico</Label>
                    <Controller name="technicalLevel" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="technicalLevel"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Iniciante">Iniciante</SelectItem><SelectItem value="Intermediário">Intermediário</SelectItem><SelectItem value="Avançado">Avançado</SelectItem></SelectContent>
                      </Select>
                    )} />
                    {errors.technicalLevel && <p className="text-sm text-destructive">{errors.technicalLevel.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller name="status" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
                    </Select>
                  )} />
                  {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objective">Objetivo</Label>
                  <Controller name="objective" control={control} render={({ field }) => <Textarea id="objective" placeholder="Descreva o objetivo do aluno..." {...field} />} />
                  {errors.objective && <p className="text-sm text-destructive">{errors.objective.message}</p>}
                </div>
              </CardContent>

              <Separator className="my-6" />

              <CardHeader className="pt-0">
                <CardTitle className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary"/>Horários e Dias de Aula Recorrentes</CardTitle>
                <CardDescription>Defina o horário e os dias fixos para as aulas deste aluno. (Opcional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="recurringClassTime" className="flex items-center"><ClockIcon className="mr-1 h-4 w-4"/>Horário da Aula</Label>
                    <Controller
                      name="recurringClassTime"
                      control={control}
                      render={({ field }) => <Input id="recurringClassTime" type="time" {...field} />}
                    />
                    {errors.recurringClassTime && <p className="text-sm text-destructive">{errors.recurringClassTime.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurringClassLocation" className="flex items-center"><MapPinIcon className="mr-1 h-4 w-4"/>Local da Aula</Label>
                    <Controller
                      name="recurringClassLocation"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger id="recurringClassLocation">
                            <SelectValue placeholder="Selecione o local" />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="">Nenhum local específico</SelectItem>
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

              <CardFooter className="flex justify-end gap-2 pt-6">
                <Button variant="outline" type="button" onClick={() => { setIsEditMode(false); router.replace(`/alunos/${studentId}`); reset({...student, recurringClassTime: student.recurringClassTime || '', recurringClassDays: student.recurringClassDays || [], recurringClassLocation: student.recurringClassLocation || ''} as StudentFormData); }}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 max-w-lg mx-auto"> {/* Increased max-w for 3 tabs */}
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="schedule">Aulas Recorrentes</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              {/* <TabsTrigger value="attendance">Presença</TabsTrigger> Removed for now, can be added back if needed */}
            </TabsList>

            <TabsContent value="overview">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-headline">{student.name}</CardTitle>
                    <CardDescription>ID: {student.id}</CardDescription>
                  </div>
                  {student.status === 'active'
                    ? <Badge className="bg-green-500/20 text-green-700 border-green-500/30 py-1 px-3 text-sm"><ShieldCheck className="inline mr-1 h-4 w-4" />Ativo</Badge>
                    : <Badge className="bg-red-500/20 text-red-700 border-red-500/30 py-1 px-3 text-sm"><ShieldOff className="inline mr-1 h-4 w-4" />Inativo</Badge>
                  }
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                  <InfoItem icon={User} label="Nome Completo" value={student.name} />
                  <InfoItem icon={Phone} label="Telefone" value={student.phone} />
                  <InfoItem icon={Users} label="Plano" value={student.plan} />
                  <InfoItem icon={BarChart} label="Nível Técnico" value={student.technicalLevel} />
                  <InfoItem icon={CalendarDays} label="Data de Cadastro" value={new Date(student.registrationDate).toLocaleDateString('pt-BR')} />
                  <InfoItem icon={student.status === 'active' ? ShieldCheck : ShieldOff} label="Status" value={student.status === 'active' ? 'Ativo' : 'Inativo'} />
                </CardContent>
                {student.objective && (
                  <CardContent className="pt-0">
                    <InfoItem icon={Goal} label="Objetivo" value={student.objective} isLongText={true} />
                  </CardContent>
                )}
                 <CardContent className="pt-2"> {/* Histórico de presença */}
                   <Label className="text-sm text-muted-foreground">Histórico de Presença</Label>
                    {student.attendanceHistory && student.attendanceHistory.length > 0 ? (
                      <Table className="mt-2">
                        <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Aula ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {student.attendanceHistory.slice(0, 5).map((att, index) => ( // Show recent 5
                            <TableRow key={index}>
                              <TableCell>{new Date(att.date).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>{att.classId}</TableCell>
                              <TableCell>
                                {att.status === 'present' && <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle className="inline mr-1 h-3 w-3" /> Presente</Badge>}
                                {att.status === 'absent' && <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><XCircle className="inline mr-1 h-3 w-3" /> Ausente</Badge>}
                                {att.status === 'rescheduled' && <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><Clock className="inline mr-1 h-3 w-3" /> Remarcado</Badge>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-sm mt-1">Nenhum histórico de presença registrado.</p>
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
                <CardContent className="space-y-6">
                  <InfoItem icon={DollarSign} label="Plano Atual" value={student.plan} />
                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Status do Pagamento</p>
                      {getPaymentStatusBadge(student.paymentStatus)}
                    </div>
                  </div>
                  <InfoItem icon={CalendarDays} label="Data de Vencimento" value={student.dueDate ? new Date(student.dueDate).toLocaleDateString('pt-BR') : 'N/A'} />
                  <InfoItem icon={DollarSign} label="Valor Devido" value={student.amountDue ? `R$ ${student.amountDue.toFixed(2)}` : 'N/A'} />
                  <InfoItem icon={DollarSign} label="Método de Pagamento Preferencial" value={student.paymentMethod} />
                  <InfoItem icon={CalendarDays} label="Último Pagamento" value={student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString('pt-BR') : 'N/A'} />
                  <Button asChild className="mt-4">
                    <Link href={`/financeiro/lembrete/${student.id}`}>
                      <DollarSign className="mr-2 h-4 w-4" /> Gerar Lembrete de Pagamento
                    </Link>
                  </Button>
                </CardContent>
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
