
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
import { ArrowLeft } from 'lucide-react';

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
        setError("Por favor, preencha seu ID de Aluno.");
        setIsLoading(false);
        return;
    }
    
    // In a real application, this is where you would implement
    // the logic to verify the student ID against your database,
    // likely using a serverless function for security.
    // For now, we'll simulate a successful login and redirect.
    
    toast({
        title: "Login em breve!",
        description: "A funcionalidade de login do aluno está em desenvolvimento. Redirecionando para o painel de demonstração.",
    });

    // Simulate API call
    setTimeout(() => {
        // On success, redirect to the student dashboard
        // The URL would likely be dynamic, e.g., /student/{studentId}
        router.push('/student/dashboard'); // Placeholder redirect
        setIsLoading(false);
    }, 1500);

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
            Insira o seu ID de aluno para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Seu ID de Aluno</Label>
               <Input
                id="studentId"
                placeholder="Seu ID ou código de acesso"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="bg-input"
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
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
