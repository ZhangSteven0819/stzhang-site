#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_CONFIG_PATH,
  validateClientConfig,
  renderClientFiles,
} from './render-client-config.mjs';

export const REQUIRED_FLAGS = [
  'client-id',
  'brand-name',
  'repo-owner',
  'repo-name',
  'prod-domain',
  'dev-domain',
  'cms-proxy-domain',
  'language-mode',
  'default-locale',
  'theme-preset',
];

export const MODULE_TYPES = [
  'hero',
  'proof_strip',
  'service_cards',
  'rich_text',
  'gallery',
  'cta_band',
  'contact_block',
  'social_feed',
];

const NON_SOCIAL_MODULE_TYPES = MODULE_TYPES.filter((type) => type !== 'social_feed');

export const THEME_PRESETS = {
  wellness: { brandColor: '#411e25' },
  ocean: { brandColor: '#0e4f60' },
  sunrise: { brandColor: '#9e4a2d' },
  minimal: { brandColor: '#1f2937' },
};

function parseArgs(argv) {
  const options = {
    flags: {},
    dryRun: false,
    force: false,
    configPath: DEFAULT_CONFIG_PATH,
    secondaryLocale: 'en',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg.startsWith('--config=')) {
      options.configPath = arg.slice('--config='.length);
      continue;
    }

    if (arg === '--config') {
      const next = argv[index + 1];
      if (!next) throw new Error('--config requires a value');
      options.configPath = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--secondary-locale=')) {
      options.secondaryLocale = arg.slice('--secondary-locale='.length);
      continue;
    }

    if (arg === '--secondary-locale') {
      const next = argv[index + 1];
      if (!next) throw new Error('--secondary-locale requires a value');
      options.secondaryLocale = next;
      index += 1;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    const [key, inlineValue] = arg.slice(2).split('=');
    if (inlineValue !== undefined) {
      options.flags[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`--${key} requires a value`);
    }

    options.flags[key] = next;
    index += 1;
  }

  return options;
}

function normalizePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

export function validateHostname(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }

  if (value.includes('http://') || value.includes('https://') || value.includes('/')) {
    throw new Error(`${label} must be a hostname without protocol/path`);
  }

  if (!/^[a-zA-Z0-9.-]+$/.test(value)) {
    throw new Error(`${label} contains invalid characters`);
  }
}

function assertRequiredFlags(flags) {
  const missing = REQUIRED_FLAGS.filter((flagName) => {
    const value = flags[flagName];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required flags: ${missing.map((flag) => `--${flag}`).join(', ')}`);
  }
}

function ensureWritable(filePath, options) {
  if (options.force || options.dryRun) return;
  if (fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite existing file without --force: ${path.relative(process.cwd(), filePath)}`);
  }
}

