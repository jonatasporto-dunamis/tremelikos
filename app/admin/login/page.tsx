export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tremeliko&apos;s Burguer
          </h1>
          <p className="text-gray-500 mt-2">Painel Administrativo</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary py-3 text-lg"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar ao cardápio
          </a>
        </div>
      </div>
    </div>
  );
}
