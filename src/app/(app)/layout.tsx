import { AppLayout } from '@/components/layout/app-layout';
import React from 'react';

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Here you would typically add authentication checks.
  // For now, we assume the user is authenticated if they reach this layout.
  return <AppLayout>{children}</AppLayout>;
}
