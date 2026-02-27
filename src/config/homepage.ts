export interface HomepageChip {
  label: string;
  href: string;
}

export interface HomepageContent {
  hero: {
    kicker: string;
    title: string;
    lead: string;
    image: {
      src: string;
      alt: string;
      note?: string;
    };
    chips: HomepageChip[];
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };
  booking: {
    title: string;
    lead: string;
    statusLabel: string;
    ctaLabel: string;
  };
  contact: {
    title: string;
    lead: string;
    email: string;
    phoneDisplay: string;
    phoneLink: string;
    address?: string;
  };
}

export const homepageContent: HomepageContent = {
  hero: {
    kicker: 'Sound of Simone',
    title: 'Fysioterapi med fordypning i kvinnehelse',
    lead:
      'Simone holder foredrag, veileder fagmiljoer og tilbyr helhetlig fysioterapi for deg som trenger trygg, tydelig oppfolging.',
    image: {
      src: '/images/simone-hero-placeholder.svg',
      alt: 'Midlertidig plassholder for portrett av Simone',
      note: 'Byttes til godkjent Simone-portrett i neste innholdsoppdatering.',
    },
    chips: [
      { label: 'Kvinnehelse', href: '#tjenester' },
      { label: 'Underlivsplager', href: '#tjenester' },
      { label: 'Vaginisme', href: '#tjenester' },
      { label: 'Foredrag', href: '#tjenester' },
      { label: 'Bestill time', href: '#booking' },
    ],
    primaryCtaLabel: 'Bestill time',
    secondaryCtaLabel: 'Kontakt',
  },
  booking: {
    title: 'Booking kommer i neste steg',
    lead:
      'Vi bygger na et tomt bookingskall. Integrasjon mot Physica legges inn i neste fase.',
    statusLabel: 'Physica-integrasjon: kommer snart',
    ctaLabel: 'Ga til kontakt',
  },
  contact: {
    title: 'Kontakt Sound of Simone',
    lead: 'Ta kontakt direkte pa e-post eller telefon inntil booking er fullt koblet opp.',
    email: 'Hei@soundofsimone.no',
    phoneDisplay: '911 70 100',
    phoneLink: '91170100',
  },
};
