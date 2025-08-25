
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

type LogoProps = {
  collapsed?: boolean;
  userType?: 'coach' | 'student';
};

export function Logo({ collapsed = false, userType = 'coach' }: LogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' ? '/images/FP-Branco.png' : '/images/FP-Preto.png';
  const placeholderSrc = '/images/FP-Preto.png';
  const homeUrl = userType === 'student' ? '/student/dashboard' : '/dashboard';

  return (
    <Link
      href={homeUrl}
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
