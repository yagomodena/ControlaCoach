
'use client';

import Link from 'next/link'; // Import Link
import { Menu, Search, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Logo } from '../logo';
import { useSidebar } from '../ui/sidebar';
import { auth } from '@/firebase'; 
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  userType?: 'coach' | 'student';
}

export function Navbar({ userType = 'coach' }: NavbarProps) {
  const { toggleSidebar, isMobile } = useSidebar();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Also clear student session if it exists
      sessionStorage.removeItem('fitplanner_student_id');
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
  
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      {isMobile ? (
         <Button variant="outline" size="icon" className="shrink-0 md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Alternar menu de navegação</span>
          </Button>
      ) : (
        <div className='md:hidden'>
           <Logo collapsed={true} />
        </div>
      )}
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Alternar menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userType === 'coach' && (
              <>
                <Link href="/configuracoes" passHref>
                  <DropdownMenuItem asChild>
                    <span>Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/configuracoes" passHref>
                  <DropdownMenuItem asChild>
                    <span>Configurações</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
