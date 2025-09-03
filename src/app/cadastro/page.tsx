
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { Eye, EyeOff, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/firebase'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const registrationSchema = z.object({
  fullName: z.string().min(3, { message: 'Nome completo deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres.' }),
  confirmPassword: z.string(),
  cpf: z.string().min(11, { message: 'CPF inválido. Deve ter 11 dígitos.' }).max(14, {message: 'CPF inválido. Máximo de 14 caracteres com formatação.'}),
  paymentMethod: z.enum(['card', 'pix', 'boleto'], { required_error: 'Selecione um meio de pagamento.' }),
  plan: z.string().optional(), // Added plan field
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function CadastroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Essencial');

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      cpf: '',
      paymentMethod: undefined,
      plan: 'Essencial',
    }
  });

  useEffect(() => {
    const planFromUrl = searchParams.get('plan') || 'Essencial';
    setSelectedPlan(planFromUrl);
    setValue('plan', planFromUrl);
  }, [searchParams, setValue]);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Update user profile with full name
      await updateProfile(user, {
        displayName: data.fullName,
      });

      // Store additional user information in Firestore
      // Main user document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: data.fullName,
        email: data.email,
        cpf: data.cpf,
        paymentMethod: data.paymentMethod,
        createdAt: new Date().toISOString(),
        plan: data.plan, // Save the plan
      });

      // Coach specific document
       await setDoc(doc(db, "coaches", user.uid), {
        uid: user.uid,
        name: data.fullName,
        email: data.email,
        plan: data.plan,
        subscriptionStatus: 'trialing',
        studentCount: 0,
      });

      toast({
        title: 'Cadastro Realizado!',
        description: 'Sua conta foi criada com sucesso. Redirecionando para o login...',
      });
      router.push('/login');

    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: 'Erro no Cadastro',
          description: 'Este email já está cadastrado. Tente fazer login ou use um email diferente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro no Cadastro',
          description: error.message || 'Não foi possível criar sua conta. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-6">
            <Logo hideTextOnRegistration={true}/>
          </div>
          <CardTitle className="text-2xl font-headline">Crie sua Conta</CardTitle>
          <CardDescription>
            Plano Selecionado: <span className="font-bold text-primary">{selectedPlan}</span>.
            Comece a gerenciar seus treinos de forma profissional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => <Input id="fullName" placeholder="Seu nome completo" {...field} />}
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input id="email" type="email" placeholder="seu@email.com" {...field} />}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Crie uma senha forte"
                      {...field}
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme sua Senha</Label>
               <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      {...field}
                    />
                  )}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Controller
                name="cpf"
                control={control}
                render={({ field }) => <Input id="cpf" placeholder="000.000.000-00" {...field} />}
              />
              {errors.cpf && <p className="text-sm text-destructive">{errors.cpf.message}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="flex items-center"><CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />Meio de Pagamento Preferido</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Cartão de Crédito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
             {isSubmitting ? 'Criando conta...' : 'Criar Conta e Iniciar Teste'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm">
          <p className="text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Ao criar sua conta, você concorda com nossos{' '}
            <Link href="/termos-de-uso" className="underline hover:text-primary">Termos de Uso</Link> e{' '}
            <Link href="/politica-de-privacidade" className="underline hover:text-primary">Política de Privacidade</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