function writeJson(filePath, value, options) {
  const content = `${JSON.stringify(value, null, 2)}\n`;

  if (options.dryRun) {
    console.log(`[dry-run] Would write ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), filePath)}`);
}

function writeText(filePath, value, options) {
  if (options.dryRun) {
    console.log(`[dry-run] Would write ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), filePath)}`);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeModuleSelection(selection) {
  if (!Array.isArray(selection)) {
    return new Set(NON_SOCIAL_MODULE_TYPES);
  }

  const cleaned = selection
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => MODULE_TYPES.includes(value));

  if (cleaned.length === 0) {
    return new Set(NON_SOCIAL_MODULE_TYPES);
  }

  return new Set(cleaned);
}

function hasValidTaggboxWidgetId(widgetId) {
  return typeof widgetId === 'string' && /^[A-Za-z0-9_-]{5,120}$/.test(widgetId);
}

export function createBaseCopy(defaultLocale) {
  const locale = defaultLocale.toLowerCase();
  const norwegian = locale.startsWith('no') || locale.startsWith('nb') || locale.startsWith('nn');

  if (norwegian) {
    return {
      heroTitle: 'En tydelig tjenesteopplevelse for dine kunder',
      heroLead: 'Bruk denne templaten til rask lansering med god struktur for innhold, design og konvertering.',
      bookingTitle: 'Book via kontakt i denne fasen',
      bookingLead: 'Direkte bookingintegrasjon kan kobles pa i neste fase.',
      bookingStatus: 'Booking handteres manuelt via kontakt',
      contactTitle: 'Kontakt oss',
      contactLead: 'Ta kontakt for sporsmal, bestilling eller samarbeid.',
      footerLegal: 'Alle rettigheter forbeholdt.',
      ctaTitle: 'Klar for neste steg?',
      ctaPrimary: 'Bestill time',
      ctaSecondary: 'Kontakt',
      servicesLead: 'Tjenester presentert som modulaere kort med tydelige CTA-er.',
      aboutTitle: 'Om oss',
      aboutIngress: 'Denne seksjonen er modulbasert og kan tilpasses per kunde direkte i CMS.',
      homeTitle: 'Rask launch-template',
      homeTagline: 'Design- og innholdssystem for raske leveranser',
      socialTitle: 'Folg oss i sosiale medier',
      socialLead: 'Innhold fra sosiale medier kan vises her.',
    };
  }

  return {
    heroTitle: 'A clear service experience for your customers',
    heroLead: 'Use this template for rapid launches with strong content, design, and conversion structure.',
    bookingTitle: 'Book through contact in this phase',
    bookingLead: 'A direct booking integration can be added in the next phase.',
    bookingStatus: 'Booking is handled manually through contact',
    contactTitle: 'Contact us',
    contactLead: 'Reach out for questions, booking, or partnerships.',
    footerLegal: 'All rights reserved.',
    ctaTitle: 'Ready for the next step?',
    ctaPrimary: 'Book now',
    ctaSecondary: 'Contact',
    servicesLead: 'Services are presented as modular cards with clear CTAs.',
    aboutTitle: 'About us',
    aboutIngress: 'This section is module-driven and can be tailored per client directly in CMS.',
    homeTitle: 'Rapid launch template',
    homeTagline: 'Design and content system for fast delivery',
    socialTitle: 'Follow us on social media',
    socialLead: 'Social content can be displayed here.',
  };
}

export function createSiteSettings({
  brandName,
  defaultLocale,
  languageMode,
  locales,
  themePreset,
  brandColor,
  meetingInput,
}) {
  const copy = createBaseCopy(defaultLocale);
  const contact = meetingInput?.contact ?? {};

  return {
    brand: {
      name: brandName,
      tagline: copy.homeTagline,
      logoAriaLabel: brandName,
      homeLinkAriaLabel: defaultLocale.startsWith('n') ? 'Ga til forsiden' : 'Go to homepage',
    },
    seo: {
      defaultTitle: `${brandName} - ${copy.homeTagline}`,
      titleSuffix: brandName,
      description: copy.heroLead,
    },
    localization: {
      mode: languageMode,
      defaultLocale,
      locales,
    },
    theme: {
      preset: themePreset,
      tokens: {
        brandColor,
      },
    },
    navigation: {
      logoHomeHref: '/',
      bookingUrl: '/booking',
      waveContactTarget: '/kontakt',
      waveEmbedSrc: '/wave-simone.html',
      waveEmbedAnimated: '/wave-simone.html?mode=animated',
      waveEmbedStatic: '/wave-simone.html?mode=static',
      bottomQuickNav: [
        { label: defaultLocale.startsWith('n') ? 'Tjenester' : 'Services', href: '/tjenester', kind: 'menu' },
        { label: defaultLocale.startsWith('n') ? 'Book time' : 'Book now', href: '/booking', kind: 'link' },
        { label: defaultLocale.startsWith('n') ? 'Kontakt' : 'Contact', href: '/kontakt', kind: 'link' },
      ],
      menuGroups: [
        {
          title: defaultLocale.startsWith('n') ? 'Hoved' : 'Main',
          items: [
            { label: defaultLocale.startsWith('n') ? 'Hjem' : 'Home', href: '/' },
            { label: defaultLocale.startsWith('n') ? 'Om' : 'About', href: '/om' },
          ],
        },
      ],
      servicesMenuLinks: [
        { label: 'Service A', href: '/tjenester/sound-of-physio' },
        { label: 'Service B', href: '/tjenester/sound-of-women' },
        { label: 'Service C', href: '/tjenester/sound-of-waves' },
      ],
    },
    contact: {
      email: isNonEmptyString(contact.email)
        ? contact.email
        : `hei@${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '')}.no`,
      phoneDisplay: isNonEmptyString(contact.phoneDisplay) ? contact.phoneDisplay : '99 99 99 99',
      phoneLink: isNonEmptyString(contact.phoneLink)
        ? contact.phoneLink.replace(/[^0-9+]/g, '')
        : '99999999',
      address: isNonEmptyString(contact.address) ? contact.address : '',
    },
    booking: {
      title: copy.bookingTitle,
      lead: copy.bookingLead,
      statusLabel: copy.bookingStatus,
      ctaLabel: copy.ctaPrimary,
    },
    footer: {
      legalText: copy.footerLegal,
    },
  };
}

export function createHomeModules({ brandName, defaultLocale, meetingInput }) {
  const copy = createBaseCopy(defaultLocale);
  const moduleSelection = normalizeModuleSelection(meetingInput?.moduleSelection);

  const socialFeedInput = meetingInput?.socialFeed ?? {};
  const socialFeedEnabled =
    moduleSelection.has('social_feed') &&
    socialFeedInput.enabled === true &&
    socialFeedInput.provider === 'taggbox' &&
    hasValidTaggboxWidgetId(socialFeedInput.widgetId);

  return {
    modules: [
      {
        id: 'hero-main',
        type: 'hero',
        enabled: moduleSelection.has('hero'),
        variant: 'standard',
        order: 10,
        kicker: brandName,
        title: copy.heroTitle,
        lead: copy.heroLead,
        image: {
          src: '/images/simone-hero-portrait.jpg',
          webpSrc: '/images/simone-hero-portrait.webp',
          alt: defaultLocale.startsWith('n') ? 'Hero-bilde' : 'Hero image',
        },
        primaryCtaLabel: copy.ctaPrimary,
        secondaryCtaLabel: copy.ctaSecondary,
      },
      {
        id: 'proof-main',
        type: 'proof_strip',
        enabled: moduleSelection.has('proof_strip'),
        variant: 'standard',
        order: 20,
        items: [
          {
            id: 'proof-1',
            label: defaultLocale.startsWith('n') ? 'Faglig ramme' : 'Professional scope',
            value: defaultLocale.startsWith('n')
              ? 'Dokumentert metodikk og tydelig leveranse'
              : 'Documented methodology and clear delivery',
            verified: true,
            sourceNote: 'Template baseline',
          },
          {
            id: 'proof-2',
            label: defaultLocale.startsWith('n') ? 'Tilgjengelighet' : 'Availability',
            value: defaultLocale.startsWith('n')
              ? 'Direkte kontakt via e-post og telefon'
              : 'Direct contact by email and phone',
            verified: true,
            sourceNote: 'Template baseline',
          },
        ],
      },
      {
        id: 'services-main',
        type: 'service_cards',
        enabled: moduleSelection.has('service_cards'),
        variant: 'standard',
        order: 30,
        cards: [
          {
            id: 'physio',
            title: 'Service A',
            lead: copy.servicesLead,
            moreTopics: [
              defaultLocale.startsWith('n') ? 'Tema 1' : 'Topic 1',
              defaultLocale.startsWith('n') ? 'Tema 2' : 'Topic 2',
            ],
          },
          {
            id: 'women',
            title: 'Service B',
            lead: copy.servicesLead,
            blocks: [
              {
                title: defaultLocale.startsWith('n') ? 'Eksempelblokk' : 'Example block',
                body: defaultLocale.startsWith('n')
                  ? 'Bytt ut med kundeinnhold i CMS.'
                  : 'Replace with client content in CMS.',
                ctaLabel: copy.ctaSecondary,
                ctaHref: '/kontakt',
                ctaPending: false,
              },
            ],
          },
          {
            id: 'waves',
            title: 'Service C',
            lead: copy.servicesLead,
            launchLabel: defaultLocale.startsWith('n') ? 'Kommer snart' : 'Coming soon',
          },
        ],
      },
      {
        id: 'rich-about',
        type: 'rich_text',
        enabled: moduleSelection.has('rich_text'),
        variant: 'standard',
        order: 40,
        title: copy.aboutTitle,
        name: brandName,
        ingress: copy.aboutIngress,
        primaryCtaLabel: copy.ctaPrimary,
        roles: [
          defaultLocale.startsWith('n') ? 'Fagperson' : 'Specialist',
          defaultLocale.startsWith('n') ? 'Radgiver' : 'Advisor',
        ],
        journey: [
          defaultLocale.startsWith('n')
            ? 'Dette er starttekst for kundehistorie. Oppdateres i CMS.'
            : 'This is starter story text for the client. Edit in CMS.',
        ],
        education: [defaultLocale.startsWith('n') ? 'Utdanning' : 'Education'],
        courses: [defaultLocale.startsWith('n') ? 'Kurs' : 'Courses'],
      },
      {
        id: 'gallery-about',
        type: 'gallery',
        enabled: moduleSelection.has('gallery'),
        variant: 'standard',
        order: 50,
        items: [
          {
            src: '/images/om-workshop-circle.jpg',
            alt: defaultLocale.startsWith('n') ? 'Galleri bilde 1' : 'Gallery image 1',
            caption: defaultLocale.startsWith('n') ? 'Bildetekst 1' : 'Caption 1',
            kind: 'photo',
          },
        ],
      },
      {
        id: 'contact-main',
        type: 'contact_block',
        enabled: moduleSelection.has('contact_block'),
        variant: 'standard',
        order: 60,
        title: copy.contactTitle,
        lead: copy.contactLead,
        email: isNonEmptyString(meetingInput?.contact?.email) ? meetingInput.contact.email : 'hei@example.no',
        phoneDisplay: isNonEmptyString(meetingInput?.contact?.phoneDisplay)
          ? meetingInput.contact.phoneDisplay
          : '99 99 99 99',
        phoneLink: isNonEmptyString(meetingInput?.contact?.phoneLink)
          ? meetingInput.contact.phoneLink.replace(/[^0-9+]/g, '')
          : '99999999',
        address: isNonEmptyString(meetingInput?.contact?.address) ? meetingInput.contact.address : '',
      },
      {
        id: 'social-main',
        type: 'social_feed',
        enabled: socialFeedEnabled,
        variant: 'standard',
        order: 65,
        provider: 'taggbox',
        widgetId: socialFeedEnabled ? socialFeedInput.widgetId : '',
        profileSources: Array.isArray(socialFeedInput.profileSources)
          ? socialFeedInput.profileSources.filter((item) => typeof item === 'string' && item.trim().length > 0)
          : [],
        refreshCadence: isNonEmptyString(socialFeedInput.refreshCadence)
          ? socialFeedInput.refreshCadence
          : 'daily',
        title: isNonEmptyString(socialFeedInput.title) ? socialFeedInput.title : copy.socialTitle,
        lead: isNonEmptyString(socialFeedInput.lead) ? socialFeedInput.lead : copy.socialLead,
      },
      {
        id: 'cta-main',
        type: 'cta_band',
        enabled: moduleSelection.has('cta_band'),
        variant: 'standard',
        order: 70,
        title: copy.ctaTitle,
        primaryLabel: copy.ctaPrimary,
        secondaryLabel: copy.ctaSecondary,
      },
    ],
  };
}

function buildOnboardingChecklist({ config }) {
  const siteOrigin = `https://${config.domains.production}`;
  const devOrigin = `https://${config.domains.dev}`;
  const proxyOrigin = `https://${config.domains.cmsProxy}`;

  return `# Client Onboarding Checklist (${config.brandName})

## Generated Setup
- Client ID: \`${config.clientId}\`
- Repo: \`${config.repository.owner}/${config.repository.name}\`
- Production domain: \`${config.domains.production}\`
- DEV domain: \`${config.domains.dev}\`
- CMS proxy domain: \`${config.domains.cmsProxy}\`
- Cloudflare DEV project: \`${config.cloudflare.pagesProjectDev}\`
- Cloudflare PROD project: \`${config.cloudflare.pagesProjectProd}\`

## Required Cloudflare/GitHub Variables
- GitHub Actions variable: \`CF_PAGES_DEV_PROJECT=${config.cloudflare.pagesProjectDev}\`
- GitHub Actions variable: \`CF_PAGES_PROD_PROJECT=${config.cloudflare.pagesProjectProd}\`
- Org-level GitHub Actions secret: \`CLOUDFLARE_API_TOKEN\`
- Org-level GitHub Actions secret: \`CLOUDFLARE_ACCOUNT_ID\`
- Worker secret: \`GITHUB_CLIENT_ID\`
- Worker secret: \`GITHUB_CLIENT_SECRET\`
- Worker var \`ALLOWED_ORIGINS\` must include production + localhost:
  - \`${siteOrigin}\`
  - \`https://www.${config.domains.production}\`
  - \`http://localhost:4321\`
- Worker DEV policy handles \`*-dev.pages.dev\` origins automatically.

## New Client Smoke Test
1. \`npm run client:validate\`
2. \`npm run build\`
3. \`./scripts/deploy-dev.sh\`
4. \`DEV_DOMAIN=${config.domains.dev} PROXY_DOMAIN=${config.domains.cmsProxy} ./scripts/verify-deployment.sh\`
5. Check URLs:
   - \`${devOrigin}/\`
   - \`${devOrigin}/admin/\`
   - \`${proxyOrigin}/health\`
   - \`${proxyOrigin}/auth?origin=${siteOrigin}\`

## Ops Routine for Shared OAuth Worker
1. Add customer origins to \`ALLOWED_ORIGINS\`.
2. Redeploy worker: \`cd decap-proxy && npm run deploy\`.
3. Verify \`/health\` and \`/auth?origin=...\`.
`;
}

function validateLanguageMode(languageMode) {
  if (!['single', 'bilingual'].includes(languageMode)) {
    throw new Error('--language-mode must be "single" or "bilingual"');
  }
}

function buildBootstrapConfig(flags, secondaryLocale) {
  assertRequiredFlags(flags);
  validateLanguageMode(flags['language-mode']);

  validateHostname(flags['prod-domain'], '--prod-domain');
  validateHostname(flags['dev-domain'], '--dev-domain');
  validateHostname(flags['cms-proxy-domain'], '--cms-proxy-domain');

  const presetName = flags['theme-preset'];
  const presetTokens = THEME_PRESETS[presetName] ?? THEME_PRESETS.wellness;
  const defaultLocale = flags['default-locale'];
  const languageMode = flags['language-mode'];

  const locales = languageMode === 'single'
    ? [defaultLocale]
    : [defaultLocale, secondaryLocale].filter((value, index, array) => array.indexOf(value) === index);

  const config = {
    clientId: flags['client-id'],
    brandName: flags['brand-name'],
    repository: {
      owner: flags['repo-owner'],
      name: flags['repo-name'],
      branch: 'main',
    },
    domains: {
      production: flags['prod-domain'],
      dev: flags['dev-domain'],
      cmsProxy: flags['cms-proxy-domain'],
    },
    cloudflare: {
      pagesProjectDev: `${flags['client-id']}-dev`,
      pagesBranchDev: 'main',
      pagesProjectProd: `${flags['client-id']}-main`,
      pagesBranchProd: 'main',
    },
    cms: {
      publishMode: 'simple',
      siteOrigin: `https://${flags['dev-domain']}`,
      displayOrigin: `https://${flags['dev-domain']}`,
      mediaFolder: 'public/images',
      publicFolder: '/images',
    },
    localization: {
      mode: languageMode,
      defaultLocale,
      locales,
    },
    theme: {
      preset: presetName,
      tokens: {
        brandColor: presetTokens.brandColor,
      },
    },
  };

  const validationErrors = validateClientConfig(config);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.map((error) => `- ${error}`).join('\n'));
  }

  return config;
}

