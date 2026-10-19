import type { Metadata } from "next";
import { siteConfig } from "../../lib/site-config";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Política de privacidade e proteção de dados do Momiz.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade">
      <div className="legal-summary">
        <strong>Sua privacidade faz parte do produto.</strong>
        <p>Esta política explica quais dados o Momiz utiliza, por que eles são necessários e como você pode exercer seus direitos.</p>
      </div>
      <section><h2>1. Quem controla seus dados</h2><p>O Momiz é responsável pelo tratamento dos dados usados para disponibilizar o aplicativo e seus serviços. Para dúvidas, solicitações ou incidentes de privacidade, escreva para <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.</p></section>
      <section><h2>2. Dados que podemos tratar</h2><p>Podemos tratar dados de cadastro e autenticação, como nome, e-mail, foto e identificadores de conta; informações de eventos, convidados e confirmações; listas de presentes, reservas e contribuições; mensagens, imagens, documentos e comprovantes enviados pelo usuário; dados técnicos do dispositivo, notificações, diagnósticos e registros de segurança. Dados sensíveis somente são tratados quando uma funcionalidade opcional os exigir e houver base legal adequada.</p></section>
      <section><h2>3. Como usamos esses dados</h2><p>Usamos os dados para criar e proteger sua conta, organizar eventos, entregar convites e notificações, registrar confirmações, administrar presentes, oferecer suporte, prevenir fraude, corrigir falhas e cumprir obrigações legais. Não vendemos dados pessoais e não utilizamos seus dados para publicidade comportamental entre aplicativos.</p></section>
      <section><h2>4. Convites, convidados e dados de terceiros</h2><p>Organizadores devem cadastrar apenas informações necessárias e que estejam autorizados a compartilhar. Convidados podem visualizar ou atualizar informações conforme o convite e as permissões do evento. Dados como nome do bebê e detalhes do chá são fornecidos pelo organizador; o Momiz não é direcionado ao uso autônomo por crianças.</p></section>
      <section><h2>5. Presentes, Pix e comprovantes</h2><p>Quando uma família habilita contribuições por Pix, a transferência ocorre diretamente para a chave informada pelo organizador. O Momiz não recebe nem guarda o valor transferido. Chaves Pix, comprovantes e dados pessoais relacionados ficam restritos aos contextos e usuários autorizados e não são enviados como propriedades de publicidade ou analytics.</p></section>
      <section><h2>6. Compartilhamento e operadores</h2><p>Compartilhamos dados somente com provedores necessários para autenticação, hospedagem, banco de dados, armazenamento, envio de notificações, monitoramento e suporte. Esses fornecedores recebem apenas os dados necessários para executar seus serviços e podem operar infraestrutura fora do Brasil, com medidas contratuais e técnicas aplicáveis.</p></section>
      <section><h2>7. Segurança</h2><p>Adotamos controles de acesso, comunicação criptografada, armazenamento protegido e links temporários para conteúdos privados. Nenhum sistema é completamente imune a riscos; por isso, monitoramos incidentes e recomendamos que cada usuário mantenha seus meios de acesso protegidos.</p></section>
      <section><h2>8. Retenção e exclusão</h2><p>Mantemos dados pelo tempo necessário para prestar o serviço, proteger usuários e cumprir obrigações legais. Informações podem ser eliminadas ou anonimizadas quando deixam de ser necessárias. Algumas relações com eventos de terceiros podem ser anonimizadas para preservar registros legítimos sem manter a identificação da conta excluída.</p></section>
      <section><h2>9. Seus direitos</h2><p>Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade quando aplicável, informação sobre compartilhamento, revogação de consentimento e exclusão. O aplicativo oferece exportação e exclusão em <strong>Perfil → Privacidade e meus dados</strong>. Consulte também a página <a href="/excluir-conta">Excluir conta e dados</a>.</p></section>
      <section><h2>10. Alterações nesta política</h2><p>Podemos atualizar esta política para refletir mudanças legais ou no serviço. Alterações relevantes serão comunicadas pelos canais disponíveis e, quando necessário, exigirão novo consentimento.</p></section>
      <section><h2>11. Contato</h2><p>Para exercer seus direitos ou falar sobre privacidade, envie um e-mail para <a href={`mailto:${siteConfig.supportEmail}?subject=Privacidade%20e%20dados`}>{siteConfig.supportEmail}</a>. Também disponibilizamos orientações na <a href="/suporte">Central de suporte</a>.</p></section>
    </LegalPage>
  );
}
