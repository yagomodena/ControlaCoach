
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// This is a temporary functional component.
// It will redirect the user to the /dashboard page.
export default function RelatoriosRedirectPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="container mx-auto py-8">
      <p>Redirecionando para o Dashboard...</p>
    </div>
  );
}
