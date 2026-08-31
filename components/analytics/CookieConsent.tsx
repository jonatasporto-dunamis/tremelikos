'use client';

import { useState, useEffect } from 'react';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

export default function CookieConsentBanner() {
  const [status, setStatus] = useState<ConsentStatus>('pending');

  useEffect(() => {
    const stored = localStorage.getItem('cookie_consent');
    if (stored === 'accepted' || stored === 'rejected') {
      setStatus(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setStatus('accepted');
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setStatus('rejected');
  };

  if (status !== 'pending') return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">🍪 Cookies</h3>
            <p className="text-sm text-gray-600 mt-1">
              Usamos cookies para melhorar sua experiência e analisar o tráfego do site.
              Você pode aceitar ou recusar.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
