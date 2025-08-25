import Link from 'next/link';

const FitPlannerIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 88 78"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="group-hover:opacity-90 transition-opacity duration-200"
    aria-hidden="true"
  >
    <path
      d="M40.9412 28.2353L0 56.4706V0H40.9412V28.2353Z"
      fill="#0D0D0D"
    />
    <path
      d="M87.0588 32.7059C87.0588 20.3371 81.3815 10.2018 72.8239 4.3949C64.2663 -1.41198 53.6765 -1.41198 45.1188 4.3949L40.9412 7.29412V78H62.8823C76.3537 78 87.0588 67.2464 87.0588 53.7059V32.7059Z"
      fill="#FF6B00"
    />
  </svg>
);


export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 group" aria-label="FitPlanner Home">
      <FitPlannerIcon />
      {!collapsed && (
        <span className="font-headline text-xl font-bold text-primary transition-colors duration-200">
          <span className="text-accent">Fit</span>Planner
        </span>
      )}
    </Link>
  );
}
