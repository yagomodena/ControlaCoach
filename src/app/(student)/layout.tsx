
import { StudentAppLayout } from '@/components/layout/student-app-layout';
import React from 'react';

export default function AuthenticatedStudentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Here you would add authentication checks specific to students.
  // For now, we assume the user is an authenticated student if they reach this layout.
  return <StudentAppLayout>{children}</StudentAppLayout>;
}

    