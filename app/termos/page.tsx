import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos de uso do aplicativo Momiz.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" version="12 de outubro de 2026">
      <div className="legal-summary">
        <strong>Organização com regras claras.</strong>
        <p>Ao criar uma conta ou utilizar o Momiz, você concorda com estes termos e com nossa Política de Privacidade.</p>
      </div>
      <section><h2>1. Sobre o Momiz</h2><p>O Momiz auxilia na organização de eventos, reunindo recursos para convites, convidados, presentes e informações relacionadas. O Momiz não é instituição financeira, intermediador de pagamentos ou serviço de entrega.</p></section>
      <section><h2>2. Responsabilidades</h2><p>O organizador é responsável pelos dados cadastrados, pelos convites enviados e pela conferência manual de contribuições feitas por Pix. Cada usuário deve manter seus dados de acesso seguros e informar qualquer uso não autorizado.</p></section>
      <section><h2>3. Participação e presentes</h2><p>A participação presencial é usada para apoiar estimativas do evento; a participação de longe não compõe a contagem de alimentação ou lembrancinhas. O carrinho organiza a intenção de presentear. Reservas, disponibilidade, compra e entrega dependem da confirmação mostrada no checkout e da atuação das pessoas envolvidas.</p></section>
      <section><h2>4. Pix</h2><p>Quando habilitado, o Pix é enviado diretamente para a chave informada pelo organizador. O Momiz não recebe, custodia ou transfere esses valores e a confirmação pode depender da conferência do anfitrião.</p></section>
      <section><h2>5. Uso aceitável</h2><p>É proibido usar o serviço para fraude, assédio, conteúdo ilegal, violação de direitos ou acesso não autorizado a dados de terceiros. Contas que violem estas condições podem ser restringidas ou encerradas.</p></section>
      <section><h2>6. Disponibilidade</h2><p>O serviço pode passar por manutenção, atualização ou indisponibilidade temporária. Trabalharemos para comunicar interrupções relevantes e restaurar o acesso com segurança.</p></section>
      <section><h2>7. Alterações</h2><p>Mudanças materiais nestes termos serão comunicadas e, quando necessário, exigirão novo aceite antes da continuidade do uso.</p></section>
      <section><h2>8. Encerramento da conta</h2><p>Você pode excluir sua conta pelo aplicativo em <strong>Perfil → Privacidade e meus dados</strong>. A exclusão pode anonimizar participações vinculadas a eventos de terceiros e preservar informações pelo período necessário ao cumprimento de obrigações legais. Veja os detalhes em <a href="/excluir-conta">Excluir conta e dados</a>.</p></section>
      <section><h2>9. Legislação aplicável</h2><p>Estes termos são interpretados conforme a legislação brasileira. Direitos assegurados pela legislação de proteção ao consumidor e de proteção de dados permanecem preservados.</p></section>
      <section><h2>10. Contato</h2><p>Dúvidas, solicitações ou incidentes podem ser enviados para <a href="mailto:suporte@momiz.com.br">suporte@momiz.com.br</a> ou pela <a href="/suporte">Central de suporte</a>.</p></section>
    </LegalPage>
  );
}
