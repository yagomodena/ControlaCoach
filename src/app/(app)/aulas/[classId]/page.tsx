
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, Clock, MapPin, Users, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MOCK_CLASS_SESSIONS, type ClassSession, DAYS_OF_WEEK } from '@/types';
import { useToast } from '@/hooks/use-toast';

const classSessionSchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK, { required_error: 'Selecione o dia da semana.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." }),
  location: z.string().min(3, { message: 'Local deve ter pelo menos 3 caracteres.' }),
  maxStudents: z.coerce.number().int().positive({ message: 'Número de alunos deve ser positivo.' }).min(1, {message: 'Mínimo 1 aluno'}),
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

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClassSessionFormData>({
    resolver: zodResolver(classSessionSchema),
  });

  useEffect(() => {
    setIsLoading(true);
    const foundClassSession = MOCK_CLASS_SESSIONS.find(cs => cs.id === classId);
    if (foundClassSession) {
      setClassSession(foundClassSession);
      reset(foundClassSession); 
    } else {
      toast({ title: "Erro", description: "Configuração de aula não encontrada.", variant: "destructive" });
      router.push('/aulas');
    }
    setIsLoading(false);
  }, [classId, reset, router, toast]);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: ClassSessionFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    const classSessionIndex = MOCK_CLASS_SESSIONS.findIndex(cs => cs.id === classId);
    if (classSessionIndex !== -1 && classSession) {
        const updatedClassSession: ClassSession = {
            ...MOCK_CLASS_SESSIONS[classSessionIndex],
            ...data,
            maxStudents: Number(data.maxStudents), // Ensure it's a number
        };
        MOCK_CLASS_SESSIONS[classSessionIndex] = updatedClassSession;
        setClassSession(updatedClassSession); // Update local state
    }

    toast({
      title: "Configuração Atualizada!",
      description: `Aula de ${data.dayOfWeek} às ${data.time} foi atualizada.`,
    });
    setIsEditMode(false);
    router.replace(`/aulas/${classId}`); 
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Carregando dados da aula...</div>;
  }

  if (!classSession) {
    return <div className="container mx-auto py-8 text-center text-destructive">Configuração de aula não encontrada.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || 'N/A'}</p>
      </div>
    </div>
  );

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
            {isEditMode ? `Modificando aula de ${classSession.dayOfWeek}, ${classSession.time}` : `Visualizando aula de ${classSession.dayOfWeek}, ${classSession.time}`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Controller name="time" control={control} render={({ field }) => <Input id="time" type="time" {...field} />} />
                    {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
                </div>
                </div>

                <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Controller name="location" control={control} render={({ field }) => <Input id="location" {...field} />} />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="maxStudents">Máximo de Alunos</Label>
                <Controller name="maxStudents" control={control} render={({ field }) => <Input id="maxStudents" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} />} />
                {errors.maxStudents && <p className="text-sm text-destructive">{errors.maxStudents.message}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => { setIsEditMode(false); router.replace(`/aulas/${classId}`); reset(classSession); }}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{classSession.dayOfWeek} - {classSession.time}</CardTitle>
                <CardDescription>ID da Configuração: {classSession.id}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                <InfoItem icon={CalendarDays} label="Dia da Semana" value={classSession.dayOfWeek} />
                <InfoItem icon={Clock} label="Horário" value={classSession.time} />
                <InfoItem icon={MapPin} label="Local" value={classSession.location} />
                <InfoItem icon={Users} label="Máximo de Alunos" value={classSession.maxStudents} />
                <InfoItem icon={Users} label="Alunos Inscritos" value={`${classSession.enrolledStudentIds.length} de ${classSession.maxStudents}`} />
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Esta é uma configuração de aula recorrente. Para agendar aulas específicas ou gerenciar presenças, vá para a Agenda.
                </p>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
