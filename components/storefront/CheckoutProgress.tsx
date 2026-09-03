export type CheckoutStep = 1 | 2 | 3 | 4;

const STEPS: Array<{ step: CheckoutStep; label: string; icon: string }> = [
  { step: 1, label: 'Carrinho', icon: '🛒' },
  { step: 2, label: 'Seus dados', icon: '📞' },
  { step: 3, label: 'Pagamento', icon: '💳' },
  { step: 4, label: 'Confirmar', icon: '✅' },
];

export default function CheckoutProgress({ current }: { current: CheckoutStep }) {
  return (
    <nav
      aria-label="Etapas do pedido"
      className="container-store py-3"
    >
      <ol className="flex items-center gap-1 text-xs">
        {STEPS.map((s, idx) => {
          const isActive = s.step === current;
          const isDone = s.step < current;
          return (
            <li
              key={s.step}
              className="flex-1 flex items-center gap-1 min-w-0"
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className={[
                  'flex items-center gap-1 min-w-0',
                  isActive && 'font-bold text-brand',
                  isDone && 'text-green-700',
                  !isActive && !isDone && 'text-gray-400',
                ].filter(Boolean).join(' ')}
              >
                <span
                  className={[
                    'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0',
                    isActive && 'bg-brand text-white',
                    isDone && 'bg-green-100 text-green-800',
                    !isActive && !isDone && 'bg-gray-100 text-gray-500',
                  ].filter(Boolean).join(' ')}
                  aria-hidden="true"
                >
                  {isDone ? '✓' : s.step}
                </span>
                <span className="truncate">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <span
                  className={[
                    'flex-1 h-px mx-1',
                    isDone ? 'bg-green-300' : 'bg-gray-200',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
