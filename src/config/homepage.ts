import { claimItems } from './claims';

export interface HomepageNavItem {
  label: string;
  href: string;
}

export interface HomepageQuickNavItem extends HomepageNavItem {
  kind: 'link' | 'menu';
}

export interface HomepageMenuGroup {
  title: string;
  items: HomepageNavItem[];
}

export interface HomepageProofItem {
  label: string;
  value: string;
  verified: boolean;
}

export interface HomepageContent {
  bottomQuickNav: HomepageQuickNavItem[];
  menuGroups: HomepageMenuGroup[];
  hero: {
    kicker: string;
    title: string;
    lead: string;
    image: {
      src: string;
      webpSrc: string;
      alt: string;
    };
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };
  proofItems: HomepageProofItem[];
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
  aboutSimone: {
    title: string;
    body: string;
    bullets: string[];
  };
  ctaBand: {
    title: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
}

export const homepageContent: HomepageContent = {
  bottomQuickNav: [
    { label: 'Hjem', href: '/', kind: 'link' },
    { label: 'Om', href: '/om', kind: 'link' },
    { label: 'Tjenester', href: '/tjenester', kind: 'link' },
    { label: 'Booking', href: '/booking', kind: 'link' },
    { label: 'Kontakt', href: '/kontakt', kind: 'link' },
  ],
  menuGroups: [
    {
      title: 'Sider',
      items: [
        { label: 'Hjem', href: '/' },
        { label: 'Om', href: '/om' },
        { label: 'Tjenester', href: '/tjenester' },
        { label: 'Booking', href: '/booking' },
        { label: 'Kontakt', href: '/kontakt' },
      ],
    },
  ],
  hero: {
    kicker: 'Sound of Simone',
    title: 'En ny standard for fysioterapi innen kvinnehelse',
    lead:
      'Trygg og tydelig oppfolging for underlivsplager, vaginisme, fertilitet og helhetlig kvinnehelse.',
    image: {
      src: '/images/simone-hero-placeholder.svg',
      webpSrc: '/images/simone-hero-placeholder.webp',
      alt: 'Portrett av Simone (midlertidig bilde inntil godkjent foto er levert)',
    },
    primaryCtaLabel: 'Bestill time',
    secondaryCtaLabel: 'Kontakt',
  },
  proofItems: claimItems.map((item) => ({
    label: item.label,
    value: item.value,
    verified: item.verified,
  })),
  booking: {
    title: 'Bestill via kontakt i denne fasen',
    lead:
      'Physica-integrasjon planlegges i neste fase. Inntil da handteres bestilling raskt via kontaktseksjonen.',
    statusLabel: 'Booking handteres manuelt via kontakt',
    ctaLabel: 'Bestill time',
  },
  contact: {
    title: 'Kontakt Sound of Simone',
    lead: 'Ta kontakt direkte pa e-post eller telefon for foresporsel, vurdering eller booking.',
    email: 'Hei@soundofsimone.no',
    phoneDisplay: '911 70 100',
    phoneLink: '91170100',
  },
  aboutSimone: {
    title: 'Om Simone',
    body:
      'Simone kombinerer klinisk erfaring, fagformidling og strukturert pasientoppfolging med fokus pa kvinnehelse.',
    bullets: [
      'Faglig fokus pa underlivsplager og kvinnehelse',
      'Erfaring med foredrag og undervisning for fagmiljoer',
      'Trygg, tydelig og individuelt tilpasset behandlingsprosess',
    ],
  },
  ctaBand: {
    title: 'Klar for neste steg?',
    primaryLabel: 'Bestill time',
    secondaryLabel: 'Kontakt',
  },
};
