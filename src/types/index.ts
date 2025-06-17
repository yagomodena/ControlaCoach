export interface Student {
  id: string;
  name: string;
  phone: string;
  plan: 'Mensal' | 'Trimestral' | 'Avulso';
  technicalLevel: 'Iniciante' | 'Intermediário' | 'Avançado';
  status: 'active' | 'inactive';
  registrationDate: string; // ISO date string
  objective?: string; // Added objective field
  attendanceHistory?: { date: string; classId: string; status: 'present' | 'absent' | 'rescheduled' }[];
  
  // Financial fields - can be part of a separate Payment type if needed
  paymentStatus?: 'pago' | 'pendente' | 'vencido';
  dueDate?: string; // ISO date string
  amountDue?: number;
  paymentMethod?: 'PIX' | 'Dinheiro' | 'Cartão';
  lastPaymentDate?: string; // ISO date string
}

export interface ClassSession {
  id: string;
  dayOfWeek: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
  time: string; // e.g., "18:00"
  location: string; // e.g., "Praia Central", "Quadra A"
  maxStudents: number;
  enrolledStudentIds: string[];
}

export interface ScheduledClass {
  id: string;
  classSessionId: string; // links to ClassSession
  date: string; // ISO date string for a specific occurrence
  attendedStudentIds: string[];
  absentStudentIds: string[];
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string; // ISO date string
  dueDate: string; // ISO date string
  status: 'pago' | 'pendente' | 'vencido';
  method: 'PIX' | 'Dinheiro' | 'Cartão';
  referenceMonth?: string; // e.g., "2024-07"
  receiptUrl?: string;
}

export interface AppSettings {
  coachName: string;
  defaultLocations: string[];
  defaultPlans: { name: string; price: number; durationDays: number }[];
}

// Mock data for students
export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'Ana Silva',
    phone: '(11) 98765-4321',
    plan: 'Mensal',
    technicalLevel: 'Iniciante',
    status: 'active',
    registrationDate: '2023-01-15',
    objective: 'Melhorar o condicionamento físico e aprender os fundamentos do futevôlei.',
    paymentStatus: 'pago',
    dueDate: '2024-08-05',
    amountDue: 150,
    paymentMethod: 'PIX',
    attendanceHistory: [
      { date: '2024-07-01', classId: 'c1', status: 'present' },
      { date: '2024-07-03', classId: 'c1', status: 'present' },
    ],
    lastPaymentDate: '2024-07-05',
  },
  {
    id: '2',
    name: 'Bruno Costa',
    phone: '(21) 91234-5678',
    plan: 'Trimestral',
    technicalLevel: 'Intermediário',
    status: 'active',
    registrationDate: '2022-11-20',
    objective: 'Aprimorar técnicas de ataque e defesa, participar de torneios amadores.',
    paymentStatus: 'pendente',
    dueDate: '2024-07-20',
    amountDue: 400,
    paymentMethod: 'Cartão',
    attendanceHistory: [
      { date: '2024-07-02', classId: 'c2', status: 'present' },
      { date: '2024-07-04', classId: 'c2', status: 'absent' },
    ],
  },
  {
    id: '3',
    name: 'Carlos Dias',
    phone: '(31) 99999-8888',
    plan: 'Mensal',
    technicalLevel: 'Avançado',
    status: 'inactive',
    registrationDate: '2023-05-10',
    objective: 'Manter a forma física e jogar em alto nível.',
    paymentStatus: 'vencido',
    dueDate: '2024-06-10',
    amountDue: 150,
    paymentMethod: 'Dinheiro',
    attendanceHistory: [],
  },
   {
    id: '4',
    name: 'Daniela Rocha',
    phone: '(41) 98888-7777',
    plan: 'Mensal',
    technicalLevel: 'Intermediário',
    status: 'active',
    registrationDate: '2023-08-01',
    objective: 'Aprender o saque tubarão e melhorar o posicionamento em quadra.',
    paymentStatus: 'pago',
    dueDate: '2024-08-10',
    amountDue: 150,
    paymentMethod: 'PIX',
    attendanceHistory: [
        { date: '2024-07-01', classId: 'c1', status: 'present' },
        { date: '2024-07-08', classId: 'c1', status: 'present' },
    ],
    lastPaymentDate: '2024-07-10',
  },
  {
    id: '5',
    name: 'Eduardo Lima',
    phone: '(51) 97777-6666',
    plan: 'Avulso',
    technicalLevel: 'Iniciante',
    status: 'active',
    registrationDate: '2024-06-15',
    objective: 'Experimentar o futevôlei e decidir se matricula em plano fixo.',
    paymentStatus: 'pendente',
    dueDate: '2024-07-25',
    amountDue: 50,
    paymentMethod: 'PIX',
    attendanceHistory: [
        { date: '2024-07-15', classId: 'c3', status: 'present' },
    ],
  }
];
