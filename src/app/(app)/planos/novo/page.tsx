
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, ListChecks, BadgeDollarSign, CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { type Plan } from '@/types';
import { db, auth } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PlanForm, type PlanFormData } from '@/components/forms/plan-form';

export default function NovoPlanoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

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

  const onSubmit = async (data: PlanFormData) => {
    if (!userId) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
    }
    try {
      const dataToSave: Omit<Plan, 'id'> = { // Ensure ID is not part of what's saved
        ...data,
        price: data.price ?? 0, 
        durationDays: data.durationDays, 
      };
      await addDoc(collection(db, 'coaches', userId, 'plans'), dataToSave);
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
  
  if (!userId) {
    return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
    );
  }


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
                price: undefined, 
                durationDays: undefined, 
                status: 'active' 
              }} 
              submitButtonText="Salvar Plano"
            />
          </CardContent>
      </Card>
    </div>
  );
}
