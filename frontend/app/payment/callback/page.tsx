'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function PaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Verifying payment...');

  useEffect(() => {
    const reference = params.get('reference');
    if (!reference) {
      setStatus('No reference found');
      return;
    }
    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/billing/verify`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ reference })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Verification failed');

        localStorage.setItem('phx_token', data.access_token);
        localStorage.setItem('phx_email', data.email);
        localStorage.setItem('phx_role', data.role);
        localStorage.removeItem('phx_pending_email');

        setStatus('Payment successful! Redirecting...');
        router.push(data.role === 'admin'? '/dashboard/admin' : '/dashboard/general');
      } catch (e:any) {
        setStatus(e.message);
      }
    };
    verify();
  }, [params, router]);

  return <div className="min-h-screen flex items-center justify-center"><p>{status}</p></div>;
}

export default function PaymentCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading payment details...</p></div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}