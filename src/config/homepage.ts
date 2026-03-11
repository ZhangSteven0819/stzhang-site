import homeModulesData from '../data/page-modules/home.json';
import { siteSettings } from './site-settings';

export type ModuleVariant = 'compact' | 'standard' | 'expanded';

interface BaseModule {
  id: string;
  enabled: boolean;
  variant: ModuleVariant;
  order: number;
}

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

export interface HomepageServiceWomenBlock {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  ctaPending: boolean;
}

export interface HomepageProofItem {
  id: string;
  label: string;
  value: string;
  verified: boolean;
  sourceNote: string;
}

export interface HeroModule extends BaseModule {
  type: 'hero';
  kicker?: string;
  title: string;
  lead: string;
  image: {
    src: string;
    webpSrc: string;
    alt: string;
  };
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface ProofStripModule extends BaseModule {
  type: 'proof_strip';
  items: HomepageProofItem[];
}

export interface ServiceCard {
  id: string;
  title: string;
  lead: string;
  moreTopics?: string[];
  blocks?: HomepageServiceWomenBlock[];
  launchLabel?: string;
}

export interface ServiceCardsModule extends BaseModule {
  type: 'service_cards';
  cards: ServiceCard[];
}

export interface RichTextModule extends BaseModule {
  type: 'rich_text';
  title: string;
  name: string;
  ingress: string;
  primaryCtaLabel: string;
  roles: string[];
  journey: string[];
  education: string[];
  courses: string[];
}

export interface GalleryModule extends BaseModule {
  type: 'gallery';
  items: {
    src: string;
    alt: string;
    caption: string;
    kind: 'photo' | 'book';
  }[];
}

export interface CtaBandModule extends BaseModule {
  type: 'cta_band';
  title: string;
  primaryLabel: string;
  secondaryLabel: string;
}

export interface ContactBlockModule extends BaseModule {
  type: 'contact_block';
  title: string;
  lead: string;
  email: string;
  phoneDisplay: string;
  phoneLink: string;
  address?: string;
}

export interface SocialFeedModule extends BaseModule {
  type: 'social_feed';
  provider: 'taggbox';
  widgetId: string;
  profileSources?: Array<string | { source: string }>;
  refreshCadence?: string;
  title?: string;
  lead?: string;
}

export type HomepageModule =
  | HeroModule
  | ProofStripModule
  | ServiceCardsModule
  | RichTextModule
  | GalleryModule
  | CtaBandModule
  | ContactBlockModule
  | SocialFeedModule;

interface HomeModulesData {
  modules: HomepageModule[];
}

export interface HomepageContent {
  bottomQuickNav: HomepageQuickNavItem[];
  menuGroups: HomepageMenuGroup[];
  hero: {
    kicker?: string;
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
    name: string;
    ingress: string;
    roles: string[];
    primaryCtaLabel: string;
    contact: {
      email: string;
      phoneDisplay: string;
      phoneLink: string;
    };
    journey: string[];
    education: string[];
    courses: string[];
    gallery: {
      src: string;
      alt: string;
      caption: string;
      kind: 'photo' | 'book';
    }[];
  };
  services: {
    physio: {
      title: string;
      lead: string;
      moreTopics: string[];
    };
    women: {
      title: string;
      lead: string;
      blocks: HomepageServiceWomenBlock[];
    };
    waves: {
      title: string;
      lead: string;
      launchLabel: string;
    };
  };
  ctaBand: {
    title: string;
    primaryLabel: string;
    secondaryLabel: string;
  };
  socialFeed: {
    enabled: boolean;
    provider: 'taggbox';
    widgetId: string;
    profileSources: string[];
    refreshCadence: string;
    title: string;
    lead: string;
  };
}

const moduleSource = ((homeModulesData as HomeModulesData).modules ?? [])
  .filter((module) => module.enabled)
  .sort((left, right) => left.order - right.order);

function getModule<TType extends HomepageModule['type']>(type: TType): Extract<HomepageModule, { type: TType }> | undefined {
  return moduleSource.find((module) => module.type === type) as Extract<HomepageModule, { type: TType }> | undefined;
}

function getServiceCard(cards: ServiceCard[], cardId: string): ServiceCard | undefined {
  return cards.find((card) => card.id === cardId);
}

const heroModule = getModule('hero');
const proofModule = getModule('proof_strip');
const serviceModule = getModule('service_cards');
const richTextModule = getModule('rich_text');
const galleryModule = getModule('gallery');
const ctaBandModule = getModule('cta_band');
const contactModule = getModule('contact_block');
const socialFeedModule = getModule('social_feed');

const serviceCards = serviceModule?.cards ?? [];
const physio = getServiceCard(serviceCards, 'physio') ?? serviceCards[0];
const women = getServiceCard(serviceCards, 'women') ?? serviceCards[1];
const waves = getServiceCard(serviceCards, 'waves') ?? serviceCards[2];
const resolvedContactEmail = contactModule?.email ?? siteSettings.contact.email;
const resolvedContactPhoneDisplay = contactModule?.phoneDisplay ?? siteSettings.contact.phoneDisplay;
const resolvedContactPhoneLink = contactModule?.phoneLink ?? siteSettings.contact.phoneLink;
const resolvedContactAddress = contactModule?.address || siteSettings.contact.address;
const isTaggboxWidgetIdValid =
  typeof socialFeedModule?.widgetId === 'string' &&
  /^[A-Za-z0-9_-]{5,120}$/.test(socialFeedModule.widgetId);

export const homepageModules: HomepageModule[] = moduleSource;

export const homepageContent: HomepageContent = {
  bottomQuickNav: siteSettings.navigation.bottomQuickNav,
  menuGroups: siteSettings.navigation.menuGroups,
  hero: {
    kicker: heroModule?.kicker,
    title: heroModule?.title ?? siteSettings.brand.name,
    lead: heroModule?.lead ?? siteSettings.seo.description,
    image: {
      src: heroModule?.image.src ?? '/images/simone-hero-portrait.jpg',
      webpSrc: heroModule?.image.webpSrc ?? '/images/simone-hero-portrait.webp',
      alt: heroModule?.image.alt ?? siteSettings.brand.name,
    },
    primaryCtaLabel: heroModule?.primaryCtaLabel ?? siteSettings.booking.ctaLabel,
    secondaryCtaLabel: heroModule?.secondaryCtaLabel ?? 'Kontakt',
  },
  proofItems: proofModule?.items ?? [],
  booking: siteSettings.booking,
  contact: {
    title: contactModule?.title ?? `Kontakt ${siteSettings.brand.name}`,
    lead: contactModule?.lead ?? 'Ta kontakt for foresporsel, vurdering eller booking.',
    email: resolvedContactEmail,
    phoneDisplay: resolvedContactPhoneDisplay,
    phoneLink: resolvedContactPhoneLink,
    address: resolvedContactAddress,
  },
  aboutSimone: {
    title: richTextModule?.title ?? 'Om oss',
    name: richTextModule?.name ?? siteSettings.brand.name,
    ingress: richTextModule?.ingress ?? siteSettings.seo.description,
    roles: richTextModule?.roles ?? [],
    primaryCtaLabel: richTextModule?.primaryCtaLabel ?? siteSettings.booking.ctaLabel,
    contact: {
      email: resolvedContactEmail,
      phoneDisplay: resolvedContactPhoneDisplay,
      phoneLink: resolvedContactPhoneLink,
    },
    journey: richTextModule?.journey ?? [],
    education: richTextModule?.education ?? [],
    courses: richTextModule?.courses ?? [],
    gallery: galleryModule?.items ?? [],
  },
  services: {
    physio: {
      title: physio?.title ?? 'Service 1',
      lead: physio?.lead ?? '',
      moreTopics: physio?.moreTopics ?? [],
    },
    women: {
      title: women?.title ?? 'Service 2',
      lead: women?.lead ?? '',
      blocks: women?.blocks ?? [],
    },
    waves: {
      title: waves?.title ?? 'Service 3',
      lead: waves?.lead ?? '',
      launchLabel: waves?.launchLabel ?? '',
    },
  },
  ctaBand: {
    title: ctaBandModule?.title ?? 'Klar for neste steg?',
    primaryLabel: ctaBandModule?.primaryLabel ?? siteSettings.booking.ctaLabel,
    secondaryLabel: ctaBandModule?.secondaryLabel ?? 'Kontakt',
  },
  socialFeed: {
    enabled:
      socialFeedModule?.provider === 'taggbox' &&
      isTaggboxWidgetIdValid &&
      socialFeedModule.enabled === true,
    provider: 'taggbox',
    widgetId: isTaggboxWidgetIdValid ? socialFeedModule.widgetId : '',
    profileSources: Array.isArray(socialFeedModule?.profileSources)
      ? socialFeedModule.profileSources
          .map((source) => {
            if (typeof source === 'string') return source;
            if (source && typeof source === 'object' && 'source' in source && typeof source.source === 'string') {
              return source.source;
            }
            return '';
          })
          .filter((source) => source.trim().length > 0)
      : [],
    refreshCadence:
      typeof socialFeedModule?.refreshCadence === 'string' && socialFeedModule.refreshCadence.trim().length > 0
        ? socialFeedModule.refreshCadence
        : 'daily',
    title:
      typeof socialFeedModule?.title === 'string' && socialFeedModule.title.trim().length > 0
        ? socialFeedModule.title
        : 'Folg oss i sosiale medier',
    lead:
      typeof socialFeedModule?.lead === 'string' && socialFeedModule.lead.trim().length > 0
        ? socialFeedModule.lead
        : 'Oppdatert feed fra sosiale plattformer.',
  },
};
