import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Central de suporte",
  description: "Ajuda, contato e orientações para usar o Momiz.",
  alternates: { canonical: "/suporte" },
};

export default function SupportPage() {
  return (
    <LegalPage title="Central de suporte" version="12 de outubro de 2026">
      <div className="support-hero">
        <span aria-hidden="true">♡</span>
        <div>
          <strong>Como podemos ajudar?</strong>
          <p>Conte o que aconteceu e inclua, quando possível, o e-mail da sua conta e uma descrição da tela em que encontrou o problema.</p>
        </div>
        <a className="button primary" href="mailto:suporte@momiz.com.br?subject=Suporte%20Momiz">Falar com o suporte</a>
      </div>
      <section><h2>Acesso e conta</h2><p>Se você não consegue entrar, confirme se está usando o mesmo método de acesso escolhido no cadastro. Nunca envie senhas, códigos de verificação ou dados bancários por e-mail. Para exclusão ou exportação de dados, abra <strong>Perfil → Privacidade e meus dados</strong>.</p></section>
      <section><h2>Convites e confirmações</h2><p>Abra o convite pelo link recebido. Caso o aplicativo ainda não esteja instalado, o link pode apresentar as informações públicas disponíveis e direcionar para o app. Confirmações e alterações ficam vinculadas à conta utilizada no acesso.</p></section>
      <section><h2>Presentes e contribuições</h2><p>Reservas ajudam a família a acompanhar a lista, mas não substituem a compra ou a entrega do item. Quando o Pix estiver disponível, confira cuidadosamente a chave e o destinatário antes de transferir. O Momiz não recebe nem transfere esses valores.</p></section>
      <section><h2>Privacidade e segurança</h2><p>Você pode consultar, exportar ou excluir dados nas opções de privacidade do Perfil. Para informar um possível incidente, envie um e-mail com o assunto “Privacidade e segurança”, sem anexar senhas ou códigos de acesso. Consulte nossa <a href="/privacidade">Política de Privacidade</a>.</p></section>
      <section><h2>Contato</h2><p>Canal oficial: <a href="mailto:suporte@momiz.com.br">suporte@momiz.com.br</a>. Para facilitar o atendimento, informe o modelo do aparelho, a versão do sistema e os passos que levaram ao problema. Não publique dados pessoais em avaliações das lojas.</p></section>
    </LegalPage>
  );
}
