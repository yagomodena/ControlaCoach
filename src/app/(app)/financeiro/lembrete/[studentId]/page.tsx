
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquareDashed, Send, Wand2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generateTuitionReminder, type GenerateTuitionReminderInput } from '@/ai/flows/generate-tuition-reminder';
import { type Student } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { db, auth } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';


const reminderSchema = z.object({
  studentName: z.string(),
  planName: z.string(),
  paymentStatus: z.enum(['paid', 'pending', 'overdue']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (YYYY-MM-DD)"),
  amountDue: z.number().positive("Valor deve ser positivo"),
  paymentMethod: z.string(),
  attendanceHistory: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

export default function GerarLembretePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const studentId = params.studentId as string;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);

  useEffect(() => {
    if (!studentId || !currentUserId) {
        setIsLoadingStudent(false);
        if (!currentUserId) return; // Don't toast if auth is still loading
        toast({ title: "Erro", description: "ID do aluno ou usuário não fornecido.", variant: "destructive" });
        router.push('/financeiro');
        return;
    }
    setIsLoadingStudent(true);
    const fetchStudentData = async () => {
        try {
            const studentDocRef = doc(db, 'coaches', currentUserId, 'students', studentId);
            const studentDocSnap = await getDoc(studentDocRef);

            if (studentDocSnap.exists()) {
                const foundStudent = { ...studentDocSnap.data(), id: studentDocSnap.id } as Student;
                setStudent(foundStudent);
                const defaultValues: Partial<ReminderFormData> = {
                    studentName: foundStudent.name,
                    planName: foundStudent.plan,
                    paymentStatus: foundStudent.paymentStatus === 'pago' ? 'paid' : foundStudent.paymentStatus === 'vencido' ? 'overdue' : 'pending',
                    dueDate: foundStudent.dueDate ? new Date(foundStudent.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    amountDue: foundStudent.amountDue || 0,
                    paymentMethod: foundStudent.paymentMethod || 'PIX',
                    attendanceHistory: foundStudent.attendanceHistory && foundStudent.attendanceHistory.length > 0 
                      ? `Frequentou ${foundStudent.attendanceHistory.filter(a => a.status === 'present').length} de ${foundStudent.attendanceHistory.length} aulas recentes.`
                      : 'Sem histórico de presença recente.',
                };
                 reset(defaultValues as ReminderFormData);
            } else {
                toast({ title: "Erro", description: "Aluno não encontrado.", variant: "destructive" });
                router.push('/financeiro');
            }
        } catch (error) {
            console.error("Error fetching student for reminder: ", error);
            toast({ title: "Erro ao buscar aluno", variant: "destructive" });
            router.push('/financeiro');
        } finally {
            setIsLoadingStudent(false);
        }
    };
    fetchStudentData();
  }, [studentId, currentUserId, reset, router, toast]);

  const onSubmit = async (data: ReminderFormData) => {
    setIsGenerating(true);
    setGeneratedMessage(null);
    try {
      const input: GenerateTuitionReminderInput = {
        ...data,
        amountDue: Number(data.amountDue) 
      };
      const result = await generateTuitionReminder(input);
      setGeneratedMessage(result.reminderMessage);
    } catch (error) {
      console.error("Error generating reminder:", error);
      toast({
        title: "Erro ao Gerar Lembrete",
        description: "Não foi possível gerar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const handleCopyToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
       toast({
        title: "Copiado!",
        description: "Mensagem copiada para a área de transferência.",
      });
    }
  };
  
  const openWhatsApp = () => {
    if (generatedMessage && student?.phone) {
      const whatsappNumber = student.phone.replace(/\D/g, ''); 
      const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(generatedMessage)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível abrir o WhatsApp. Verifique a mensagem e o telefone do aluno.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingStudent || !currentUserId) {
    return (
      <div className="container mx-auto py-8">
         <div className="flex items-center mb-8">
            <Skeleton className="h-10 w-10 mr-4 rounded-md" />
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
                     <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-3" />
                     <p className="text-muted-foreground">Carregando dados do aluno...</p>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href={`/alunos/${studentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Gerar Lembrete de Cobrança</h1>
          <p className="text-muted-foreground">Para {student?.name || 'aluno'}. Use a IA para criar uma mensagem personalizada.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Dados para o Lembrete</CardTitle>
              <CardDescription>Confirme ou edite os dados abaixo antes de gerar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="studentName">Nome do Aluno</Label>
                <Controller name="studentName" control={control} render={({ field }) => <Input id="studentName" {...field} readOnly className="bg-muted/50" />} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="planName">Nome do Plano</Label>
                <Controller name="planName" control={control} render={({ field }) => <Input id="planName" {...field} />} />
                 {errors.planName && <p className="text-sm text-destructive">{errors.planName.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Controller name="dueDate" control={control} render={({ field }) => <Input id="dueDate" type="date" {...field} />} />
                  {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="amountDue">Valor Devido (R$)</Label>
                  <Controller name="amountDue" control={control} render={({ field }) => <Input id="amountDue" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />} />
                  {errors.amountDue && <p className="text-sm text-destructive">{errors.amountDue.message}</p>}
                </div>
              </div>
               <div className="space-y-1">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Controller name="paymentMethod" control={control} render={({ field }) => <Input id="paymentMethod" {...field} />} />
                 {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="attendanceHistory">Resumo da Presença (Opcional)</Label>
                <Controller name="attendanceHistory" control={control} render={({ field }) => <Textarea id="attendanceHistory" placeholder="Ex: Ótima frequência nas últimas semanas!" {...field} value={field.value ?? ''} />} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? 'Gerando Mensagem...' : 'Gerar Mensagem com IA'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Mensagem Gerada</CardTitle>
            <CardDescription>Revise a mensagem antes de enviar.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {isGenerating && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}
            {!isGenerating && generatedMessage && (
              <Textarea value={generatedMessage} readOnly rows={6} className="bg-muted/50 text-foreground p-3 rounded-md shadow-inner" />
            )}
            {!isGenerating && !generatedMessage && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquareDashed className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">A mensagem gerada pela IA aparecerá aqui.</p>
              </div>
            )}
          </CardContent>
           {generatedMessage && !isGenerating && (
            <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
               <Button variant="outline" onClick={handleCopyToClipboard} className="w-full sm:w-auto">
                {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button onClick={openWhatsApp} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white">
                <Send className="mr-2 h-4 w-4" /> Enviar via WhatsApp
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
