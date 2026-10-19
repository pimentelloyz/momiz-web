import type { Metadata } from "next";
import { siteConfig } from "../../lib/site-config";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Excluir conta e dados",
  description: "Instruções para excluir sua conta Momiz e os dados associados.",
  alternates: { canonical: "/excluir-conta" },
};

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Excluir conta e dados">
      <div className="legal-summary">
        <strong>Você mantém o controle da sua conta.</strong>
        <p>A exclusão pode ser iniciada diretamente no aplicativo. Leia abaixo o que acontece antes de confirmar.</p>
      </div>
      <section><h2>Como excluir pelo aplicativo</h2><ol><li>Entre na sua conta do Momiz.</li><li>Abra a aba <strong>Perfil</strong>.</li><li>Selecione <strong>Privacidade e meus dados</strong>.</li><li>Toque em <strong>Excluir minha conta</strong> e confirme a solicitação.</li></ol></section>
      <section><h2>Se você não consegue acessar a conta</h2><p>Envie uma solicitação para <a href={`mailto:${siteConfig.supportEmail}?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20de%20conta`}>{siteConfig.supportEmail}</a> usando o mesmo e-mail cadastrado. Podemos solicitar uma confirmação adicional para proteger a conta contra pedidos feitos por terceiros.</p></section>
      <section><h2>Dados removidos</h2><p>A exclusão abrange os dados da conta e conteúdos que não precisem ser preservados por obrigação legal, segurança ou prevenção a fraude. Eventos sob sua responsabilidade deixam de ficar disponíveis conforme informado durante a confirmação.</p></section>
      <section><h2>Dados que podem ser anonimizados ou preservados</h2><p>Participações em eventos de outras pessoas podem ser anonimizadas para manter registros legítimos do organizador. Informações que precisem ser conservadas por obrigação legal ou segurança permanecem apenas pelo período necessário e com acesso restrito.</p></section>
      <section><h2>Antes de excluir</h2><p>Se desejar guardar uma cópia, use primeiro a opção de exportação em <strong>Perfil → Privacidade e meus dados</strong>. A exclusão é permanente e pode não ser reversível depois de processada.</p></section>
      <section><h2>Precisa de ajuda?</h2><p>Fale com a <a href="/suporte">Central de suporte</a> ou escreva para <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.</p></section>
    </LegalPage>
  );
}
