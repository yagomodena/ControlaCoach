
'use client';

import { StudentAppLayout } from '@/components/layout/student-app-layout';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';


export default function AuthenticatedStudentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const studentId = sessionStorage.getItem('fitplanner_student_id');
    if (!studentId) {
      router.replace('/login/aluno');
    } else {
      setIsVerifying(false);
    }
  }, [router]);

  if (isVerifying) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-lg text-muted-foreground">Verificando sessão...</p>
        </div>
    );
  }

  return <StudentAppLayout>{children}</StudentAppLayout>;
}
