
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Palette, Bell, Shield, CalendarClock, Loader2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CoachAvailability, DailyAvailability } from '@/types';

interface DailyScheduleState {
  name: string;
  isWorkDay: boolean;
  workStart: string;
  workEnd:string;
  breakStart: string;
  breakEnd: string;
}

const dayNameToNumeric: Record<string, number> = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6,
};

const numericToDayName = (num: number): string => {
    const names = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return names[num] || 'Dia Desconhecido';
};


const initialWeekScheduleState: DailyScheduleState[] = [
  { name: 'Segunda-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Terça-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Quarta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Quinta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Sexta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Sábado', isWorkDay: true, workStart: '08:00', workEnd: '12:00', breakStart: '', breakEnd: '' },
  { name: 'Domingo', isWorkDay: false, workStart: '08:00', workEnd: '12:00', breakStart: '', breakEnd: '' },
].sort((a, b) => dayNameToNumeric[a.name] - dayNameToNumeric[b.name]); // Ensure sorted by numeric day for consistent display


export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [weekSchedule, setWeekSchedule] = useState<DailyScheduleState[]>(initialWeekScheduleState);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  const mockSettings = { // This can be fetched from Firestore too if needed
    coachName: "ControlaCoach",
    notificationsEnabled: true,
    defaultPaymentReminderDays: 3,
  };

  useEffect(() => {
    setMounted(true);
    setIsLoadingAvailability(true);
    const fetchAvailability = async () => {
      try {
        const availabilityDocRef = doc(db, 'settings', 'coachAvailability');
        const docSnap = await getDoc(availabilityDocRef);
        if (docSnap.exists()) {
          const fetchedData = docSnap.data() as CoachAvailability;
          const newFormSchedule = initialWeekScheduleState.map(dayState => {
            const numericDay = dayNameToNumeric[dayState.name];
            const firestoreDayData = fetchedData[numericDay];
            
            if (firestoreDayData && firestoreDayData.workRanges.length > 0) {
              return {
                name: dayState.name,
                isWorkDay: true,
                workStart: firestoreDayData.workRanges[0]?.start || '08:00',
                workEnd: firestoreDayData.workRanges[0]?.end || '18:00',
                breakStart: firestoreDayData.breaks[0]?.start || '',
                breakEnd: firestoreDayData.breaks[0]?.end || '',
              };
            }
            // If not found in Firestore or no workRanges, default to not a workday for form consistency
            return { ...dayState, isWorkDay: false, workStart: '08:00', workEnd: '18:00', breakStart: '', breakEnd: '' };
          }).sort((a,b) => dayNameToNumeric[a.name] - dayNameToNumeric[b.name]);
          setWeekSchedule(newFormSchedule);
        } else {
          // No settings found, use initial defaults
          setWeekSchedule(initialWeekScheduleState);
        }
      } catch (error) {
        console.error("Error fetching availability settings: ", error);
        toast({ title: "Erro ao carregar disponibilidade", variant: "destructive" });
        setWeekSchedule(initialWeekScheduleState); // Fallback to defaults
      } finally {
        setIsLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [toast]);
  
  const handleScheduleChange = (index: number, field: keyof DailyScheduleState, value: string | boolean) => {
    const newSchedule = [...weekSchedule];
    (newSchedule[index] as any)[field] = value;
    setWeekSchedule(newSchedule);
  };

  const handleSaveAvailability = async () => {
    setIsSaving(true);
    try {
      const availabilityToSave: CoachAvailability = { 
        defaultDaily: { workRanges: [], breaks: [] } // Initialize defaultDaily
      };

      weekSchedule.forEach(dayState => {
        const numericDay = dayNameToNumeric[dayState.name];
        if (dayState.isWorkDay && dayState.workStart && dayState.workEnd) {
          const daily: DailyAvailability = {
            workRanges: [{ start: dayState.workStart, end: dayState.workEnd }],
            breaks: (dayState.breakStart && dayState.breakEnd) ? [{ start: dayState.breakStart, end: dayState.breakEnd }] : [],
          };
          availabilityToSave[numericDay] = daily;
        } else {
          availabilityToSave[numericDay] = { workRanges: [], breaks: [] }; 
        }
      });
      
      // Example: setting defaultDaily from Monday's settings if available
      const mondaySettings = availabilityToSave[1]; // 1 is Monday
      if (mondaySettings) {
        availabilityToSave.defaultDaily = mondaySettings;
      }


      const availabilityDocRef = doc(db, 'settings', 'coachAvailability');
      await setDoc(availabilityDocRef, availabilityToSave);

      toast({
        title: "Disponibilidade Salva!",
        description: "Seus horários foram atualizados com sucesso.",
      });
    } catch (error) {
      console.error("Error saving availability: ", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar sua disponibilidade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (!mounted) {
    return null; 
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Ajuste as preferências do sistema ControlaCoach.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Perfil do Treinador
            </CardTitle>
            <CardDescription>Informações básicas do treinador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="coachName">Nome do Treinador</Label>
              <Input id="coachName" defaultValue={mockSettings.coachName} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coachEmail">Email de Contato</Label>
              <Input id="coachEmail" type="email" defaultValue="coach@bossolan.com" />
            </div>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Salvar Informações
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notificações
            </CardTitle>
            <CardDescription>Preferências de alertas e lembretes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="notificationsEnabled" className="flex flex-col space-y-1">
                <span>Ativar Notificações Gerais</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receber alertas sobre pagamentos, aulas, etc.
                </span>
              </Label>
              <Switch id="notificationsEnabled" defaultChecked={mockSettings.notificationsEnabled} />
            </div>
             <div className="space-y-1">
              <Label htmlFor="reminderDays">Dias para Lembrete de Pagamento</Label>
              <Input id="reminderDays" type="number" defaultValue={mockSettings.defaultPaymentReminderDays} />
              <p className="text-xs text-muted-foreground">Quantos dias antes do vencimento enviar lembrete.</p>
            </div>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Salvar Preferências de Notificação
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Aparência
            </CardTitle>
            <CardDescription>Personalize a interface do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <Label htmlFor="darkMode" className="flex flex-col space-y-1">
                <span>Modo Escuro</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Alternar para o tema escuro.
                </span>
              </Label>
              <Switch 
                id="darkMode" 
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              /> 
            </div>
            <p className="text-sm text-muted-foreground">
              O sistema também respeitará sua preferência de tema do sistema operacional.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Availability Card */}
      <Card className="shadow-lg mt-8 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Disponibilidade Semanal
          </CardTitle>
          <CardDescription>Defina seus horários de trabalho e pausas para cada dia da semana. Estes horários serão refletidos na sua Agenda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAvailability ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Carregando disponibilidade...</p>
            </div>
          ) : (
            weekSchedule.map((day, index) => (
                <React.Fragment key={day.name}>
                {index > 0 && <Separator className="my-6" />}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg text-foreground">{day.name}</h4>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor={`isWorkDay-${index}`} className="text-sm text-muted-foreground">
                        Dia de Trabalho
                        </Label>
                        <Switch
                        id={`isWorkDay-${index}`}
                        checked={day.isWorkDay}
                        onCheckedChange={(checked) => handleScheduleChange(index, 'isWorkDay', checked)}
                        />
                    </div>
                    </div>

                    {day.isWorkDay && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1">
                        <Label htmlFor={`workStart-${index}`} className="text-xs">Horário de Início (Trabalho)</Label>
                        <Input
                            id={`workStart-${index}`}
                            type="time"
                            value={day.workStart}
                            onChange={(e) => handleScheduleChange(index, 'workStart', e.target.value)}
                        />
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor={`workEnd-${index}`} className="text-xs">Horário de Fim (Trabalho)</Label>
                        <Input
                            id={`workEnd-${index}`}
                            type="time"
                            value={day.workEnd}
                            onChange={(e) => handleScheduleChange(index, 'workEnd', e.target.value)}
                        />
                        </div>

                        <div className="space-y-1">
                        <Label htmlFor={`breakStart-${index}`} className="text-xs">Início da Pausa (Opcional)</Label>
                        <Input
                            id={`breakStart-${index}`}
                            type="time"
                            value={day.breakStart}
                            onChange={(e) => handleScheduleChange(index, 'breakStart', e.target.value)}
                        />
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor={`breakEnd-${index}`} className="text-xs">Fim da Pausa (Opcional)</Label>
                        <Input
                            id={`breakEnd-${index}`}
                            type="time"
                            value={day.breakEnd}
                            onChange={(e) => handleScheduleChange(index, 'breakEnd', e.target.value)}
                        />
                        </div>
                    </div>
                    )}
                    {!day.isWorkDay && (
                    <p className="text-sm text-muted-foreground">Dia de descanso.</p>
                    )}
                </div>
                </React.Fragment>
            ))
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAvailability} disabled={isSaving || isLoadingAvailability} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Disponibilidade'}
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
