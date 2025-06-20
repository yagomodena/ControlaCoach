
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, ListChecks, BadgeDollarSign, CalendarClock, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Plan } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { PlanForm, type PlanFormData } from '@/components/forms/plan-form'; 

export default function PlanoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const planId = params.id as string;
  const [userId, setUserId] = useState<string | null>(null);
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);

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
    if (!planId || !userId) return;
    setIsLoading(true);
    const fetchPlan = async () => {
      try {
        const planDocRef = doc(db, 'coaches', userId, 'plans', planId);
        const planDocSnap = await getDoc(planDocRef);

        if (planDocSnap.exists()) {
          const planData = { ...planDocSnap.data(), id: planDocSnap.id } as Plan;
          setPlan(planData);
        } else {
          toast({ title: "Erro", description: "Plano não encontrado.", variant: "destructive" });
          router.push('/planos');
        }
      } catch (error) {
        console.error("Error fetching plan details: ", error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os dados do plano.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlan();
  }, [planId, userId, router, toast]);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: PlanFormData) => {
    if (!planId || !plan || !userId) {
        toast({ title: "Erro", description: "Informações de usuário ou plano ausentes.", variant: "destructive" });
        return;
    }
    try {
      const planDocRef = doc(db, 'coaches', userId, 'plans', planId);
      const dataToUpdate: Partial<Plan> = {
        name: data.name,
        price: data.price ?? 0,
        durationDays: data.durationDays,
        status: data.status,
        chargeOnEnrollment: data.chargeOnEnrollment,
      };
      await updateDoc(planDocRef, dataToUpdate);
      
      setPlan(prevPlan => prevPlan ? { ...prevPlan, ...dataToUpdate } as Plan : null);

      toast({
        title: "Plano Atualizado!",
        description: `O plano "${data.name}" foi atualizado com sucesso.`,
      });
      setIsEditMode(false);
      router.replace(`/planos/${planId}`); 
    } catch (error) {
        console.error("Error updating plan: ", error);
        toast({
            title: "Erro ao Atualizar",
            description: "Não foi possível atualizar os dados do plano. Tente novamente.",
            variant: "destructive",
        });
    }
  };

  if (isLoading || !userId) {
    return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados do plano...</p>
        </div>
    );
  }

  if (!plan) {
    return <div className="container mx-auto py-8 text-center text-destructive">Plano não encontrado.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value, prefix }: { icon: React.ElementType, label: string, value?: string | number | null | boolean, prefix?: string }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">
          {prefix}
          {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : (value ?? 'N/A')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/planos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {isEditMode ? 'Editar Plano' : 'Detalhes do Plano'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Modificando dados de "${plan.name}"` : `Visualizando dados de "${plan.name}"`}
          </p>
        </div>
        {!isEditMode && (
          <Button onClick={() => router.push(`/planos/${planId}?edit=true`)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {isEditMode ? (
        <Card className="max-w-xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center"><ListChecks className="h-5 w-5 mr-2 text-primary"/> Editar Informações do Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <PlanForm 
                onSubmit={onSubmit} 
                initialData={plan} 
                submitButtonText="Salvar Alterações"
              />
            </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg max-w-xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline flex items-center"><ListChecks className="h-6 w-6 mr-2 text-primary"/>{plan.name}</CardTitle>
                  <CardDescription>ID: {plan.id}</CardDescription>
                </div>
                 <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}
                       className={plan.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30 py-1 px-3 text-sm' : 'bg-red-500/20 text-red-700 border-red-500/30 py-1 px-3 text-sm'}
                      >
                        {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                <InfoItem icon={ListChecks} label="Nome do Plano" value={plan.name} />
                <InfoItem icon={BadgeDollarSign} label="Preço" value={plan.price.toFixed(2)} prefix="R$ " />
                <InfoItem icon={CalendarClock} label="Duração (dias)" value={plan.durationDays} />
                <InfoItem 
                    icon={Info} 
                    label="Cobrar ao Iniciar" 
                    value={plan.chargeOnEnrollment} 
                />
                <InfoItem 
                    icon={plan.status === 'active' ? Edit3 : Edit3} // Consider a different icon for status if needed
                    label="Status" 
                    value={plan.status === 'active' ? 'Ativo' : 'Inativo'} 
                />
            </CardContent>
        </Card>
      )}
    </div>
  );
}
