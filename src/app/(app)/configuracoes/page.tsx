
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
import { db, auth } from '@/firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth'; 
import type { CoachAvailability, DailyAvailability, CoachProfileSettings } from '@/types';
import { useRouter } from 'next/navigation';

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

const initialWeekScheduleState: DailyScheduleState[] = [
  { name: 'Segunda-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Terça-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Quarta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Quinta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Sexta-feira', isWorkDay: true, workStart: '08:00', workEnd: '18:00', breakStart: '12:00', breakEnd: '13:30' },
  { name: 'Sábado', isWorkDay: true, workStart: '08:00', workEnd: '12:00', breakStart: '', breakEnd: '' },
  { name: 'Domingo', isWorkDay: false, workStart: '08:00', workEnd: '12:00', breakStart: '', breakEnd: '' },
].sort((a, b) => dayNameToNumeric[a.name] - dayNameToNumeric[b.name]); 


export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultPaymentReminderDays, setDefaultPaymentReminderDays] = useState(3);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true); 
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [weekSchedule, setWeekSchedule] = useState<DailyScheduleState[]>(initialWeekScheduleState);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
      if (currentUser) {
        setUserId(currentUser.uid);
        setCoachName(currentUser.displayName || 'ControlaCoach User');
        setCoachEmail(currentUser.email || 'seuemail@example.com');
      } else {
        setUserId(null);
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);
  
  useEffect(() => {
    if (!userId) return;

    setIsLoadingProfile(true);
    setIsLoadingNotifications(true);
    setIsLoadingAvailability(true);

    const fetchAllSettings = async () => {
      const currentUser = auth.currentUser; // Re-check current user within async context

      try {
        // Fetch Profile & Notification Settings from Firestore for the current user
        const profileSettingsDocRef = doc(db, 'coaches', userId, 'settings', 'profileAndNotifications');
        const profileDocSnap = await getDoc(profileSettingsDocRef);
        const firestoreData = profileDocSnap.exists() ? profileDocSnap.data() as CoachProfileSettings : null;

        // Prioritize Firebase Auth for name and email, then Firestore, then defaults
        setCoachName(currentUser?.displayName || firestoreData?.coachName || 'ControlaCoach User');
        setCoachEmail(currentUser?.email || firestoreData?.coachEmail || 'seuemail@example.com');
        
        if (firestoreData) {
            setNotificationsEnabled(firestoreData.notificationsEnabled === undefined ? true : firestoreData.notificationsEnabled);
            setDefaultPaymentReminderDays(firestoreData.defaultPaymentReminderDays || 3);
        } else {
            setNotificationsEnabled(true);
            setDefaultPaymentReminderDays(3);
        }

      } catch (error) {
        console.error("Error fetching profile/notification settings: ", error);
        toast({ title: "Erro ao carregar perfil/notificações", variant: "destructive" });
        if (currentUser) {
            setCoachName(currentUser.displayName || 'ControlaCoach User');
            setCoachEmail(currentUser.email || 'seuemail@example.com');
        } else {
            setCoachName('ControlaCoach User');
            setCoachEmail('seuemail@example.com');
        }
        setNotificationsEnabled(true);
        setDefaultPaymentReminderDays(3);
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingNotifications(false);
      }

      try {
        const availabilityDocRef = doc(db, 'coaches', userId, 'settings', 'coachAvailability');
        const availabilityDocSnap = await getDoc(availabilityDocRef);
        if (availabilityDocSnap.exists()) {
          const fetchedData = availabilityDocSnap.data() as CoachAvailability;
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
            return { ...dayState, isWorkDay: false, workStart: '08:00', workEnd: '18:00', breakStart: '', breakEnd: '' };
          }).sort((a,b) => dayNameToNumeric[a.name] - dayNameToNumeric[b.name]);
          setWeekSchedule(newFormSchedule);
        } else {
          setWeekSchedule(initialWeekScheduleState);
        }
      } catch (error) {
        console.error("Error fetching availability settings: ", error);
        toast({ title: "Erro ao carregar disponibilidade", variant: "destructive" });
        setWeekSchedule(initialWeekScheduleState); 
      } finally {
        setIsLoadingAvailability(false);
      }
    };
    
    fetchAllSettings();

  }, [userId, toast]);
  
  const handleScheduleChange = (index: number, field: keyof DailyScheduleState, value: string | boolean) => {
    const newSchedule = [...weekSchedule];
    (newSchedule[index] as any)[field] = value;
    setWeekSchedule(newSchedule);
  };

  const handleSaveProfileInfo = async () => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSavingProfile(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast({ title: "Erro", description: "Sessão de usuário inválida.", variant: "destructive" });
      setIsSavingProfile(false);
      return;
    }

    try {
      if (currentUser.displayName !== coachName) {
        await updateProfile(currentUser, { displayName: coachName });
      }

      const settingsDocRef = doc(db, 'coaches', userId, 'settings', 'profileAndNotifications');
      const docSnap = await getDoc(settingsDocRef);
      const existingData = docSnap.exists() ? docSnap.data() as Partial<CoachProfileSettings> : {};
      
      const dataToSave: CoachProfileSettings = {
        ...existingData,
        coachName: coachName,
        coachEmail: currentUser.email || existingData.coachEmail || '', 
        notificationsEnabled: existingData.notificationsEnabled === undefined ? true : existingData.notificationsEnabled,
        defaultPaymentReminderDays: existingData.defaultPaymentReminderDays || 3,
      };
      await setDoc(settingsDocRef, dataToSave, { merge: true }); 

      toast({ title: "Perfil Salvo!", description: "Suas informações de perfil foram atualizadas." });
    } catch (error) {
      console.error("Error saving profile info:", error);
      toast({ title: "Erro ao Salvar Perfil", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSavingNotifications(true);
    const currentUser = auth.currentUser; 
    try {
      const settingsDocRef = doc(db, 'coaches', userId, 'settings', 'profileAndNotifications');
      const docSnap = await getDoc(settingsDocRef);
      const existingData = docSnap.exists() ? docSnap.data() as Partial<CoachProfileSettings> : {};

      const dataToSave: CoachProfileSettings = {
        coachName: currentUser?.displayName || existingData.coachName || 'ControlaCoach User',
        coachEmail: currentUser?.email || existingData.coachEmail || 'seuemail@example.com',
        notificationsEnabled: notificationsEnabled,
        defaultPaymentReminderDays: Number(defaultPaymentReminderDays),
      };
      await setDoc(settingsDocRef, dataToSave, { merge: true });
      toast({ title: "Notificações Salvas!", description: "Suas preferências de notificação foram atualizadas." });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({ title: "Erro ao Salvar Notificações", variant: "destructive" });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveAvailability = async () => {
    if (!userId) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSavingAvailability(true);
    try {
      const availabilityToSave: CoachAvailability = { 
        defaultDaily: { workRanges: [], breaks: [] } 
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
      
      const mondaySettings = availabilityToSave[1]; 
      if (mondaySettings) {
        availabilityToSave.defaultDaily = mondaySettings;
      }

      const availabilityDocRef = doc(db, 'coaches', userId, 'settings', 'coachAvailability');
      await setDoc(availabilityDocRef, availabilityToSave);
      toast({ title: "Disponibilidade Salva!", description: "Seus horários foram atualizados." });
    } catch (error) {
      console.error("Error saving availability: ", error);
      toast({ title: "Erro ao Salvar Disponibilidade", variant: "destructive" });
    } finally {
      setIsSavingAvailability(false);
    }
  };

  if (!mounted || !userId) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-lg text-foreground">Carregando...</p>
        </div>
    ); 
  }

  const isLoadingAny = isLoadingProfile || isLoadingNotifications || isLoadingAvailability;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Ajuste as preferências do sistema ControlaCoach.</p>
      </div>
      
      {isLoadingAny && !isSavingProfile && !isSavingNotifications && !isSavingAvailability && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-lg text-foreground">Carregando configurações...</p>
        </div>
      )}

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
              <Input 
                id="coachName" 
                value={coachName} 
                onChange={(e) => setCoachName(e.target.value)} 
                disabled={isSavingProfile || isLoadingProfile} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="coachEmail">Email de Contato</Label>
              <Input 
                id="coachEmail" 
                type="email" 
                value={coachEmail} 
                readOnly 
                disabled 
                className="bg-muted/50 cursor-not-allowed" 
              />
            </div>
            <Button onClick={handleSaveProfileInfo} className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSavingProfile || isLoadingProfile}>
              {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> {isSavingProfile ? 'Salvando...' : 'Salvar Informações'}
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
              <Label htmlFor="notificationsEnabledSwitch" className="flex flex-col space-y-1">
                <span>Ativar Notificações Gerais</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receber alertas sobre pagamentos, aulas, etc.
                </span>
              </Label>
              <Switch 
                id="notificationsEnabledSwitch" 
                checked={notificationsEnabled} 
                onCheckedChange={setNotificationsEnabled}
                disabled={isSavingNotifications || isLoadingNotifications}
              />
            </div>
             <div className="space-y-1">
              <Label htmlFor="reminderDays">Dias para Lembrete de Pagamento</Label>
              <Input 
                id="reminderDays" 
                type="number" 
                value={defaultPaymentReminderDays} 
                onChange={(e) => setDefaultPaymentReminderDays(Number(e.target.value))} 
                disabled={isSavingNotifications || isLoadingNotifications}
              />
              <p className="text-xs text-muted-foreground">Quantos dias antes do vencimento enviar lembrete.</p>
            </div>
            <Button onClick={handleSaveNotificationSettings} className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSavingNotifications || isLoadingNotifications}>
              {isSavingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> {isSavingNotifications ? 'Salvando...' : 'Salvar Preferências'}
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
                        disabled={isSavingAvailability}
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
                            disabled={isSavingAvailability}
                        />
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor={`workEnd-${index}`} className="text-xs">Horário de Fim (Trabalho)</Label>
                        <Input
                            id={`workEnd-${index}`}
                            type="time"
                            value={day.workEnd}
                            onChange={(e) => handleScheduleChange(index, 'workEnd', e.target.value)}
                            disabled={isSavingAvailability}
                        />
                        </div>

                        <div className="space-y-1">
                        <Label htmlFor={`breakStart-${index}`} className="text-xs">Início da Pausa (Opcional)</Label>
                        <Input
                            id={`breakStart-${index}`}
                            type="time"
                            value={day.breakStart}
                            onChange={(e) => handleScheduleChange(index, 'breakStart', e.target.value)}
                            disabled={isSavingAvailability}
                        />
                        </div>
                        <div className="space-y-1">
                        <Label htmlFor={`breakEnd-${index}`} className="text-xs">Fim da Pausa (Opcional)</Label>
                        <Input
                            id={`breakEnd-${index}`}
                            type="time"
                            value={day.breakEnd}
                            onChange={(e) => handleScheduleChange(index, 'breakEnd', e.target.value)}
                            disabled={isSavingAvailability}
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
          <Button onClick={handleSaveAvailability} disabled={isSavingAvailability || isLoadingAvailability} className="ml-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSavingAvailability && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> {isSavingAvailability ? 'Salvando...' : 'Salvar Disponibilidade'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
