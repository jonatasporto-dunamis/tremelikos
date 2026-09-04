import { createProduct } from '../../actions';

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-4">Novo Produto</h1>
      <form action={createProduct} className="bg-white rounded-xl border border-app-border p-4 space-y-3 max-w-2xl">
        <Field label="Nome" name="name" required />
        <Field label="Descrição" name="description" textarea />
        <Field label="Preço base (R$)" name="base_price" type="number" step="0.01" required />
        <Field label="Selo" name="badge" placeholder="Ex: Mais Pedido" />
        <Checkbox label="Ativo" name="active" defaultChecked />
        <Checkbox label="Disponível" name="available" defaultChecked />
        <Checkbox label="Destaque" name="featured" />
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary">Criar produto</button>
          <a href="/admin/produtos" className="px-4 py-2 border border-app-border rounded-lg text-sm">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  textarea,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={3}
          className="w-full p-2 border border-app-border rounded-lg text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          step={step}
          placeholder={placeholder}
          className="w-full p-2 border border-app-border rounded-lg text-sm"
        />
      )}
    </div>
  );
}

function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-brand" />
      {label}
    </label>
  );
}