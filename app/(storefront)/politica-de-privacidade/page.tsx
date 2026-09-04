import { supabase } from '@/lib/supabase/client';

export const revalidate = 3600;

export const metadata = {
  title: 'Política de Privacidade',
  description: "Como o Tremeliko's Burguer coleta, usa e protege seus dados pessoais conforme a LGPD.",
  alternates: { canonical: 'https://tremelikos.growthpulse.com.br/politica-de-privacidade' },
};

const LAST_UPDATED = '2026-09-03';

export default async function PrivacyPolicyPage() {
  const { data: store } = await supabase
    .from('stores')
    .select('name, address, city, state, phone, whatsapp')
    .single();

  const storeName = store?.name || "Tremeliko's Burguer";
  const storeAddress = store?.address || 'Rua Gonçalves da Costa, 3, Jequiezinho, Jequié - BA';
  const storePhone = store?.phone || '(73) 99154-2371';
  const storeWhatsApp = store?.whatsapp || '5573991542371';

  return (
    <div className="container-store py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-contrast mb-1">Política de Privacidade</h1>
      <p className="text-sm text-ink-muted mb-6">Última atualização: {LAST_UPDATED}</p>

      <div className="prose prose-sm max-w-none space-y-4 text-ink">
        <p>
          Esta Política de Privacidade descreve como o <strong>{storeName}</strong> (CNPJ/CPF a informar)
          coleta, usa, armazena, compartilha e protege os dados pessoais dos usuários do cardápio
          digital, em conformidade com a <strong>Lei nº 13.709/2018 (LGPD)</strong> e o
          <strong> Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
        </p>

        <h2 className="text-lg font-semibold text-ink mt-6">1. Quem é o controlador</h2>
        <p>
          O controlador dos dados pessoais é o <strong>{storeName}</strong>, pessoa jurídica de
          direito privado, inscrita no CNPJ sob nº <em>[informar]</em>, com sede em{' '}
          {storeAddress}.
        </p>
        <p>
          Encarregado de Dados (DPO): pode ser contatado pelo WhatsApp{' '}
          <a href={`https://wa.me/${storeWhatsApp}`} className="underline">{storePhone}</a> ou pelo
          e-mail <em>[informar]</em>.
        </p>

        <h2 className="text-lg font-semibold text-ink mt-6">2. Quais dados coletamos</h2>
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden my-2">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-2">Categoria</th><th className="text-left p-2">Exemplos</th><th className="text-left p-2">Origem</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="p-2">Identificação</td>
              <td className="p-2">Nome, WhatsApp (com DDD), e-mail (opcional)</td>
              <td className="p-2">Fornecido por você no checkout</td>
            </tr>
            <tr>
              <td className="p-2">Pedido</td>
              <td className="p-2">Itens, quantidade, adicionais, observações, valor</td>
              <td className="p-2">Gerado pelo uso do cardápio</td>
            </tr>
            <tr>
              <td className="p-2">Entrega</td>
              <td className="p-2">Endereço, bairro, CEP, complemento</td>
              <td className="p-2">Fornecido por você (se delivery)</td>
            </tr>
            <tr>
              <td className="p-2">Navegação</td>
              <td className="p-2">Páginas visitadas, dispositivo, IP, fbp/fbc (Meta), GA client_id</td>
              <td className="p-2">Cookies e pixels (com consentimento)</td>
            </tr>
            <tr>
              <td className="p-2">Pagamento</td>
              <td className="p-2">Forma escolhida (PIX, dinheiro, cartão)</td>
              <td className="p-2">Fornecido por você (não armazenamos dados de cartão)</td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-lg font-semibold text-ink mt-6">3. Para que usamos (finalidades e bases legais)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Executar o pedido:</strong> preparar, entregar e confirmar (base legal: execução de contrato).</li>
          <li><strong>Comunicação:</strong> enviar mensagens sobre o pedido pelo WhatsApp (legítimo interesse + consentimento).</li>
          <li><strong>Atendimento e suporte:</strong> responder dúvidas e reclamações (legítimo interesse).</li>
          <li><strong>Marketing:</strong> enviar promoções e novidades <em>somente</em> se você aceitar (consentimento).</li>
          <li><strong>Melhorias:</strong> métricas agregadas de uso para melhorar o cardápio (legítimo interesse + consentimento para analytics).</li>
          <li><strong>Obrigações legais/fiscais:</strong> guardar pedidos por 5 anos (obrigação legal).</li>
        </ul>

        <h2 className="text-lg font-semibold text-ink mt-6">4. Cookies e tecnologias de rastreamento</h2>
        <p>Usamos cookies e armazenamento local. Você pode gerenciar pelo banner exibido na primeira visita.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Necessários:</strong> carrinho, sessão, preferências (não podem ser desativados).</li>
          <li><strong>Analíticos:</strong> Google Analytics 4 (somente com consentimento).</li>
          <li><strong>Marketing:</strong> Meta Pixel (Facebook/Instagram Ads) — usa <code>_fbp</code> e <code>_fbc</code>.</li>
          <li><strong>Conversões server-side:</strong> enviamos eventos de compra para Meta CAPI e GA4 Measurement Protocol.</li>
        </ul>

        <h2 className="text-lg font-semibold text-ink mt-6">5. Compartilhamento</h2>
        <p>Não vendemos seus dados. Compartilhamos apenas o necessário com:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Meta (Facebook/Instagram):</strong> eventos de conversão via Pixel e CAPI para anúncios (com consentimento).</li>
          <li><strong>Google:</strong> Google Analytics 4 (com consentimento).</li>
          <li><strong>WAHA / WhatsApp:</strong> para enviar o pedido e confirmação.</li>
          <li><strong>Supabase:</strong> nosso provedor de banco de dados (servidores nos EUA).</li>
          <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial.</li>
        </ul>

        <h2 className="text-lg font-semibold text-ink mt-6">6. Transferência internacional</h2>
        <p>
          Alguns fornecedores (Supabase, Google, Meta) podem processar dados em servidores fora do
          Brasil. Garantimos que esses fornecedores oferecem grau de proteção adequado conforme
          exigido pela LGPD (cláusulas-padrão contratuais, decisões de adequação da ANPD ou
          certificações reconhecidas).
        </p>

        <h2 className="text-lg font-semibold text-ink mt-6">7. Retenção</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pedidos e notas fiscais: <strong>5 anos</strong> (obrigação legal/fiscal).</li>
          <li>Logs de auditoria: <strong>12 meses</strong>.</li>
          <li>Contatos de marketing: até você revogar consentimento.</li>
          <li>Dados de carrinho abandonados: <strong>30 dias</strong>.</li>
        </ul>

        <h2 className="text-lg font-semibold text-ink mt-6">8. Seus direitos como titular</h2>
        <p>Conforme o art. 18 da LGPD, você tem direito a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Confirmar a existência de tratamento</li>
          <li>Acessar seus dados</li>
          <li>Corrigir dados incompletos ou incorretos</li>
          <li>Solicitar anonimização, bloqueio ou eliminação</li>
          <li>Obter portabilidade</li>
          <li>Revogar consentimento</li>
          <li>Apresentar reclamação à ANPD</li>
        </ul>
        <p>Para exercer seus direitos, envie pedido por WhatsApp ou e-mail do DPO acima. Responderemos em até 15 dias.</p>

        <h2 className="text-lg font-semibold text-ink mt-6">9. Segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais: HTTPS, hash SHA-256 de dados sensíveis
          (e-mail/telefone) antes de envio a APIs de marketing, controle de acesso por perfil,
          RLS no banco de dados, rate limiting em APIs públicas, e logs de auditoria.
        </p>

        <h2 className="text-lg font-semibold text-ink mt-6">10. Crianças e adolescentes</h2>
        <p>
          O cardápio não é direcionado a menores de 18 anos. Pedidos devem ser feitos por
          responsável legal.
        </p>

        <h2 className="text-lg font-semibold text-ink mt-6">11. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política. Alterações relevantes serão comunicadas por aviso no
          site e/ou no WhatsApp. A data da última atualização está no topo.
        </p>

        <h2 className="text-lg font-semibold text-ink mt-6">12. Contato</h2>
        <ul className="list-none space-y-1">
          <li><strong>Empresa:</strong> {storeName}</li>
          <li><strong>Endereço:</strong> {storeAddress}</li>
          <li><strong>WhatsApp:</strong> <a href={`https://wa.me/${storeWhatsApp}`} className="underline">{storePhone}</a></li>
          <li><strong>E-mail DPO:</strong> <em>[informar]</em></li>
        </ul>
      </div>
    </div>
  );
}
