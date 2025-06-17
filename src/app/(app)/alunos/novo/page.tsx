'use client';

import React, { useState } from 'react';
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
import type { Student } from '@/types';
import { useToast } from '@/hooks/use-toast';


const studentSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres.' }),
  phone: z.string().min(10, { message: 'Telefone inválido.' }), // Basic validation
  plan: z.enum(['Mensal', 'Trimestral', 'Avulso'], { required_error: 'Selecione um plano.'}),
  technicalLevel: z.enum(['Iniciante', 'Intermediário', 'Avançado'], { required_error: 'Selecione o nível técnico.'}),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.'}),
});

type StudentFormData = z.infer<typeof studentSchema>;

export default function NovoAlunoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      phone: '',
      plan: undefined, // Set to undefined to show placeholder
      technicalLevel: undefined,
      status: 'active',
    },
  });

  const onSubmit = async (data: StudentFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('New student data:', data);
    
    // In a real app, you would add the student to your data store (e.g., Firebase)
    // For now, we'll just show a success toast and redirect
    toast({
      title: "Aluno Adicionado!",
      description: `${data.name} foi cadastrado com sucesso.`,
      variant: "default", // 'default' is greenish in some themes, or use a custom success variant
    });
    router.push('/alunos'); 
  };

  return (
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

      <Card className="max-w-2xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Informações do Aluno</CardTitle>
            <CardDescription>Insira os detalhes abaixo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" placeholder="Ex: João da Silva" {...field} />}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
               <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input id="phone" type="tel" placeholder="(XX) XXXXX-XXXX" {...field} />}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Controller
                  name="plan"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="plan">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Avulso">Avulso</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.plan && <p className="text-sm text-destructive">{errors.plan.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="technicalLevel">Nível Técnico</Label>
                 <Controller
                  name="technicalLevel"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
