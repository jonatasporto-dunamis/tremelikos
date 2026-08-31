import { supabase } from '@/lib/supabase/client';

export const revalidate = 3600;

export default async function PrivacyPolicyPage() {
  const { data: store } = await supabase
    .from('stores')
    .select('name, address, city, state')
    .single();

  const storeName = store?.name || "Tremeliko's Burguer";
  const storeAddress = store?.address || 'Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA';

  return (
    <div className="container-store py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-contrast mb-6">
        Política de Privacidade
      </h1>

      <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
        <p>
          A sua privacidade é importante para nós. Esta Política de Privacidade descreve como
          o {storeName} coleta, usa e protege as informações pessoais que você fornece ao
          utilizar nosso cardápio digital.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          1. Informações que Coletamos
        </h2>
        <p>
          Ao fazer um pedido através do nosso cardápio digital, podemos coletar as seguintes
          informações:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nome (quando informado no WhatsApp)</li>
          <li>Número de WhatsApp (para comunicação do pedido)</li>
          <li>Endereço de entrega (quando aplicável)</li>
          <li>Itens do pedido e observações</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          2. Como Usamos as Informações
        </h2>
        <p>As informações coletadas são utilizadas exclusivamente para:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Processar e entregar seu pedido</li>
          <li>Comunicar sobre o status do pedido</li>
          <li>Melhorar nossos produtos e serviços</li>
          <li>Enviar promoções e ofertas (com seu consentimento)</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          3. Cookies
        </h2>
        <p>
          Utilizamos cookies para melhorar sua experiência no site, incluindo:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cookies necessários:</strong> Para o funcionamento básico do carrinho</li>
          <li><strong>Cookies analíticos:</strong> Para entender como você usa o site (Google Analytics)</li>
          <li><strong>Cookies de marketing:</strong> Para personalizar anúncios (Meta Pixel)</li>
        </ul>
        <p>
          Você pode aceitar ou recusar cookies não essenciais através do banner exibido no site.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          4. Compartilhamento de Dados
        </h2>
        <p>
          Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros,
          exceto quando necessário para:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cumprir obrigações legais</li>
          <li>Proteger nossos direitos e segurança</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          5. Segurança
        </h2>
        <p>
          Adotamos medidas de segurança para proteger suas informações contra acesso não
          autorizado, alteração, divulgação ou destruição.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          6. Seus Direitos (LGPD)
        </h2>
        <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Confirmar a existência de tratamento de dados</li>
          <li>Acessar seus dados</li>
          <li>Corrigir dados incompletos ou incorretos</li>
          <li>Solicitar anonimização ou exclusão de dados</li>
          <li>Revogar consentimento</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-6">
          7. Contato
        </h2>
        <p>
          Para dúvidas sobre esta política ou exercer seus direitos, entre em contato:
        </p>
        <ul className="list-none space-y-1">
          <li><strong>Empresa:</strong> {storeName}</li>
          <li><strong>Endereço:</strong> {storeAddress}</li>
          <li><strong>WhatsApp:</strong> (73) 99154-2371</li>
        </ul>

        <p className="text-sm text-gray-500 mt-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
