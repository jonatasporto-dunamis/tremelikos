'use client';

import { useEffect, useState } from 'react';
import { acceptAll, rejectAll, acceptAnalyticsOnly, getConsent } from '@/features/analytics/events';

type Mode = 'pending' | 'show' | 'preferences' | 'accepted';

export default function CookieConsentBanner() {
  const [mode, setMode] = useState<Mode>('pending');
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    if (getConsent()) {
      setMode('accepted');
    } else {
      setMode('show');
    }
  }, []);

  if (mode === 'pending' || mode === 'accepted') return null;

  if (mode === 'show') {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-40 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">🍪 Sua privacidade importa</h3>
              <p className="text-sm text-gray-600 mt-1">
                Usamos cookies para analisar o tráfego e melhorar sua experiência.
                Conforme a LGPD, você pode aceitar, recusar ou personalizar.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { rejectAll(); setMode('accepted'); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Recusar
              </button>
              <button
                onClick={() => setMode('preferences')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Personalizar
              </button>
              <button
                onClick={() => { acceptAll(); setMode('accepted'); }}
                className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover"
              >
                Aceitar tudo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // preferences
  const handleSave = () => {
    if (analytics && ads) {
      acceptAll();
    } else if (analytics) {
      acceptAnalyticsOnly();
    } else {
      rejectAll();
    }
    setMode('accepted');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferências de cookies</h3>
        <p className="text-sm text-gray-600 mb-4">
          Escolha quais tipos de cookies permitir. Sua escolha fica salva por 12 meses.
        </p>

        <div className="space-y-3 mb-5">
          <Row
            title="Essenciais"
            description="Necessários para o site funcionar (carrinho, sessão, segurança). Sempre ativos."
            checked
            disabled
            onChange={() => {}}
          />
          <Row
            title="Analytics"
            description="Métricas anônimas de uso (Google Analytics 4)."
            checked={analytics}
            onChange={setAnalytics}
          />
          <Row
            title="Marketing"
            description="Personalização de anúncios e medição de campanhas (Meta, Google)."
            checked={ads}
            onChange={setAds}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => { rejectAll(); setMode('accepted'); }}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Recusar tudo
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-hover"
          >
            Salvar preferências
          </button>
        </div>

        <a
          href="/politica-de-privacidade"
          className="block text-center text-xs text-gray-500 mt-3 hover:underline"
        >
          Ver Política de Privacidade
        </a>
      </div>
    </div>
  );
}

function Row({
  title, description, checked, disabled, onChange,
}: {
  title: string; description: string; checked: boolean; disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 border border-gray-200 rounded-lg ${disabled ? 'bg-gray-50' : 'cursor-pointer hover:bg-gray-50'}`}>
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-brand"
      />
      <div className="flex-1">
        <div className="font-medium text-sm text-gray-900">{title}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
    </label>
  );
}