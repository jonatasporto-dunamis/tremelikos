import Link from 'next/link';

export const dynamic = 'force-dynamic';

const SUB = [
  { href: '/admin/configuracoes/loja', label: 'Loja', desc: 'Dados, horários, pedido mínimo', icon: '🏪' },
  { href: '/admin/audit', label: 'Auditoria', desc: 'Histórico de ações do painel', icon: '📋' },
];

export default function AdminConfiguracoesIndex() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Configurações</h1>
      <p className="text-sm text-gray-500 mb-6">Gerencie dados da loja e veja histórico de mudanças.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SUB.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand hover:shadow-sm transition-all min-h-[80px] flex gap-3 items-start"
          >
            <span className="text-2xl" aria-hidden="true">{s.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{s.label}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
