
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
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';


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
      // This is an insecure way to "log in" a user and is for demonstration only.
      // In a real application, this should be handled by a proper authentication flow.
      // We query all coaches to find a student with this ID.
      const coachesRef = collection(db, 'coaches');
      const coachesSnapshot = await getDocs(coachesRef);
      let studentFound = false;

      for (const coachDoc of coachesSnapshot.docs) {
        // Since the studentId is the document ID, we can do a direct getDoc
        const studentDocRef = doc(db, 'coaches', coachDoc.id, 'students', studentId);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
            studentFound = true;
            break; // Exit the loop once the student is found
        }
      }

      if (studentFound) {
        // In a real app, you'd create a secure session. Here, we'll use local storage.
        // This is NOT secure for production use.
        localStorage.setItem('studentId', studentId);
        toast({
            title: "Login realizado!",
            description: "Bem-vindo ao seu portal.",
        });
        router.push('/student/dashboard');
      } else {
        setError('ID de Aluno não encontrado.');
      }

    } catch (err: any) {
      console.error('Student Login Error:', err);
      setError('Ocorreu um erro ao verificar o ID. Tente novamente.');
      toast({
        title: 'Erro de Login',
        description: 'Não foi possível verificar o ID. Verifique se ele está correto.',
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
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Acesso do Aluno</CardTitle>
          <CardDescription>
            Insira seu ID de Aluno para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-id" className="flex items-center">
                <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                Seu ID de Aluno
              </Label>
               <Input
                id="student-id"
                type="text"
                placeholder="Insira o ID que seu treinador enviou"
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
