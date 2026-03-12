import siteSettingsData from '../data/site-settings.json';

export interface NavItem {
  label: string;
  href: string;
}

export interface QuickNavItem extends NavItem {
  kind: 'link' | 'menu';
}

export interface MenuGroup {
  title: string;
  items: NavItem[];
}

export interface SiteSettings {
  brand: {
    name: string;
    tagline: string;
    logoAriaLabel: string;
    homeLinkAriaLabel: string;
  };
  seo: {
    defaultTitle: string;
    titleSuffix: string;
    description: string;
  };
  localization: {
    mode: 'single' | 'bilingual';
    defaultLocale: string;
    locales: string[];
  };
  theme: {
    preset: string;
    tokens: {
      brandColor: string;
    };
  };
  navigation: {
    logoHomeHref: string;
    bookingUrl: string;
    waveContactTarget: string;
    waveEmbedSrc: string;
    waveEmbedAnimated: string;
    waveEmbedStatic: string;
    bottomQuickNav: QuickNavItem[];
    menuGroups: MenuGroup[];
    servicesMenuLinks: NavItem[];
  };
  contact: {
    email: string;
    phoneDisplay: string;
    phoneLink: string;
    address?: string;
  };
  booking: {
    title: string;
    lead: string;
    statusLabel: string;
    ctaLabel: string;
  };
  footer: {
    legalText: string;
  };
}

export const siteSettings = siteSettingsData as SiteSettings;
