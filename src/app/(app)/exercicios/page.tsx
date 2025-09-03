
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Dumbbell, Loader2, Search } from "lucide-react";
import { type LibraryExercise } from '@/types';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, deleteDoc, doc, query, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const exerciseSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  muscleGroup: z.string().min(2, { message: "O grupo muscular deve ter pelo menos 2 caracteres." }).optional().or(z.literal('')),
  newMuscleGroup: z.string().optional(),
  defaultSets: z.string().optional(),
  defaultReps: z.string().optional(),
  defaultRest: z.string().optional(),
  defaultNotes: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface ExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: LibraryExercise | null;
  onSave: () => void;
  existingMuscleGroups: string[];
}

function ExerciseDialog({ open, onOpenChange, exercise, onSave, existingMuscleGroups }: ExerciseDialogProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setUserId(user?.uid || null));
    return () => unsubscribe();
  }, []);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
        name: '',
        muscleGroup: '',
        newMuscleGroup: '',
        defaultSets: '',
        defaultReps: '',
        defaultRest: '',
        defaultNotes: '',
    }
  });
  
  const newMuscleGroupValue = watch('newMuscleGroup');
  const muscleGroupValue = watch('muscleGroup');

  useEffect(() => {
    if (open) {
      if (exercise) {
        reset({ ...exercise, muscleGroup: exercise.muscleGroup || '', newMuscleGroup: '' });
      } else {
        reset({
          name: '',
          muscleGroup: '',
          newMuscleGroup: '',
          defaultSets: '',
          defaultReps: '',
          defaultRest: '',
          defaultNotes: '',
        });
      }
    }
  }, [exercise, open, reset]);

  const onSubmit = async (data: ExerciseFormData) => {
    if (!userId) {
      toast({ title: "Erro de autenticação", variant: "destructive" });
      return;
    }

    const finalMuscleGroup = data.newMuscleGroup?.trim() || data.muscleGroup;

    if (!finalMuscleGroup) {
        toast({ title: "Grupo Muscular Obrigatório", description: "Selecione um grupo existente ou crie um novo.", variant: "destructive"});
        return;
    }

    const dataToSave = {
      name: data.name,
      muscleGroup: finalMuscleGroup,
      defaultSets: data.defaultSets || '',
      defaultReps: data.defaultReps || '',
      defaultRest: data.defaultRest || '',
      defaultNotes: data.defaultNotes || '',
    };

    try {
      if (exercise?.id) {
        // Update existing exercise
        const exerciseRef = doc(db, 'coaches', userId, 'libraryExercises', exercise.id);
        await updateDoc(exerciseRef, dataToSave);
        toast({ title: "Exercício Atualizado!", description: `${data.name} foi atualizado com sucesso.` });
      } else {
        // Add new exercise
        await addDoc(collection(db, 'coaches', userId, 'libraryExercises'), dataToSave);
        toast({ title: "Exercício Criado!", description: `${data.name} foi adicionado à biblioteca.` });
      }
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o exercício.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{exercise ? 'Editar Exercício' : 'Novo Exercício'}</DialogTitle>
          <DialogDescription>
            {exercise ? 'Altere os detalhes do exercício abaixo.' : 'Adicione um novo exercício à sua biblioteca.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Exercício</Label>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="Ex: Supino Reto" />} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
              <Label htmlFor="muscleGroup">Grupo Muscular</Label>
               <Controller 
                  name="muscleGroup" 
                  control={control} 
                  render={({ field }) => (
                      <Select 
                        onValueChange={(value) => {
                            if (value !== 'create-new') {
                                field.onChange(value);
                                setValue('newMuscleGroup', ''); // Clear new group input
                            } else {
                                field.onChange(''); // Clear selection if 'create new' is chosen
                            }
                        }} 
                        value={field.value || ''}
                        disabled={!!newMuscleGroupValue}
                      >
                          <SelectTrigger id="muscleGroup">
                              <SelectValue placeholder="Selecione um grupo existente..." />
                          </SelectTrigger>
                          <SelectContent>
                              {existingMuscleGroups.map(group => (
                                  <SelectItem key={group} value={group}>{group}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  )} 
              />
              {errors.muscleGroup && !newMuscleGroupValue && <p className="text-sm text-destructive">{errors.muscleGroup.message}</p>}
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="newMuscleGroup">Ou, novo grupo muscular</Label>
              <Controller name="newMuscleGroup" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: Funcional" />} />
          </div>


          <p className="text-sm text-muted-foreground pt-2">Valores Padrão (Opcional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultSets">Séries</Label>
              <Controller name="defaultSets" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: 3" />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultReps">Repetições</Label>
              <Controller name="defaultReps" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: 10-12" />} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultRest">Descanso</Label>
              <Controller name="defaultRest" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: 60s" />} />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="defaultNotes">Observações</Label>
              <Controller name="defaultNotes" control={control} render={({ field }) => <Input {...field} value={field.value ?? ''} placeholder="Ex: Focar na execução lenta" />} />
            </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function ExerciciosPage() {
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<LibraryExercise | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<LibraryExercise | null>(null);

  const refreshData = useCallback(() => {
    // This is a placeholder, as onSnapshot handles real-time updates.
    // Kept for clarity in case of future need for manual refresh.
  }, []);
  
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
  
  useEffect(() => {
    if (!userId) {
      setExercises([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const exercisesCollectionRef = collection(db, 'coaches', userId, 'libraryExercises');
    const q = query(exercisesCollectionRef, orderBy('muscleGroup'), orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LibraryExercise));
      setExercises(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching exercises: ", error);
      toast({ title: "Erro ao Carregar Exercícios", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);


  const handleAddNew = () => {
    setSelectedExercise(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (exercise: LibraryExercise) => {
    setSelectedExercise(exercise);
    setIsDialogOpen(true);
  };

  const confirmDelete = (exercise: LibraryExercise) => {
    setExerciseToDelete(exercise);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userId || !exerciseToDelete) {
      toast({ title: "Erro", description: "Usuário ou exercício inválido.", variant: "destructive" });
      setIsDeleteDialogOpen(false);
      return;
    }
    try {
      await deleteDoc(doc(db, 'coaches', userId, 'libraryExercises', exerciseToDelete.id));
      toast({ title: "Exercício Excluído!" });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({ title: "Erro ao Excluir", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };
  
  const existingMuscleGroups = useMemo(() => {
    const groups = new Set(exercises.map(ex => ex.muscleGroup));
    return Array.from(groups).sort();
  }, [exercises]);

  const groupedExercises = useMemo(() => {
    const filtered = exercises.filter(ex => 
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.reduce((acc, ex) => {
      (acc[ex.muscleGroup] = acc[ex.muscleGroup] || []).push(ex);
      return acc;
    }, {} as Record<string, LibraryExercise[]>);
  }, [exercises, searchTerm]);

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Biblioteca de Exercícios</h1>
            <p className="text-muted-foreground">Gerencie sua lista de exercícios reutilizáveis.</p>
          </div>
          <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" />
            Adicionar Exercício
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Exercícios Cadastrados</CardTitle>
            <CardDescription>Adicione e gerencie os exercícios para montar os treinos dos seus alunos de forma rápida.</CardDescription>
            <div className="relative w-full sm:max-w-sm mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome ou grupo..."
                className="pl-8 w-full bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : Object.keys(groupedExercises).length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {Object.entries(groupedExercises).map(([group, exs]) => (
                  <AccordionItem key={group} value={group}>
                    <AccordionTrigger className="text-lg font-medium">{group} ({exs.length})</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {exs.map(ex => (
                          <div key={ex.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                            <div>
                              <p className="font-semibold">{ex.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {ex.defaultSets && `Séries: ${ex.defaultSets}`}
                                {ex.defaultReps && ` • Reps: ${ex.defaultReps}`}
                                {ex.defaultRest && ` • Desc: ${ex.defaultRest}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ex)}>
                                    <Edit className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(ex)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="mx-auto h-12 w-12 mb-4" />
                <p>Nenhum exercício encontrado.</p>
                <p className="text-sm">Comece adicionando um novo exercício à sua biblioteca.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ExerciseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        exercise={selectedExercise}
        onSave={refreshData}
        existingMuscleGroups={existingMuscleGroups}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o exercício <span className="font-medium text-foreground">"{exerciseToDelete?.name}"</span> da sua biblioteca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExerciseToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
