export type ProfessionalAgendaFilter = {
  patientUserId: string;
  type: string;
  status: string;
  from: string;
  to: string;
};

export type AgendaAppointment = {
  id: string;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  user?: { id?: string; name?: string | null; photoUrl?: string | null } | null;
};

export const emptyAgendaFilter: ProfessionalAgendaFilter = {
  patientUserId: "",
  type: "",
  status: "",
  from: "",
  to: "",
};

export function filterAgenda(items: AgendaAppointment[], filter: ProfessionalAgendaFilter) {
  const start = filter.from ? new Date(`${filter.from}T00:00:00`).getTime() : null;
  const end = filter.to ? new Date(`${filter.to}T23:59:59.999`).getTime() : null;
  return items.filter((item) => {
    const scheduledAt = item.scheduledAt ? new Date(item.scheduledAt).getTime() : Number.NaN;
    return (
      (!filter.patientUserId || item.user?.id === filter.patientUserId) &&
      (!filter.type || item.type === filter.type) &&
      (!filter.status || item.status === filter.status) &&
      (start === null || (!Number.isNaN(scheduledAt) && scheduledAt >= start)) &&
      (end === null || (!Number.isNaN(scheduledAt) && scheduledAt <= end))
    );
  });
}

export function agendaFilterQuery(filter: ProfessionalAgendaFilter) {
  const query = new URLSearchParams();
  if (filter.patientUserId) query.set("patientUserId", filter.patientUserId);
  if (filter.type) query.set("type", filter.type);
  if (filter.status) query.set("status", filter.status);
  if (filter.from) query.set("from", new Date(`${filter.from}T00:00:00`).toISOString());
  if (filter.to) query.set("to", new Date(`${filter.to}T23:59:59.999`).toISOString());
  return query.toString();
}

export function activeAgendaFilterCount(filter: ProfessionalAgendaFilter) {
  return Object.values(filter).filter(Boolean).length;
}
