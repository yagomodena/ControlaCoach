
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  BookOpenCheck,
  CalendarDays,
  DollarSign,
  Settings,
  LogOut,
  MapPin, 
  ListChecks, // Added ListChecks for Planos
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import React from 'react';

const navItems = [
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/aulas', label: 'Aulas', icon: BookOpenCheck },
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/locais', label: 'Locais', icon: MapPin },
  { href: '/planos', label: 'Planos', icon: ListChecks }, // Added Planos
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


  const isCollapsed = sidebarState === 'collapsed';

  const handleLogout = () => {
    // Placeholder for logout logic
    // For now, redirect to login
    window.location.href = '/login';
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Logo collapsed={isCollapsed} />
      </SidebarHeader>
      <Separator className="mb-2" />
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mounted ? navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label, className: 'bg-primary text-primary-foreground' }}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-5 w-5 flex-shrink-0" />
                  <span className={isCollapsed ? 'sr-only' : ''}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )) : (
            <>
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon />
              <SidebarMenuSkeleton showIcon /> 
              <SidebarMenuSkeleton showIcon /> 
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <Separator className="mt-auto mb-2" />
      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-5 w-5" />
          <span className={isCollapsed ? 'sr-only' : ''}>Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
