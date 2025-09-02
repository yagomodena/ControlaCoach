
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, KeyRound, Loader2, User } from 'lucide-react';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Student } from '@/types';

export default function AlunoLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!studentId.trim()) {
        setError("Por favor, insira seu ID de aluno.");
        setIsLoading(false);
        return;
    }
    
    try {
      const studentDocRef = doc(db, 'students', studentId.trim());
      const studentDocSnap = await getDoc(studentDocRef);

      if (studentDocSnap.exists()) {
         const studentData = studentDocSnap.data() as Student;
         
         if (studentData.status === 'inactive') {
            setError('Sua conta está inativa. Por favor, entre em contato com seu treinador para reativá-la.');
            toast({
                title: 'Acesso Negado',
                description: 'Sua conta está inativa.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
         }

         sessionStorage.setItem('fitplanner_student_id', studentDocSnap.id);

         toast({
             title: "Login realizado!",
             description: "Bem-vindo ao seu portal.",
         });
         router.push('/student/dashboard');
      } else {
         setError('ID de Aluno não encontrado.');
         toast({
            title: 'Erro de Login',
            description: 'Verifique seu ID e tente novamente.',
            variant: 'destructive',
         });
      }

    } catch (err: any) {
      console.error('Student Login Error:', err);
      setError('Erro ao fazer login. Tente novamente.');
      toast({
        title: 'Erro de Login',
        description: 'Ocorreu um problema ao verificar seu ID.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-6">
            <Logo collapsed={true} />
          </div>
          <CardTitle className="text-2xl font-headline">Acesso do Aluno</CardTitle>
          <CardDescription>
            Insira seu ID para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">ID do Aluno</Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Seu ID de aluno"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="bg-input"
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              {isLoading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
           <Button variant="link" asChild className="text-muted-foreground">
             <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login do Treinador
             </Link>
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
