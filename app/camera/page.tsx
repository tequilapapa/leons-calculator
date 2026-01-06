// app/camera/page.tsx
import { Suspense } from 'react';
import ClientPage from './ClientPage';

// Route options MUST live in a server file
export const dynamic = 'force-dynamic';
export const revalidate = 0;            // or: false
export const fetchCache = 'force-no-store';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] grid place-items-center text-slate-300">Loading…</div>}>
      <ClientPage />
    </Suspense>
  );
}