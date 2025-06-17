import Link from 'next/link';

const FootvolleyBallIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary group-hover:text-accent transition-colors duration-200"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 0-3.91 19.48M12 22a10 10 0 0 0 3.91-19.48" />
    <path d="M2 12h20" />
    <path d="M12 2a10 10 0 0 0-7.79 3.94" />
    <path d="M12 22a10 10 0 0 1-7.79-3.94" />
  </svg>
);

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 group" aria-label="Bossolan Futevôlei Home">
      <FootvolleyBallIcon />
      {!collapsed && (
        <span className="font-headline text-xl font-bold text-primary group-hover:text-accent transition-colors duration-200">
          Bossolan Futevôlei
        </span>
      )}
    </Link>
  );
}
