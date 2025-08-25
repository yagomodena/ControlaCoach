
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
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function AlunoLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
        setError("Por favor, preencha seu email e senha.");
        setIsLoading(false);
        return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On success, redirect to the student dashboard
      router.push('/student/dashboard');
    } catch (err: any) {
      console.error('Student Login Error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos.');
      } else {
        setError('Erro ao fazer login. Tente novamente mais tarde.');
         toast({
          title: 'Erro de Login',
          description: err.message || 'Ocorreu um problema ao tentar fazer login.',
          variant: 'destructive',
        });
      }
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
            Insira seu email e senha para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Seu Email</Label>
               <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Sua Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
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
