

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
  id: string;
  name: string;
  price: number;
  durationDays: number; 
  status: 'active' | 'inactive';
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

export type CoachAvailability = {
  [dayOfWeek: number]: DailyAvailability; 
  defaultDaily: DailyAvailability; 
};

export interface Location {
  id: string; // Firestore document ID
  name: string;
  status: 'active' | 'inactive';
}


export let INITIAL_MOCK_BOOKED_CLASSES: BookedClass[] = [
  { 
    id: 'bc2', 
    date: '2024-07-29', 
    time: '19:00', 
    title: 'Futevôlei Intermediário', 
    location: 'Praia Central', 
    studentIds: ['2', '4'], 
    durationMinutes: 60,
    attendance: { '2': 'present', '4': 'pending' }
  },
  { 
    id: 'bc3', 
    date: '2024-07-30', 
    time: '07:00', 
    title: 'Futevôlei Avançado', 
    location: 'Quadra Coberta A', 
    studentIds: ['3'], 
    durationMinutes: 60,
    attendance: { '3': 'absent'}
  },
  { 
    id: 'bc4', 
    date: '2024-08-01', 
    time: '18:30', 
    title: 'Técnica e Tática', 
    location: 'Praia do Tombo', 
    studentIds: ['s28', 's29'], 
    durationMinutes: 90 
  },
];

export const MOCK_COACH_AVAILABILITY: CoachAvailability = {
  1: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Mon
  2: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Tue
  3: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Wed
  4: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Thu
  5: { workRanges: [{ start: '08:00', end: '20:00' }], breaks: [{ start: '12:00', end: '13:30' }] }, // Fri
  6: { workRanges: [{ start: '08:00', end: '14:00' }], breaks: [] }, // Sat
  0: { workRanges: [{ start: '08:00', end: '12:00' }], breaks: [] }, // Sun
  defaultDaily: { workRanges: [], breaks: [] } 
};


export let MOCK_PLANS: Plan[] = [
  { id: 'plan1', name: 'Mensal', price: 150, durationDays: 30, status: 'active' },
  { id: 'plan2', name: 'Trimestral', price: 400, durationDays: 90, status: 'active' },
  { id: 'plan3', name: 'Avulso', price: 50, durationDays: 1, status: 'active' },
  { id: 'plan4', name: 'Anual VIP', price: 1500, durationDays: 365, status: 'active' },
  { id: 'plan5', name: 'Experimental (Inativo)', price: 0, durationDays: 7, status: 'inactive' },
];

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