export function bootstrapClient({
  flags,
  dryRun = false,
  force = false,
  configPath = DEFAULT_CONFIG_PATH,
  secondaryLocale = 'en',
  meetingInput = null,
}) {
  const options = { dryRun, force };
  const config = buildBootstrapConfig(flags, secondaryLocale);

  const resolvedConfigPath = normalizePath(configPath);
  const siteSettingsPath = normalizePath('src/data/site-settings.json');
  const homeModulesPath = normalizePath('src/data/page-modules/home.json');
  const checklistPath = normalizePath('docs/client/onboarding-checklist.md');

  ensureWritable(resolvedConfigPath, options);
  ensureWritable(siteSettingsPath, options);
  ensureWritable(homeModulesPath, options);
  ensureWritable(checklistPath, options);

  const siteSettings = createSiteSettings({
    brandName: config.brandName,
    defaultLocale: config.localization.defaultLocale,
    languageMode: config.localization.mode,
    locales: config.localization.locales,
    themePreset: config.theme.preset,
    brandColor: config.theme.tokens.brandColor,
    meetingInput,
  });

  const homeModules = createHomeModules({
    brandName: config.brandName,
    defaultLocale: config.localization.defaultLocale,
    meetingInput,
  });

  writeJson(resolvedConfigPath, config, options);
  writeJson(siteSettingsPath, siteSettings, options);
  writeJson(homeModulesPath, homeModules, options);
  writeText(checklistPath, buildOnboardingChecklist({ config }), options);

  const rendered = renderClientFiles(config, { dryRun });

  return {
    config,
    siteSettings,
    homeModules,
    generatedFiles: [
      path.relative(process.cwd(), resolvedConfigPath),
      path.relative(process.cwd(), siteSettingsPath),
      path.relative(process.cwd(), homeModulesPath),
      path.relative(process.cwd(), checklistPath),
      ...rendered.map((file) => file.relativeOutputPath),
    ],
  };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));

    bootstrapClient({
      flags: options.flags,
      dryRun: options.dryRun,
      force: options.force,
      configPath: options.configPath,
      secondaryLocale: options.secondaryLocale,
    });

    console.log('Bootstrap completed.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (entryFilePath === currentFilePath) {
  main();
}
