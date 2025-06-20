
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ListChecks, BadgeDollarSign, CalendarClock } from 'lucide-react';
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
import { type Plan } from '@/types';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PlanForm, type PlanFormData, planSchema } from '@/components/forms/plan-form'; // Import PlanForm and its schema

export default function NovoPlanoPage() {
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data: PlanFormData) => {
    try {
      const dataToSave: Plan = {
        ...data,
        price: data.price ?? 0, // Coerce to 0 if undefined for saving
      };
      await addDoc(collection(db, 'plans'), dataToSave);
      toast({
        title: "Plano Adicionado!",
        description: `O plano "${data.name}" foi cadastrado com sucesso.`,
      });
      router.push('/planos'); 
    } catch (error) {
        console.error("Error adding plan: ", error);
        toast({
            title: "Erro ao Adicionar Plano",
            description: "Não foi possível cadastrar o plano. Tente novamente.",
            variant: "destructive",
        });
    }
  };

  return (
    <div className="container mx-auto py-8">
       <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/planos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Adicionar Novo Plano</h1>
          <p className="text-muted-foreground">Preencha os dados do novo plano.</p>
        </div>
      </div>

      <Card className="max-w-xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary"/> Informações do Plano</CardTitle>
            <CardDescription>Insira os detalhes abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanForm 
              onSubmit={onSubmit} 
              initialData={{ 
                name: '', 
                price: undefined, // Set initial price to undefined for empty field
                durationDays: 30, 
                status: 'active' 
              }} 
              submitButtonText="Salvar Plano"
            />
          </CardContent>
          {/* CardFooter is removed as the submit button is now part of PlanForm */}
      </Card>
    </div>
  );
}
