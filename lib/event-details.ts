export type EventDetails = {
  event: {
    title: string;
    subtitle?: string | null;
    description?: string | null;
    eventDateTime: string;
    coverImageUrl?: string | null;
    dressCode?: string | null;
    footerMessage?: string | null;
  };
  address?: {
    venueName?: string | null;
    street?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
    isRedacted?: boolean;
  } | null;
  theme?: {
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    backgroundColor?: string | null;
    primaryColor?: string | null;
  } | null;
};
