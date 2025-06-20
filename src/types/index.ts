

export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
export const DAYS_OF_WEEK: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export interface Student {
  id: string; // Firestore document ID
  name: string;
  phone: string;
  plan: string; 
  technicalLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  status: 'active' | 'inactive';
  registrationDate: string; // ISO String
  objective?: string | null;
  attendanceHistory?: { date: string; classId: string; bookedClassId: string; status: 'present' | 'absent' | 'rescheduled' | 'pending' }[];
  
  paymentStatus?: 'pago' | 'pendente' | 'vencido' | null;
  dueDate?: string | null; // ISO string or YYYY-MM-DD
  amountDue?: number | null;
  paymentMethod?: 'PIX' | 'Dinheiro' | 'Cartão' | null;
  lastPaymentDate?: string | null; // ISO String

  recurringClassTime?: string | null; // HH:MM
  recurringClassDays?: DayOfWeek[] | null; 
  recurringClassLocation?: string | null; 
}

export interface Plan {
  id: string; // Firestore document ID
  name: string;
  price: number;
  durationDays: number; 
  status: 'active' | 'inactive';
  chargeOnEnrollment: boolean; 
}

export interface ClassSession {
  id: string; // Firestore document ID
  daysOfWeek: DayOfWeek[]; 
  startTime: string; 
  endTime: string;   
  location: string; 
  maxStudents: number;
  enrolledStudentIds: string[]; 
}

export interface BookedClass {
  id: string;
  classSessionId?: string; 
  title: string; 
  date: string; 
  time: string; // This is the start time of the booked class instance
  durationMinutes?: number; 
  location: string; 
  studentIds: string[]; 
  attendance?: Record<string, Student['attendanceHistory'][0]['status']>;
}


export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string; 
  dueDate: string; 
  status: 'pago' | 'pendente' | 'vencido';
  method: 'PIX' | 'Dinheiro' | 'Cartão';
  referenceMonth?: string; 
  receiptUrl?: string;
}

export interface AppSettings {
  coachName: string;
  defaultLocations: string[];
  defaultPlans: { name: string; price: number; durationDays: number }[];
}

export interface TimeRange {
  start: string; 
  end: string;   
}

export interface DailyAvailability {
  workRanges: TimeRange[];
  breaks: TimeRange[];
}

// CoachAvailability: Keys are numeric day of week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
// defaultDaily is a fallback if a specific day isn't defined.
export type CoachAvailability = {
  [dayOfWeek: number]: DailyAvailability; 
  defaultDaily: DailyAvailability; 
};

export interface Location {
  id: string; // Firestore document ID
  name: string;
  status: 'active' | 'inactive';
}

export interface CoachProfileSettings {
  coachName: string;
  coachEmail: string;
  notificationsEnabled: boolean;
  defaultPaymentReminderDays: number;
}


export const getDayOfWeekName = (dayNumber: number): DayOfWeek | undefined => {
  const map: Record<number, DayOfWeek> = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
  };
  return map[dayNumber];
};

