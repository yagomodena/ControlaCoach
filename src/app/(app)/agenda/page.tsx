
'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Users, Edit, PlusCircle, Clock, Trash2, Search, UserCircle, Loader2, MapPin, CalendarIcon, Settings, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import Link from 'next/link';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  format, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay, 
  getDay,
  set,
  addMinutes,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isBefore,
  isAfter,
  isEqual,
  parseISO,
  parse,
  formatISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BookedClass, DailyAvailability, Student, Location, DayOfWeek, CoachAvailability, ClassSession } from '@/types';
import { getDayOfWeekName, DAYS_OF_WEEK } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, where, doc, getDoc, addDoc, updateDoc, deleteDoc, arrayUnion, writeBatch, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const generateHourIntervals = (startHour: number, endHour: number, intervalMinutes: number = 60): string[] => {
  const intervals: string[] = [];
  let currentTime = new Date();
  currentTime.setHours(startHour, 0, 0, 0);

  const finalTime = new Date();
  finalTime.setHours(endHour, 0, 0, 0);

  while (currentTime < finalTime) {
    intervals.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, intervalMinutes);
  }
  return intervals;
};

type AttendanceStatus = 'present' | 'absent' | 'pending';

export default function AgendaPage() {
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookedClasses, setBookedClasses] = useState<BookedClass[]>([]);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  const [isStudentSelectionDialogOpen, setIsStudentSelectionDialogOpen] = useState(false);
  const [slotBeingBooked, setSlotBeingBooked] = useState<{ date: Date, time: string, location?: string } | null>(null);
  const [selectedStudentIdsForBooking, setSelectedStudentIdsForBooking] = useState<string[]>([]);
  
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [classBeingEdited, setClassBeingEdited] = useState<BookedClass | null>(null);
  const [editedClassTitle, setEditedClassTitle] = useState('');
  const [editedClassLocation, setEditedClassLocation] = useState('');
  const [editedClassStudentIds, setEditedClassStudentIds] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});


  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeStudentsList, setActiveStudentsList] = useState<Student[]>([]);
  const [activeLocations, setActiveLocations] = useState<Location[]>([]);
  const [coachAvailability, setCoachAvailability] = useState<CoachAvailability | null>(null);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);

  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [isLoadingClassSessions, setIsLoadingClassSessions] = useState(true);
  const [isLoadingBookedClasses, setIsLoadingBookedClasses] = useState(true);
  const [isHandlingRecurringClick, setIsHandlingRecurringClick] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        toast({ title: "Autenticação Necessária", variant: "destructive" });
        // router.push('/login'); // Consider redirecting if not handled by layout
      }
    });
    return () => unsubscribeAuth();
  }, [toast]);


  useEffect(() => {
    if (!userId) return;

    setIsLoadingStudents(true);
    const studentsCollectionRef = collection(db, 'coaches', userId, 'students');
    const qStudents = query(studentsCollectionRef, orderBy('name', 'asc'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Student));
      setAllStudents(studentsData);
      setActiveStudentsList(studentsData.filter(s => s.status === 'active'));
      setIsLoadingStudents(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      toast({ title: "Erro ao Carregar Alunos", variant: "destructive" });
      setIsLoadingStudents(false);
    });

    setIsLoadingLocations(true);
    const locationsCollectionRef = collection(db, 'coaches', userId, 'locations');
    const qLocations = query(locationsCollectionRef, where('status', '==', 'active'), orderBy('name', 'asc'));
    const unsubLocations = onSnapshot(qLocations, (snapshot) => {
      const locationsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Location));
      setActiveLocations(locationsData);
      setIsLoadingLocations(false);
    }, (error) => {
      console.error("Error fetching active locations: ", error);
      toast({ title: "Erro ao Carregar Locais", variant: "destructive" });
      setIsLoadingLocations(false);
    });

    setIsLoadingAvailability(true);
    const fetchCoachAvailability = async () => {
        try {
            const availabilityDocRef = doc(db, 'coaches', userId, 'settings', 'coachAvailability');
            const docSnap = await getDoc(availabilityDocRef);
            if (docSnap.exists()) {
                setCoachAvailability(docSnap.data() as CoachAvailability);
            } else {
                setCoachAvailability({ defaultDaily: { workRanges: [], breaks: [] } }); 
            }
        } catch (error) {
            console.error("Error fetching coach availability: ", error);
            toast({ title: "Erro ao carregar disponibilidade", variant: "destructive" });
        } finally {
            setIsLoadingAvailability(false);
        }
    };
    fetchCoachAvailability();

    setIsLoadingClassSessions(true);
    const classSessionsCollectionRef = collection(db, 'coaches', userId, 'classSessions');
    const qClassSessions = query(classSessionsCollectionRef, orderBy('startTime'));
    const unsubClassSessions = onSnapshot(qClassSessions, (snapshot) => {
        const sessionsData = snapshot.docs.map(sDoc => ({ ...sDoc.data(), id: sDoc.id } as ClassSession));
        setClassSessions(sessionsData);
        setIsLoadingClassSessions(false);
    }, (error) => {
        console.error("Error fetching class sessions:", error);
        toast({title: "Erro ao Carregar Config. de Aulas", variant: "destructive"});
        setIsLoadingClassSessions(false);
    });

    setIsLoadingBookedClasses(true);
    const bookedClassesCollectionRef = collection(db, 'coaches', userId, 'bookedClasses');
    const qBookedClasses = query(bookedClassesCollectionRef, orderBy('date'), orderBy('time'));
    const unsubBookedClasses = onSnapshot(qBookedClasses, (snapshot) => {
      const bookedData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as BookedClass));
      setBookedClasses(bookedData);
      setIsLoadingBookedClasses(false);
    }, (error) => {
      console.error("Error fetching booked classes: ", error);
      toast({ title: "Erro ao Carregar Aulas Agendadas", variant: "destructive" });
      setIsLoadingBookedClasses(false);
    });


    return () => {
        unsubStudents();
        unsubLocations();
        unsubClassSessions();
        unsubBookedClasses();
    };
  }, [userId, toast]);

  const goToNextWeek = () => setCurrentWeekStartDate(addWeeks(currentWeekStartDate, 1));
  const goToPrevWeek = () => setCurrentWeekStartDate(subWeeks(currentWeekStartDate, 1));
  const goToToday = () => setCurrentWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ 
      start: currentWeekStartDate, 
      end: endOfWeek(currentWeekStartDate, { weekStartsOn: 1 }) 
    });
  }, [currentWeekStartDate]);

  const timeIntervals = useMemo(() => generateHourIntervals(6, 23), []); 

  const handleRecurringClassClick = async (day: Date, time: string, student: Student) => {
    if (!userId) return;
    setIsHandlingRecurringClick(true);
    try {
      const dateString = format(day, 'yyyy-MM-dd');
      
      const q = query(
        collection(db, 'coaches', userId, 'bookedClasses'),
        where('date', '==', dateString),
        where('time', '==', time),
        where('studentIds', 'array-contains', student.id)
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // A booked class already exists for this recurring slot, open it for editing
        const existingClass = { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id } as BookedClass;
        openEditClassDialog(existingClass.id);
      } else {
        // No booked class exists, create one on the fly
        const newBookedClassData: Omit<BookedClass, 'id'> = {
          date: dateString,
          time: time,
          title: `Aula Fixa - ${student.name}`,
          location: student.recurringClassLocation || 'A definir',
          studentIds: [student.id],
          durationMinutes: 60,
          attendance: { [student.id]: 'pending' },
          isRecurring: true,
        };
        
        const docRef = await addDoc(collection(db, 'coaches', userId, 'bookedClasses'), newBookedClassData);
        openEditClassDialog(docRef.id);
      }

    } catch (error) {
      console.error("Error handling recurring class click:", error);
      toast({ title: "Erro ao processar aula recorrente.", variant: "destructive" });
    } finally {
      setIsHandlingRecurringClick(false);
    }
  };


  const getSlotContent = (day: Date, time: string) => {
    const currentSlotDateTime = parse(time, 'HH:mm', day);
    currentSlotDateTime.setSeconds(0,0);

    const bookedClass = bookedClasses.find(c => 
        isSameDay(parseISO(c.date), day) && c.time === time
    );
    if (bookedClass) {
      let bgColor = bookedClass.isRecurring ? 'bg-accent/80 hover:bg-accent' : 'bg-primary/80 hover:bg-primary';
      let textColor = bookedClass.isRecurring ? 'text-accent-foreground' : 'text-primary-foreground';
      let textMutedColor = bookedClass.isRecurring ? 'text-accent-foreground/80' : 'text-primary-foreground/80';
      
      const attendanceValues = Object.values(bookedClass.attendance || {});
      const allPresent = attendanceValues.length > 0 && attendanceValues.every(s => s === 'present');
      const anyAbsent = attendanceValues.some(s => s === 'absent');
      
      if (anyAbsent) {
        bgColor = 'bg-red-500/80 hover:bg-red-500';
        textColor = 'text-white';
        textMutedColor = 'text-red-100';
      } else if (allPresent) {
        bgColor = 'bg-green-500/80 hover:bg-green-500';
        textColor = 'text-white';
        textMutedColor = 'text-green-100';
      }

      return (
        <div className={`${bgColor} p-1.5 rounded-md h-full flex flex-col justify-between text-xs cursor-pointer transition-colors`} onClick={() => openEditClassDialog(bookedClass.id)}>
          <div className={textColor}>
            <p className="font-semibold truncate">{bookedClass.title}</p>
            <p className={`truncate ${textMutedColor} flex items-center text-[10px]`}><MapPin className="h-2.5 w-2.5 mr-0.5"/>{bookedClass.location}</p>
          </div>
          <p className={`${textColor} text-[10px] flex items-center`}><Users className="h-2.5 w-2.5 mr-0.5"/>{bookedClass.studentIds.length} aluno(s)</p>
        </div>
      );
    }

    const dayOfWeekName = getDayOfWeekName(getDay(day));
    const recurringStudent = allStudents.find(s => 
        s.status === 'active' &&
        s.recurringClassTime === time &&
        s.recurringClassDays?.includes(dayOfWeekName as DayOfWeek)
    );
    if (recurringStudent) {
      return (
        <div 
          className="bg-accent/70 text-accent-foreground p-1.5 rounded-md h-full flex flex-col justify-between text-xs cursor-pointer hover:bg-accent transition-colors"
          onClick={() => handleRecurringClassClick(day, time, recurringStudent)}
        >
           <div>
            <p className="font-semibold truncate">Rec: {recurringStudent.name}</p>
            <p className="truncate text-accent-foreground/80 flex items-center text-[10px]"><MapPin className="h-2.5 w-2.5 mr-0.5"/>{recurringStudent.recurringClassLocation || 'N/D'}</p>
           </div>
           <p className="text-[10px] flex items-center"><UserCircle className="h-2.5 w-2.5 mr-0.5"/>Aluno Fixo</p>
        </div>
      );
    }
    
    if (!coachAvailability) {
        return <div className="bg-muted/30 h-full rounded-md"></div>; 
    }

    const numericDayOfWeek = getDay(day);
    const dailySchedule: DailyAvailability = coachAvailability[numericDayOfWeek] || coachAvailability.defaultDaily;

    let isCoachWorking = false;
    if (dailySchedule?.workRanges) {
        for (const workRange of dailySchedule.workRanges) {
            if (!workRange.start || !workRange.end) continue;
            const workStartDateTime = parse(workRange.start, 'HH:mm', day);
            const workEndDateTime = parse(workRange.end, 'HH:mm', day);
            if (isAfter(currentSlotDateTime, workStartDateTime) || isEqual(currentSlotDateTime, workStartDateTime)) {
                if (isBefore(addMinutes(currentSlotDateTime, 59), workEndDateTime) || isEqual(addMinutes(currentSlotDateTime, 59), workEndDateTime)) {
                     isCoachWorking = true;
                     break;
                }
            }
        }
    }
    
    let isCoachOnBreak = false;
    if (isCoachWorking && dailySchedule?.breaks) {
        for (const breakRange of dailySchedule.breaks) {
            if (!breakRange.start || !breakRange.end) continue;
            const breakStartDateTime = parse(breakRange.start, 'HH:mm', day);
            const breakEndDateTime = parse(breakRange.end, 'HH:mm', day);
            const slotEndDateTime = addMinutes(currentSlotDateTime, 59);
            if (
              (isAfter(currentSlotDateTime, breakStartDateTime) || isEqual(currentSlotDateTime, breakStartDateTime)) && isBefore(currentSlotDateTime, breakEndDateTime) ||
              (isAfter(slotEndDateTime, breakStartDateTime)) && (isBefore(slotEndDateTime, breakEndDateTime) || isEqual(slotEndDateTime, breakEndDateTime)) ||
              (isBefore(currentSlotDateTime, breakStartDateTime) && isAfter(slotEndDateTime, breakEndDateTime))
            ) {
                isCoachOnBreak = true;
                break;
            }
        }
    }

    if (!isCoachWorking || isCoachOnBreak) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800/50 h-full rounded-md flex items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400 p-1 cursor-not-allowed">
                Indisponível
            </div>
        );
    }

    const configuredSession = classSessions.find(cs => 
      cs.daysOfWeek.includes(dayOfWeekName as DayOfWeek) &&
      time >= cs.startTime && time < cs.endTime 
    );

    if (configuredSession) {
      return (
        <div className="bg-green-500/10 border border-green-500/30 p-1.5 rounded-md h-full flex flex-col justify-center items-center text-xs text-green-700 hover:bg-green-500/20 transition-colors cursor-pointer" onClick={() => openStudentSelectionDialog(day, time, configuredSession.location)}>
            <p className="font-medium text-center truncate">Disponível</p>
            <p className="text-[10px] text-center truncate">({configuredSession.location})</p>
             <PlusCircle className="h-3.5 w-3.5 mt-1 opacity-70"/>
        </div>
      );
    }
    
    return (
      <div className="bg-background hover:bg-muted p-1.5 rounded-md h-full flex justify-center items-center cursor-pointer border border-transparent hover:border-primary/50 transition-colors" onClick={() => openStudentSelectionDialog(day, time)}>
        <PlusCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </div>
    );
  };

  const openStudentSelectionDialog = (date: Date, time: string, defaultLocation?: string) => {
    setSlotBeingBooked({ date, time, location: defaultLocation || activeLocations[0]?.name || 'A definir' });
    setSelectedStudentIdsForBooking([]); 
    setIsStudentSelectionDialogOpen(true);
  };

  const handleStudentSelectionChangeForBooking = (studentId: string, checked: boolean) => {
    setSelectedStudentIdsForBooking(prevSelectedIds => {
      if (checked) {
        return [...prevSelectedIds, studentId];
      } else {
        return prevSelectedIds.filter(id => id !== studentId);
      }
    });
  };

  const handleConfirmBooking = async () => {
    if (!userId || !slotBeingBooked || selectedStudentIdsForBooking.length === 0) {
      toast({
        title: "Erro ao Agendar",
        description: "Informações incompletas ou usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    let classTitle = "Aula em Grupo";
    if (selectedStudentIdsForBooking.length === 1) {
      const student = allStudents.find(s => s.id === selectedStudentIdsForBooking[0]);
      classTitle = student ? `Aula Particular - ${student.name}` : `Aula Agendada`;
    }
    
    const locationForBooking = slotBeingBooked.location || 'A definir';
    
    const initialAttendance = selectedStudentIdsForBooking.reduce((acc, studentId) => {
        acc[studentId] = 'pending';
        return acc;
    }, {} as Record<string, AttendanceStatus>);

    const newBookedClassData: Omit<BookedClass, 'id'> = {
      date: format(slotBeingBooked.date, 'yyyy-MM-dd'),
      time: slotBeingBooked.time,
      title: classTitle, 
      location: locationForBooking,
      studentIds: selectedStudentIdsForBooking,
      durationMinutes: 60,
      attendance: initialAttendance,
      isRecurring: false,
    };

    try {
      await addDoc(collection(db, 'coaches', userId, 'bookedClasses'), newBookedClassData);
      toast({ title: "Aula Agendada!", description: `Aula às ${slotBeingBooked.time} foi agendada em ${locationForBooking}.` });
      setIsStudentSelectionDialogOpen(false);
      setSlotBeingBooked(null);
      setSelectedStudentIdsForBooking([]);
    } catch (error) {
      console.error("Error booking class: ", error);
      toast({ title: "Erro ao Agendar Aula", description: "Não foi possível salvar o agendamento.", variant: "destructive" });
    }
  };

  const openEditClassDialog = (classId: string) => {
    const classToEdit = bookedClasses.find(c => c.id === classId);
    if (classToEdit) {
      setClassBeingEdited(classToEdit);
      setEditedClassTitle(classToEdit.title);
      setEditedClassLocation(classToEdit.location);
      setEditedClassStudentIds([...classToEdit.studentIds]);
      setAttendance(classToEdit.attendance || {});
      setIsEditClassDialogOpen(true);
    }
  };
  
  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleStudentSelectionChangeForEdit = (studentId: string, checked: boolean) => {
    setEditedClassStudentIds(prevSelectedIds => checked ? [...prevSelectedIds, studentId] : prevSelectedIds.filter(id => id !== studentId));
     if (!checked) {
      setAttendance(prev => {
        const newAttendance = { ...prev };
        delete newAttendance[studentId];
        return newAttendance;
      });
    } else {
      setAttendance(prev => ({ ...prev, [studentId]: 'pending' }));
    }
  };

  const handleSaveChangesToClass = async () => {
    if (!userId || !classBeingEdited || editedClassStudentIds.length === 0 || !editedClassTitle || !editedClassLocation) {
      toast({ title: "Erro ao Salvar", description: "Título, local e ao menos um aluno são necessários. Verifique a autenticação.", variant: "destructive" });
      return;
    }

    const batch = writeBatch(db);

    const classDocRef = doc(db, 'coaches', userId, 'bookedClasses', classBeingEdited.id);
    const updatedData = { 
      title: editedClassTitle, 
      location: editedClassLocation, 
      studentIds: editedClassStudentIds,
      attendance: attendance,
    };
    batch.update(classDocRef, updatedData);

    const originalStudentIds = classBeingEdited.studentIds || [];
    const attendanceChanges = Object.keys(attendance).filter(studentId => 
        (classBeingEdited.attendance?.[studentId] || 'pending') !== attendance[studentId]
    );

    attendanceChanges.forEach(studentId => {
        const studentDocRef = doc(db, 'coaches', userId, 'students', studentId);
        const newAttendanceRecord = {
            date: classBeingEdited.date,
            bookedClassId: classBeingEdited.id,
            classId: classBeingEdited.classSessionId || 'avulsa',
            status: attendance[studentId]
        };
        batch.update(studentDocRef, {
            attendanceHistory: arrayUnion(newAttendanceRecord)
        });
    });


    try {
      await batch.commit();
      toast({ title: "Aula Atualizada!", description: `A aula às ${classBeingEdited.time} foi atualizada com sucesso.` });
      setIsEditClassDialogOpen(false);
      setClassBeingEdited(null);
    } catch (error) {
      console.error("Error updating class and attendance: ", error);
      toast({ title: "Erro ao Atualizar Aula", variant: "destructive" });
    }
  };

  const handleDeleteClass = async () => {
    if (!userId || !classBeingEdited) return;
    if (window.confirm(`Tem certeza que deseja excluir a aula "${classBeingEdited.title}"?`)) {
        try {
            await deleteDoc(doc(db, 'coaches', userId, 'bookedClasses', classBeingEdited.id));
            toast({ title: "Aula Excluída!", description: `A aula "${classBeingEdited.title}" foi excluída.` });
            setIsEditClassDialogOpen(false);
            setClassBeingEdited(null);
        } catch (error) {
            console.error("Error deleting class: ", error);
            toast({ title: "Erro ao Excluir Aula", variant: "destructive" });
        }
    }
  };

  const isLoading = isLoadingStudents || isLoadingLocations || isLoadingAvailability || isLoadingClassSessions || isLoadingBookedClasses || !userId || isHandlingRecurringClick;
  
  const getAttendanceButtonVariant = (currentStatus: AttendanceStatus, buttonStatus: AttendanceStatus): 'default' | 'destructive' | 'secondary' | 'outline' => {
     if (currentStatus === buttonStatus) {
        if(buttonStatus === 'present') return 'default';
        if(buttonStatus === 'absent') return 'destructive';
        if(buttonStatus === 'pending') return 'secondary';
     }
     return 'outline';
  }

  return (
    <TooltipProvider>
    <div className="container mx-auto py-8">
      {isHandlingRecurringClick && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-lg text-foreground">Processando aula recorrente...</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Agenda Semanal</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie sua semana. Semana de {format(currentWeekStartDate, 'dd/MM', {locale: ptBR})} a {format(endOfWeek(currentWeekStartDate, {weekStartsOn: 1}), 'dd/MM/yyyy', {locale: ptBR})}.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToToday} className="hidden sm:flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2"/> Hoje
            </Button>
          <Button variant="outline" size="icon" onClick={goToPrevWeek} aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Próxima semana">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && !isHandlingRecurringClick ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-xl text-muted-foreground">Carregando dados da agenda...</p>
        </div>
      ) : !coachAvailability || (coachAvailability.defaultDaily.workRanges.length === 0 && Object.values(coachAvailability).every(d => d === null || d === undefined || (d as DailyAvailability).workRanges?.length === 0)) ? (
         <Card className="mt-8 text-center py-12">
            <CardHeader>
                <CardTitle className="text-2xl">Disponibilidade Não Configurada</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    Parece que você ainda não configurou seus horários de trabalho.
                </p>
                <Button asChild>
                    <Link href="/configuracoes">
                        <Settings className="mr-2 h-4 w-4"/> Configurar Disponibilidade
                    </Link>
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto bg-card p-1 rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-border border border-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground w-20 sticky left-0 bg-muted/80 z-10">Hora</th>
                {weekDays.map(day => (
                  <th key={day.toISOString()} className="px-3 py-3.5 text-center text-sm font-semibold text-foreground min-w-[130px]">
                    {format(day, 'EEE', { locale: ptBR })} <br/>
                    <span className="font-normal text-xs text-muted-foreground">{format(day, 'dd/MM', { locale: ptBR })}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {timeIntervals.map(time => (
                <tr key={time} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-muted-foreground sticky left-0 bg-background/80 z-10 border-r border-border">{time}</td>
                  {weekDays.map(day => (
                    <td key={day.toISOString() + time} className="px-1 py-1 whitespace-nowrap text-sm text-foreground h-20 min-h-[5rem] border-l border-border group">
                       <div className="h-full w-full">
                         {getSlotContent(day, time)}
                       </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isStudentSelectionDialogOpen} onOpenChange={setIsStudentSelectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Aula para {slotBeingBooked?.time}</DialogTitle>
            <DialogDescription>
              Selecione o(s) aluno(s) para o horário de {slotBeingBooked?.time} em {slotBeingBooked ? format(slotBeingBooked.date, 'dd/MM/yyyy', { locale: ptBR }) : ''} no local "{slotBeingBooked?.location || 'A definir'}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Alunos Ativos</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {isLoadingStudents ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activeStudentsList.length > 0 ? (
                activeStudentsList.map(student => (
                  <div key={student.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`book-student-${student.id}`}
                      checked={selectedStudentIdsForBooking.includes(student.id)}
                      onCheckedChange={(checked) => handleStudentSelectionChangeForBooking(student.id, !!checked)}
                    />
                    <Label htmlFor={`book-student-${student.id}`} className="font-normal">
                      {student.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum aluno ativo encontrado.</p>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleConfirmBooking} disabled={selectedStudentIdsForBooking.length === 0 || isLoadingStudents}>
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditClassDialogOpen} onOpenChange={setIsEditClassDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Aula - {classBeingEdited?.time}</DialogTitle>
            <DialogDescription>
              Edite os detalhes e controle a presença para a aula de {classBeingEdited?.time} em {classBeingEdited ? format(parseISO(classBeingEdited.date), 'dd/MM/yyyy', { locale: ptBR }) : ''}.
            </DialogDescription>
          </DialogHeader>
          {classBeingEdited && (
            <ScrollArea className="max-h-[70vh] pr-6">
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="editClassTitle" className="mb-1 block">Título da Aula</Label>
                <Input 
                  id="editClassTitle" 
                  value={editedClassTitle} 
                  onChange={(e) => setEditedClassTitle(e.target.value)} 
                  placeholder="Ex: Aula Particular - João"
                />
              </div>
              <div>
                <Label htmlFor="editClassLocation" className="mb-1 block flex items-center"><MapPin className="h-4 w-4 mr-1"/>Local da Aula</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={editedClassLocation}
                    onValueChange={setEditedClassLocation}
                    disabled={isLoadingLocations}
                  >
                    <SelectTrigger id="editClassLocation" className="flex-grow">
                      <SelectValue placeholder={isLoadingLocations ? "Carregando..." : "Selecione o local"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A definir">A definir</SelectItem>
                      {activeLocations.map(loc => (
                        <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" asChild>
                    <Link href="/locais/novo" target="_blank" rel="noopener noreferrer">
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Adicionar Novo Local</span>
                    </Link>
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-medium mb-2 block">Controle de Presença</Label>
                <div className="space-y-3">
                  {isLoadingStudents ? (
                    <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : editedClassStudentIds.length > 0 ? (
                     editedClassStudentIds.map(studentId => {
                      const student = allStudents.find(s => s.id === studentId);
                      if (!student) return null;
                      const currentStatus = attendance[studentId] || 'pending';
                      return (
                        <div key={studentId} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                            <Label htmlFor={`edit-student-${student.id}`} className="font-normal">
                              {student.name}
                            </Label>
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="sm" 
                                            variant={getAttendanceButtonVariant(currentStatus, 'present')}
                                            onClick={() => handleAttendanceChange(studentId, 'present')} 
                                            className={cn("h-8 px-2", 
                                                currentStatus === 'present' 
                                                ? "bg-green-500 hover:bg-green-600 text-white"
                                                : "hover:bg-green-500/90 hover:text-white"
                                            )}
                                        >
                                            <CheckCircle className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Marcar Presença</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                         <Button 
                                            size="sm" 
                                            variant={getAttendanceButtonVariant(currentStatus, 'absent')}
                                            onClick={() => handleAttendanceChange(studentId, 'absent')} 
                                            className={cn("h-8 px-2", 
                                                currentStatus !== 'absent' && "hover:bg-red-600 hover:text-white"
                                            )}
                                        >
                                            <XCircle className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Marcar Falta</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            size="sm" 
                                            variant={getAttendanceButtonVariant(currentStatus, 'pending')}
                                            onClick={() => handleAttendanceChange(studentId, 'pending')} 
                                            className="h-8 px-2"
                                        >
                                            <HelpCircle className="h-4 w-4"/>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Marcar como Pendente</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                      )
                     })
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">Nenhum aluno inscrito nesta aula.</p>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-base font-medium mb-2 block">Editar Alunos Inscritos</Label>
                <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                 {isLoadingStudents ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : activeStudentsList.length > 0 ? (
                    activeStudentsList.map(student => (
                      <div key={student.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`edit-student-${student.id}`}
                          checked={editedClassStudentIds.includes(student.id)}
                          onCheckedChange={(checked) => handleStudentSelectionChangeForEdit(student.id, !!checked)}
                        />
                        <Label htmlFor={`edit-student-${student.id}`} className="font-normal">
                          {student.name}
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum aluno ativo encontrado.</p>
                  )}
                </ScrollArea>
              </div>
            </div>
            </ScrollArea>
          )}
          <DialogFooter className="sm:justify-between pt-4 border-t">
            <Button type="button" variant="destructive" onClick={handleDeleteClass} className="sm:mr-auto">
              <Trash2 className="mr-2 h-4 w-4" /> Excluir Aula
            </Button>
            <div className="flex gap-2 mt-2 sm:mt-0">
                <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleSaveChangesToClass} disabled={editedClassStudentIds.length === 0 || !editedClassTitle || !editedClassLocation || isLoadingStudents || isLoadingLocations}>
                Salvar Alterações
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </TooltipProvider>
  );
}

