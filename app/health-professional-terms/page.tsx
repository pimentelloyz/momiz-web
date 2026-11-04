import type { Metadata } from "next";
import { siteConfig } from "../../lib/site-config";
import { LegalPage } from "../legal-page";

const effectiveDate = "4 de novembro de 2026";

export const metadata: Metadata = {
  title: "Termos de uso para profissionais de saúde",
  description:
    "Condições para profissionais de saúde acessarem informações compartilhadas por pacientes no Momiz.",
  alternates: { canonical: "/health-professional-terms" },
};

export default function HealthProfessionalTermsPage() {
  return (
    <LegalPage
      title="Termos de uso para profissionais de saúde"
      lastUpdated={effectiveDate}
    >
      <div className="legal-summary">
        <strong>Cuidado com acesso responsável.</strong>
        <p>
          Estes termos explicam as condições para profissionais de saúde usarem o Momiz e acessarem informações que uma paciente decidiu compartilhar.
        </p>
      </div>

      <section>
        <h2>1. Aceite e finalidade</h2>
        <p>
          Ao se cadastrar ou utilizar os recursos destinados a profissionais de saúde, você concorda com estes termos e com a nossa <a href="/privacidade">Política de Privacidade</a>. O acesso existe para apoiar o acompanhamento da paciente e deve ser usado somente para essa finalidade, dentro de sua atuação profissional.
        </p>
      </section>

      <section>
        <h2>2. Cadastro e verificação profissional</h2>
        <p>
          Você deve fornecer informações verdadeiras, completas e atualizadas sobre sua identidade, contato e habilitação profissional. Podemos solicitar documentos ou outras confirmações para verificar o cadastro, negar ou suspender o acesso quando a verificação não for concluída e repetir essa verificação quando necessário. A aprovação de uma conta não substitui licenças, registros ou obrigações exigidos para o exercício da profissão.
        </p>
      </section>

      <section>
        <h2>3. Autorização da paciente</h2>
        <p>
          Você somente poderá visualizar informações quando a própria paciente autorizar o compartilhamento pelos recursos disponíveis no Momiz. Essa autorização define a relação de acesso e não transfere a titularidade dos dados. Não solicite credenciais da paciente, não tente contornar permissões e não use informações obtidas fora do acesso autorizado para ampliar o conteúdo disponível.
        </p>
      </section>

      <section>
        <h2>4. Sigilo e uso responsável</h2>
        <p>
          Informações de saúde e demais dados pessoais devem ser tratados com confidencialidade e apenas na medida necessária para o atendimento. Proteja seus meios de acesso, não compartilhe sua conta, evite exibir dados em ambientes inadequados e não copie, divulgue ou encaminhe informações a terceiros sem autorização ou outra justificativa legal válida. Suas obrigações profissionais e éticas de sigilo continuam aplicáveis independentemente destes termos.
        </p>
      </section>

      <section>
        <h2>5. Condutas proibidas</h2>
        <p>
          É proibido acessar dados sem necessidade legítima, usar as informações para discriminação, publicidade, prospecção comercial ou finalidade incompatível com o cuidado, tentar identificar vulnerabilidades, alterar registros de forma enganosa, automatizar coletas não autorizadas ou permitir que outra pessoa utilize sua conta. Suspeitas de uso indevido podem levar à restrição ou ao encerramento do acesso.
        </p>
      </section>

      <section>
        <h2>6. Limites do Momiz</h2>
        <p>
          O Momiz é uma ferramenta de organização e compartilhamento de informações. Ele não substitui avaliação clínica, prontuário obrigatório, diagnóstico, prescrição, atendimento presencial nem os sistemas e procedimentos exigidos pela sua profissão. Você é responsável por suas decisões profissionais, pela conferência das informações relevantes e pelo cumprimento das normas aplicáveis. Em situações de urgência ou emergência, utilize os canais de atendimento adequados; não dependa do Momiz.
        </p>
      </section>

      <section>
        <h2>7. Revogação e encerramento do acesso</h2>
        <p>
          A paciente pode revogar a autorização de compartilhamento, e o profissional pode deixar de acompanhar a paciente. Após a revogação ou o encerramento, novos acessos ficam indisponíveis. Você deve interromper o uso dos dados e eliminar cópias que não precise manter, respeitando eventuais obrigações legais ou profissionais de conservação. O Momiz também pode restringir ou encerrar contas por risco de segurança, perda de habilitação, violação destes termos ou exigência legal.
        </p>
      </section>

      <section>
        <h2>8. Segurança, registros e auditoria</h2>
        <p>
          Adotamos medidas para proteger contas e informações. Acessos e ações relevantes podem ser registrados e analisados para segurança, suporte, prevenção de abuso, apuração de incidentes e cumprimento de obrigações legais. Você deve comunicar imediatamente qualquer suspeita de acesso indevido, perda de credenciais ou incidente envolvendo dados compartilhados pelo Momiz e colaborar com verificações razoáveis relacionadas ao uso da sua conta.
        </p>
      </section>

      <section>
        <h2>9. Disponibilidade e alterações</h2>
        <p>
          O serviço pode passar por manutenção, atualização ou indisponibilidade temporária. Recursos e condições podem mudar para melhorar a segurança, atender à legislação ou evoluir o produto. Alterações relevantes nestes termos serão comunicadas pelos canais disponíveis e, quando necessário, exigirão um novo aceite antes da continuidade do uso.
        </p>
      </section>

      <section>
        <h2>10. Vigência e versão</h2>
        <p>
          Esta é a versão 1.0, vigente a partir de {effectiveDate}. Estes termos permanecem válidos enquanto você mantiver uma conta profissional ou utilizar os recursos correspondentes. Obrigações de sigilo, segurança, responsabilidade e conservação que devam continuar após o encerramento permanecem aplicáveis pelo período necessário.
        </p>
      </section>

      <section>
        <h2>11. Legislação aplicável</h2>
        <p>
          Estes termos são interpretados conforme a legislação brasileira. As regras de proteção de dados, os direitos da paciente e as normas éticas e profissionais aplicáveis à sua área de atuação permanecem preservados.
        </p>
      </section>

      <section>
        <h2>12. Contato</h2>
        <p>
          Para dúvidas, solicitações ou comunicação de incidentes, envie um e-mail para <a href={`mailto:${siteConfig.supportEmail}?subject=Termos%20para%20profissionais%20de%20sa%C3%BAde`}>{siteConfig.supportEmail}</a> ou acesse a <a href="/suporte">Central de suporte</a>. Não envie senhas, códigos de acesso ou informações de saúde desnecessárias por e-mail.
        </p>
      </section>
    </LegalPage>
  );
}
