import type { PackageCode } from "./access-policy-types";

export const packageLabels: Record<PackageCode, string> = {
  FREE: "Free",
  DEMO: "Demo",
  STANDARD: "Standard",
  PRO: "Pro",
};

export const capabilityMetadata: Record<
  string,
  { label: string; description: string; group: string }
> = {
  "event.create": { label: "Criar chá", description: "Permite iniciar um novo chá.", group: "Chá" },
  "event.update": { label: "Editar chá", description: "Permite alterar dados de um chá editável.", group: "Chá" },
  "event.custom_theme": { label: "Tema personalizado", description: "Libera personalização visual avançada.", group: "Chá" },
  "event.advanced_analytics": { label: "Relatórios avançados", description: "Libera métricas e relatórios premium.", group: "Chá" },
  "invite.share": { label: "Compartilhar convite", description: "Permite distribuir o convite do chá.", group: "Convidados" },
  "guest.manage": { label: "Gerenciar convidados", description: "Permite incluir e atualizar convidados.", group: "Convidados" },
  "guest.import_contacts": { label: "Importar contatos", description: "Permite importar convidados dos contatos.", group: "Convidados" },
  "message.wall": { label: "Mural", description: "Libera mensagens públicas do chá.", group: "Mensagens" },
  "message.private": { label: "Mensagem privada", description: "Libera conversas privadas com convidados.", group: "Mensagens" },
  "gift.manage": { label: "Gerenciar presentes", description: "Permite criar e editar a lista de presentes.", group: "Presentes" },
  "gift.cart": { label: "Carrinho de presentes", description: "Permite reservar vários presentes em uma ação.", group: "Presentes" },
  "gift.reminders": { label: "Lembretes", description: "Libera lembretes relacionados aos presentes.", group: "Presentes" },
  "gift.fulfillment": { label: "Acompanhar recebimento", description: "Permite controlar compra e recebimento.", group: "Presentes" },
  "gift.pix": { label: "Contribuição via Pix", description: "Libera presentes com contribuição financeira.", group: "Premium" },
  "gift.collective": { label: "Presente coletivo", description: "Permite contribuições em grupo.", group: "Premium" },
  "gift.contribution_reconciliation": { label: "Conciliar contribuições", description: "Libera conferência de comprovantes e valores.", group: "Premium" },
  "planning.checklist": { label: "Checklist", description: "Libera o planejamento por tarefas.", group: "Planejamento" },
  "planning.budget": { label: "Orçamento", description: "Libera o controle de orçamento do chá.", group: "Planejamento" },
  "event.active_limit": { label: "Chás ativos", description: "Quantidade de chás ativos por conta.", group: "Limites" },
  "event.co_host_limit": { label: "Coorganizadores", description: "Quantidade por chá.", group: "Limites" },
  "guest.limit_per_event": { label: "Pessoas convidadas", description: "Total de pessoas por chá, incluindo acompanhantes.", group: "Limites" },
  "gift.limit_per_event": { label: "Presentes", description: "Quantidade de presentes ativos por chá.", group: "Limites" },
  "gift.suggestion_batch_limit": { label: "Lotes de sugestões", description: "Quantidade de lotes gerados por chá.", group: "Limites" },
  "planning.checklist_item_limit": { label: "Itens no checklist", description: "Quantidade máxima de tarefas por chá.", group: "Limites" },
};

export function capabilityLabel(capability: string) {
  return capabilityMetadata[capability]?.label ?? capability;
}
