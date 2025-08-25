
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type LogoProps = {
  collapsed?: boolean;
};

export function Logo({ collapsed = false }: LogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  
  // Use a placeholder or the light logo by default to avoid layout shift,
  // then render the correct one once mounted on the client.
  const logoSrc = currentTheme === 'dark' ? '/images/FP-Branco.png' : '/images/FP-Preto.png';
  const placeholderSrc = '/images/FP-Preto.png'; // Fallback for initial render

  return (
    <Link 
      href="/dashboard" 
      className="flex items-center gap-2 group" 
      aria-label="FitPlanner Home"
    >
      {mounted ? (
        <Image
          src={logoSrc}
          alt="FitPlanner Logo"
          width={32}
          height={32}
          className="group-hover:opacity-90 transition-opacity duration-200"
          unoptimized // Add this if you don't want Next.js to optimize SVGs or want to ensure dynamic src works flawlessly
        />
      ) : (
         <Image
          src={placeholderSrc}
          alt="FitPlanner Logo"
          width={32}
          height={32}
          aria-hidden="true" // Hide from screen readers during hydration
          className="group-hover:opacity-90 transition-opacity duration-200"
        />
      )}
      
      {!collapsed && (
        <span className="font-headline text-xl font-bold text-primary transition-colors duration-200">
          <span className="text-accent">Fit</span>Planner
        </span>
      )}
    </Link>
  );
}
