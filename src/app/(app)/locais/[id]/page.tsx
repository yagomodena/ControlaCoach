
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit3, Save, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Location } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const locationSchema = z.object({
  name: z.string().min(3, { message: 'Nome do local deve ter pelo menos 3 caracteres.' }),
  status: z.enum(['active', 'inactive'], { required_error: 'Selecione o status.' }),
});

type LocationFormData = z.infer<typeof locationSchema>;

export default function LocalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const locationId = params.id as string;
  
  const [location, setLocation] = useState<Location | null>(null);
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
  });

  useEffect(() => {
    if (!locationId) return;
    setIsLoading(true);
    const fetchLocation = async () => {
      try {
        const locationDocRef = doc(db, 'locations', locationId);
        const locationDocSnap = await getDoc(locationDocRef);

        if (locationDocSnap.exists()) {
          const locationData = { ...locationDocSnap.data(), id: locationDocSnap.id } as Location;
          setLocation(locationData);
          reset(locationData); 
        } else {
          toast({ title: "Erro", description: "Local não encontrado.", variant: "destructive" });
          router.push('/locais');
        }
      } catch (error) {
        console.error("Error fetching location details: ", error);
        toast({ title: "Erro ao Carregar", description: "Não foi possível buscar os dados do local.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocation();
  }, [locationId, reset, router, toast]);

  useEffect(() => {
    setIsEditMode(searchParams.get('edit') === 'true');
  }, [searchParams]);

  const onSubmit = async (data: LocationFormData) => {
    if (!locationId || !location) return;
    try {
      const locationDocRef = doc(db, 'locations', locationId);
      await updateDoc(locationDocRef, data);
      
      const updatedLocation = { ...location, ...data };
      setLocation(updatedLocation);

      toast({
        title: "Local Atualizado!",
        description: `O local "${data.name}" foi atualizado com sucesso.`,
      });
      setIsEditMode(false);
      router.replace(`/locais/${locationId}`); 
    } catch (error) {
        console.error("Error updating location: ", error);
        toast({
            title: "Erro ao Atualizar",
            description: "Não foi possível atualizar os dados do local. Tente novamente.",
            variant: "destructive",
        });
    }
  };

  if (isLoading) {
    return (
        <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados do local...</p>
        </div>
    );
  }

  if (!location) {
    return <div className="container mx-auto py-8 text-center text-destructive">Local não encontrado.</div>;
  }

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) => (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-8">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link href="/locais">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {isEditMode ? 'Editar Local' : 'Detalhes do Local'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? `Modificando dados de "${location.name}"` : `Visualizando dados de "${location.name}"`}
          </p>
        </div>
        {!isEditMode && (
          <Button onClick={() => router.push(`/locais/${locationId}?edit=true`)} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </Button>
        )}
      </div>

      {isEditMode ? (
        <Card className="max-w-xl mx-auto shadow-lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center"><MapPin className="h-5 w-5 mr-2 text-primary"/> Editar Informações do Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Local</Label>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => { setIsEditMode(false); router.replace(`/locais/${locationId}`); reset(location); }}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Card className="shadow-lg max-w-xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline flex items-center"><MapPin className="h-6 w-6 mr-2 text-primary"/>{location.name}</CardTitle>
                  <CardDescription>ID: {location.id}</CardDescription>
                </div>
                 <Badge variant={location.status === 'active' ? 'default' : 'secondary'}
                       className={location.status === 'active' ? 'bg-green-500/20 text-green-700 border-green-500/30 py-1 px-3 text-sm' : 'bg-red-500/20 text-red-700 border-red-500/30 py-1 px-3 text-sm'}
                      >
                        {location.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
            </CardHeader>
            <CardContent className="grid gap-6 pt-6">
                <InfoItem icon={MapPin} label="Nome do Local" value={location.name} />
                <InfoItem 
                    icon={location.status === 'active' ? Edit3 : Edit3} // Placeholder, consider ShieldCheck / ShieldOff
                    label="Status" 
                    value={location.status === 'active' ? 'Ativo' : 'Inativo'} />
            </CardContent>
        </Card>
      )}
    </div>
  );
}
