'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import FloorCamera from '@/components/FloorCamera';

type InitialLeadContext = {
  leadId?: string;
  sessionToken?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  source?: string;
  wixContactId?: string;
};

export default function ClientPage() {
  const searchParams = useSearchParams();

  const initialLeadContext = useMemo<InitialLeadContext>(() => {
    return {
      leadId: searchParams?.get('lead_id') ?? undefined,
      sessionToken: searchParams?.get('session_token') ?? undefined,
      fullName: searchParams?.get('name') ?? undefined,
      email: searchParams?.get('email') ?? undefined,
      phone: searchParams?.get('phone') ?? undefined,
      source: searchParams?.get('source') ?? 'wix',
      wixContactId: searchParams?.get('wix_contact_id') ?? undefined,
    };
  }, [searchParams]);

  const initialSelections = useMemo(() => {
    return {
      species: searchParams?.get('species') ?? 'white-oak',
      grade: searchParams?.get('grade') ?? '',
      stain: searchParams?.get('stain') ?? 'natural',
      finish: searchParams?.get('finish') ?? 'matte',
      layout: searchParams?.get('layout') ?? 'plank',
    };
  }, [searchParams]);

  return (
    <FloorCamera
      initialLeadContext={initialLeadContext}
      initialSelections={initialSelections}
    />
  );
}