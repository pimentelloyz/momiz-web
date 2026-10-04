import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos de uso do aplicativo Momiz.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" version="26 de setembro de 2026">
      <section><h2>1. Sobre o Momiz</h2><p>O Momiz auxilia na organização de eventos, reunindo recursos para convites, convidados, presentes e informações relacionadas. O Momiz não é instituição financeira, intermediador de pagamentos ou serviço de entrega.</p></section>
      <section><h2>2. Responsabilidades</h2><p>O organizador é responsável pelos dados cadastrados, pelos convites enviados e pela conferência manual de contribuições feitas por Pix. Cada usuário deve manter seus dados de acesso seguros e informar qualquer uso não autorizado.</p></section>
      <section><h2>3. Uso aceitável</h2><p>É proibido usar o serviço para fraude, assédio, conteúdo ilegal, violação de direitos ou acesso não autorizado a dados de terceiros. Contas que violem estas condições podem ser restringidas ou encerradas.</p></section>
      <section><h2>4. Disponibilidade</h2><p>O serviço pode passar por manutenção, atualização ou indisponibilidade temporária. Trabalharemos para comunicar interrupções relevantes e restaurar o acesso com segurança.</p></section>
      <section><h2>5. Alterações</h2><p>Mudanças materiais nestes termos serão comunicadas e, quando necessário, exigirão novo aceite antes da continuidade do uso.</p></section>
      <section><h2>6. Contato</h2><p>Dúvidas, solicitações ou incidentes podem ser enviados para <a href="mailto:suporte@momiz.com.br">suporte@momiz.com.br</a>.</p></section>
    </LegalPage>
  );
}
