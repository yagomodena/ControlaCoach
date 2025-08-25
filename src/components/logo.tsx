import Link from 'next/link';
import Image from 'next/image';

type LogoProps = {
  collapsed?: boolean;
  variant?: 'preto' | 'branco';
};

export function Logo({ collapsed = false, variant = 'preto' }: LogoProps) {
  const logoSrc = variant === 'branco' ? '/images/FP-Branco.png' : '/images/FP-Preto.png';

  return (
    <Link 
      href="/dashboard" 
      className="flex items-center gap-2 group" 
      aria-label="FitPlanner Home"
    >
      <Image
        src={logoSrc}
        alt="FitPlanner Logo"
        width={32}
        height={32}
        className="group-hover:opacity-90 transition-opacity duration-200"
      />
      
      {!collapsed && (
        <span className="font-headline text-xl font-bold text-primary transition-colors duration-200">
          <span className="text-accent">Fit</span>Planner
        </span>
      )}
    </Link>
  );
}
