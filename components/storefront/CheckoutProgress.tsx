import { Icon } from '@/components/ui';

export type CheckoutStep = 1 | 2 | 3 | 4;

const STEPS: Array<{ step: CheckoutStep; label: string; icon: 'cart' | 'user' | 'card' | 'check' }> = [
  { step: 1, label: 'Carrinho', icon: 'cart' },
  { step: 2, label: 'Seus dados', icon: 'user' },
  { step: 3, label: 'Pagamento', icon: 'card' },
  { step: 4, label: 'Confirmar', icon: 'check' },
];

const IconFor = ({ name, size = 14 }: { name: 'cart' | 'user' | 'card' | 'check'; size?: number }) => {
  switch (name) {
    case 'cart': return <Icon.cart size={size} />;
    case 'user': return <Icon.user size={size} />;
    case 'card': return <Icon.card size={size} />;
    case 'check': return <Icon.check size={size} />;
  }
};

export default function CheckoutProgress({ current }: { current: CheckoutStep }) {
  return (
    <nav
      aria-label="Etapas do pedido"
      className="container-store py-3 sm:py-4"
    >
      <ol className="flex items-center gap-1.5 text-xs sm:text-sm">
        {STEPS.map((s, idx) => {
          const isActive = s.step === current;
          const isDone = s.step < current;
          return (
            <li
              key={s.step}
              className="flex-1 flex items-center gap-1.5 min-w-0"
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={[
                  'checkout-step-circle',
                  isActive && 'checkout-step-active',
                  isDone && 'checkout-step-done',
                  !isActive && !isDone && 'checkout-step-todo',
                ].filter(Boolean).join(' ')}
                aria-hidden="true"
              >
                {isDone ? <Icon.check size={14} /> : <IconFor name={s.icon} size={14} />}
              </span>
              <span
                className={[
                  'truncate font-medium',
                  isActive && 'text-brand-text',
                  isDone && 'text-success',
                  !isActive && !isDone && 'text-ink-muted',
                ].filter(Boolean).join(' ')}
              >
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.label.split(' ')[0]}</span>
              </span>
              {idx < STEPS.length - 1 && (
                <span
                  className={[
                    'flex-1 h-0.5 mx-1',
                    isDone ? 'bg-success' : 'bg-app-border',
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
