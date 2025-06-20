
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, Clock, MapPin, Users, CalendarDays, PlusCircle, Search, ClockIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type ClassSession, DAYS_OF_WEEK, MOCK_LOCATIONS, type Location, type Student } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';

const classSessionSchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK, { required_error: 'Selecione o dia da semana.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." }),
  location: z.string().min(1, { message: 'Selecione um local.' }), 
  maxStudents: z.coerce.number().int().positive({ message: 'Número de alunos deve ser positivo.' }).min(1, {message: 'Mínimo 1 aluno'}),
  enrolledStudentIds: z.array(z.string()).optional(),
});

type ClassSessionFormData = z.infer<typeof classSessionSchema>;

export default function AulaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const classId = params.classId as string;
  
  const [classSession, setClassSession] = useState<ClassSession | null>(null);
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  useEffect(() => {
    setActiveLocations(MOCK_LOCATIONS.filter(loc => loc.status === 'active'));
    
    setIsLoadingStudents(true);
    const studentsCollectionRef = collection(db, 'students');
    const q = query(studentsCollectionRef, where('status', '==', 'active'), orderBy('name', 'asc'));

    const unsubscribeStudents = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setActiveStudents(studentsData);
      setIsLoadingStudents(false);
    }, (error) => {
      console.error("Error fetching active students: ", error);
      toast({
        title: "Erro ao Carregar Alunos",
        description: "Não foi possível buscar os dados dos alunos ativos.",
        variant: "destructive",
      });
      setIsLoadingStudents(false);
    });

    return () => unsubscribeStudents();
  }, [toast]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, watch } = useForm<ClassSessionFormData>({
    resolver: zodResolver(classSessionSchema),
  });
  
  const enrolledStudentIds = watch('enrolledStudentIds') || [];

  useEffect(() => {
    if (!classId) return;
    setIsLoading(true);
    const fetchClassSession = async () => {
      try {
        const classSessionDocRef = doc(db, 'classSessions', classId);
        const classSessionDocSnap = await getDoc(classSessionDocRef);

        if (classSessionDocSnap.exists()) {
          const sessionData = { ...classSessionDocSnap.data(), id: classSessionDocSnap.id } as ClassSession;
          setClassSession(sessionData);
          reset({...sessionData, enrolledStudentIds: sessionData.enrolledStudentIds || []}); 
        } else {
          toast({ title: "Erro", description: "Configuração de aula não encontrada.", variant: "destructive" });
          router.push('/aulas');
        }
      } catch (error) {
        console.error("Error fetching class session details: ", error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os dados da configuração de aula.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassSession();
  }, [classId, reset, router, toast]);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: ClassSessionFormData) => {
    if (!classId) return;
    if (data.startTime >= data.endTime) {
      toast({
        title: "Erro de Validação",
        description: "O horário de término deve ser posterior ao horário de início.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const classSessionDocRef = doc(db, 'classSessions', classId);
      const updatePayload: Omit<ClassSession, 'id'> = {
         ...data,
         maxStudents: Number(data.maxStudents),
         enrolledStudentIds: data.enrolledStudentIds || [],
      };
      await updateDoc(classSessionDocRef, updatePayload);

      const updatedClassSessionData = { ...(classSession || {}), ...updatePayload, id: classId } as ClassSession;
      setClassSession(updatedClassSessionData);

      toast({
        title: "Configuração Atualizada!",
        description: `Aula de ${data.dayOfWeek} das ${data.startTime} às ${data.endTime} foi atualizada.`,
      });
      setIsEditMode(false);
      router.replace(`/aulas/${classId}`); 
    } catch (error) {
      console.error("Error updating class session: ", error);
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar a configuração da aula. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || isLoadingStudents) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados da aula...</p>
      </div>
    );
  }

  if (!classSession) {
    return <div className="container mx-auto py-8 text-center text-destructive">Configuração de aula não encontrada.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value, children }: { icon: React.ElementType, label: string, value?: string | number | null, children?: React.ReactNode }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {children ? children : <p className="font-medium text-foreground">{value || 'N/A'}</p>}
      </div>
    </div>
  );
  
  const getEnrolledStudentNames = () => {
    if (!classSession || !classSession.enrolledStudentIds || classSession.enrolledStudentIds.length === 0) return 'Nenhum aluno inscrito (padrão).';
    return classSession.enrolledStudentIds
      .map(id => activeStudents.find(s => s.id === id)?.name)
      .filter(name => !!name)
      .join(', ');
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/aulas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {isEditMode ? 'Editar Configuração de Aula' : 'Detalhes da Configuração de Aula'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Modificando aula de ${classSession.dayOfWeek}, ${classSession.startTime} - ${classSession.endTime}` : `Visualizando aula de ${classSession.dayOfWeek}, ${classSession.startTime} - ${classSession.endTime}`}
          </p>
        </div>
        {!isEditMode && (
          <Button onClick={() => router.push(`/aulas/${classId}?edit=true`)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {isEditMode ? (
        <Card className="max-w-2xl mx-auto shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Editar Detalhes da Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                    <Controller
                    name="dayOfWeek"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="dayOfWeek"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {DAYS_OF_WEEK.map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                    />
                    {errors.dayOfWeek && <p className="text-sm text-destructive">{errors.dayOfWeek.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="startTime" className="flex items-center"><ClockIcon className="mr-1 h-4 w-4"/>Horário de Início</Label>
                        <Controller name="startTime" control={control} render={({ field }) => <Input id="startTime" type="time" {...field} />} />
                        {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="endTime" className="flex items-center"><ClockIcon className="mr-1 h-4 w-4"/>Horário de Término</Label>
                        <Controller name="endTime" control={control} render={({ field }) => <Input id="endTime" type="time" {...field} />} />
                        {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow">
                      <Controller 
                          name="location" 
                          control={control} 
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger id="location">
                                      <SelectValue placeholder="Selecione o local" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {activeLocations.length > 0 ? (
                                          activeLocations.map(loc => (
                                              <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                                          ))
                                      ) : (
                                          <SelectItem value="no-location" disabled>Nenhum local ativo</SelectItem>
                                      )}
                                  </SelectContent>
                              </Select>
                          )} 
                      />
                    </div>
                    <Button variant="outline" size="icon" asChild>
                      <Link href="/locais/novo" target="_blank" rel="noopener noreferrer">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Adicionar Novo Local</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href="/locais" target="_blank" rel="noopener noreferrer">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Consultar Locais</span>
                      </Link>
                    </Button>
                  </div>
                  {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="maxStudents">Máximo de Alunos na Turma</Label>
                    <Controller name="maxStudents" control={control} render={({ field }) => <Input id="maxStudents" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} />} />
                    {errors.maxStudents && <p className="text-sm text-destructive">{errors.maxStudents.message}</p>}
                </div>

                <Separator />

                <div>
                    <Label className="text-base font-medium flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Alunos Inscritos (Padrão)</Label>
                    <p className="text-sm text-muted-foreground mb-3">Selecione os alunos que tipicamente participam desta configuração de aula.</p>
                    {isLoadingStudents ? (
                         <div className="flex justify-center items-center h-[200px] w-full rounded-md border p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                         </div>
                    ): (
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                        {activeStudents.length > 0 ? (
                            activeStudents.map(student => (
                                 <Controller
                                    key={student.id}
                                    name="enrolledStudentIds"
                                    control={control}
                                    render={({ field }) => {
                                      const currentSelectedIds = field.value || [];
                                      return (
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Checkbox
                                            id={`edit-enroll-student-${student.id}`}
                                            checked={currentSelectedIds.includes(student.id)}
                                            onCheckedChange={(checked) => {
                                              const newIds = checked
                                                ? [...currentSelectedIds, student.id]
                                                : currentSelectedIds.filter((id) => id !== student.id);
                                              field.onChange(newIds);
                                            }}
                                          />
                                          <Label htmlFor={`edit-enroll-student-${student.id}`} className="font-normal">
                                            {student.name}
                                          </Label>
                                        </div>
                                      );
                                    }}
                                  />
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aluno ativo encontrado para inscrição.</p>
                        )}
                    </ScrollArea>
                    )}
                    {errors.enrolledStudentIds && <p className="text-sm text-destructive mt-1">{errors.enrolledStudentIds.message}</p>}
                </div>


            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => { setIsEditMode(false); router.replace(`/aulas/${classId}`); reset({...classSession, enrolledStudentIds: classSession?.enrolledStudentIds || [] }); }}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || isLoadingStudents} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{classSession.dayOfWeek} - {classSession.startTime} às {classSession.endTime}</CardTitle>
                <CardDescription>ID da Configuração: {classSession.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <InfoItem icon={CalendarDays} label="Dia da Semana" value={classSession.dayOfWeek} />
                <InfoItem icon={Clock} label="Horário de Início" value={classSession.startTime} />
                <InfoItem icon={Clock} label="Horário de Término" value={classSession.endTime} />
                <InfoItem icon={MapPin} label="Local" value={classSession.location} />
                <InfoItem icon={Users} label="Máximo de Alunos na Turma" value={classSession.maxStudents} />
                <InfoItem icon={Users} label="Alunos Inscritos (Padrão)">
                    <p className="font-medium text-foreground whitespace-pre-line">
                        {getEnrolledStudentNames()} ({(classSession.enrolledStudentIds?.length || 0)} de {classSession.maxStudents})
                    </p>
                </InfoItem>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Esta é uma configuração de aula recorrente. Para agendar aulas específicas ou gerenciar presenças individuais, vá para a Agenda.
                </p>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

