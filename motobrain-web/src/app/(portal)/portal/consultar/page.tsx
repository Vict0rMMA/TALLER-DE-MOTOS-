'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
/** Redirige al inicio y abre el asistente IA (?ai=1). */
export default function ConsultarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portal?ai=1');
  }, [router]);

  return null;
}
