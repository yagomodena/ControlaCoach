
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { StudentSidebarNav } from './student-sidebar-nav';
import { Navbar } from './navbar';

interface StudentAppLayoutProps {
  children: React.ReactNode;
}

export function StudentAppLayout({ children }: StudentAppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col">
        <div className="flex flex-1">
          <StudentSidebarNav />
          <SidebarInset className="flex flex-col flex-1">
            <Navbar userType="student" />
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-background">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
