import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Política de privacidade e proteção de dados do Momiz.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" version="26 de setembro de 2026">
      <section><h2>1. Dados tratados</h2><p>O Momiz trata dados de conta, eventos, convidados, presentes, mensagens, documentos e saúde para entregar as funcionalidades solicitadas pelo usuário.</p></section>
      <section><h2>2. Dados sensíveis e segurança</h2><p>Dados de saúde, documentos e comprovantes são privados. Downloads protegidos usam autorização e links temporários. Dados sensíveis de saúde exigem consentimento específico e revogável.</p></section>
      <section><h2>3. Compartilhamento</h2><p>Os dados são compartilhados somente com provedores necessários à operação, segurança e entrega do serviço, observadas as finalidades informadas e as proteções aplicáveis.</p></section>
      <section><h2>4. Seus direitos</h2><p>O titular pode solicitar acesso, correção, exportação e exclusão de dados. A conta pode ser excluída pelo Perfil. Participações em eventos de terceiros podem ser anonimizadas para preservar o histórico legítimo do evento.</p></section>
      <section><h2>5. Retenção</h2><p>Telemetria é retida por 90 dias por padrão. Tokens, códigos, logs operacionais e comprovantes de eventos encerrados são removidos após 365 dias, salvo quando uma obrigação legal exigir prazo diferente.</p></section>
      <section><h2>6. Consentimento de saúde</h2><p>A revogação do consentimento bloqueia novos acessos a dados sensíveis, mas não apaga automaticamente registros que precisem ser mantidos por outra base legal válida.</p></section>
      <section><h2>7. Contato</h2><p>Para exercer direitos ou informar incidentes, escreva para <a href="mailto:suporte@momiz.com.br">suporte@momiz.com.br</a>.</p></section>
    </LegalPage>
  );
}
