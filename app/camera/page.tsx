import { Suspense } from 'react';
import ClientPage from './ClientPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
          Loading camera…
        </div>
      }
    >
      <ClientPage />
    </Suspense>
  );
}