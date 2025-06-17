
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
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
import { MOCK_CLASS_SESSIONS, type ClassSession, DAYS_OF_WEEK, MOCK_LOCATIONS, type Location } from '@/types';

const classSessionSchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK, { required_error: 'Selecione o dia da semana.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido (HH:MM)." }),
  location: z.string().min(1, { message: 'Selecione um local.' }), // Location is now a string name, required
  maxStudents: z.coerce.number().int().positive({ message: 'Número de alunos deve ser positivo.' }).min(1, {message: 'Mínimo 1 aluno'}),
});

type ClassSessionFormData = z.infer<typeof classSessionSchema>;

export default function NovaAulaConfigPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);

  useEffect(() => {
    setActiveLocations(MOCK_LOCATIONS.filter(loc => loc.status === 'active'));
  }, []);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClassSessionFormData>({
    resolver: zodResolver(classSessionSchema),
    defaultValues: {
      dayOfWeek: undefined,
      time: '',
      location: undefined, // Changed from ''
      maxStudents: 10,
    },
  });

  const onSubmit = async (data: ClassSessionFormData) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newClassSession: ClassSession = {
      id: crypto.randomUUID(), 
      ...data,
      enrolledStudentIds: [], 
    };
    MOCK_CLASS_SESSIONS.push(newClassSession); 
    
    toast({
      title: "Configuração de Aula Adicionada!",
      description: `Aula de ${data.dayOfWeek} às ${data.time} em ${data.location} configurada.`,
    });
    router.push('/aulas'); 
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
          <h1 className="text-3xl font-headline font-bold text-foreground">Nova Configuração de Aula</h1>
          <p className="text-muted-foreground">Preencha os dados da nova configuração de aula.</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Detalhes da Aula</CardTitle>
            <CardDescription>Defina os parâmetros para esta aula regular.</CardDescription>
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
                      <SelectTrigger id="dayOfWeek">
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
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
                <Controller
                  name="time"
                  control={control}
                  render={({ field }) => <Input id="time" type="time" {...field} />}
                />
                {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
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
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Máximo de Alunos</Label>
               <Controller
                name="maxStudents"
                control={control}
                render={({ field }) => <Input id="maxStudents" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} />}
              />
              {errors.maxStudents && <p className="text-sm text-destructive">{errors.maxStudents.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
             <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
