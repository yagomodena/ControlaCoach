
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Dumbbell,
  Activity,
  LogOut,
  Settings,
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
import { auth } from '@/firebase'; 
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/student/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
  { href: '/student/treino', label: 'Meu Treino', icon: Dumbbell },
  { href: '/student/evolucao', label: 'Minha Evolução', icon: Activity },
];

export function StudentSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = sidebarState === 'collapsed';

  const handleLogout = async () => {
    try {
      // Clear student session storage
      sessionStorage.removeItem('fitplanner_student_id');
      
      // Although students don't use Firebase Auth, signing out is good practice
      // in case a coach's session is somehow active.
      if (auth.currentUser) {
        await signOut(auth);
      }

      toast({
        title: 'Logout Realizado',
        description: 'Você foi desconectado com sucesso.',
      });
      router.push('/login');
    } catch (error: any) {
      console.error('Logout Error:', error);
      toast({
        title: 'Erro ao Sair',
        description: error.message || 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4">
        <Logo collapsed={isCollapsed} userType="student" />
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
                <Link href={item.href} onClick={handleLinkClick}>
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
