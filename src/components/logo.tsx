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

  // Alterna entre logo branca e preta
  const logoSrc =
    currentTheme === 'dark' ? '/images/FP-SP.png' : '/images/FP-SB.png';

  // Fallback inicial (antes do hook montar)
  const placeholderSrc = '/images/FP-SP.png';

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
          width={120}
          height={40}
          className="group-hover:opacity-90 transition-opacity duration-200 object-contain"
          priority
        />
      ) : (
        <Image
          src={placeholderSrc}
          alt="FitPlanner Logo"
          width={120}
          height={40}
          aria-hidden="true"
          className="group-hover:opacity-90 transition-opacity duration-200 object-contain"
        />
      )}

      {!collapsed && (
        <span className="font-headline text-xl font-bold transition-colors duration-200 flex">
          <span className="text-accent">Fit</span>
          <span className="text-black dark:text-white">Planner</span>
        </span>
      )}
    </Link>
  );
}
