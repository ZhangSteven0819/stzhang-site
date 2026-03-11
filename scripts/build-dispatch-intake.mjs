#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { MODULE_TYPES, THEME_PRESETS, validateHostname } from './bootstrap-client.mjs';

const DEFAULT_MODULE_SELECTION = [
  'hero',
  'proof_strip',
  'service_cards',
  'rich_text',
  'gallery',
  'contact_block',
  'cta_band',
];

const VALID_MODES = new Set(['onboard', 'go_live', 'domain_ready']);
const VALID_LANGUAGE_MODES = new Set(['single', 'bilingual']);
const VALID_EDITING_LEVELS = new Set(['low', 'medium', 'high']);
const DEFAULT_CMS_PROXY_DOMAIN = process.env.DEFAULT_CMS_PROXY_DOMAIN || 'decap.soundofsimone.no';

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    if (arg.includes('=')) {
      const [key, value] = arg.slice(2).split('=');
      options[key] = value ?? '';
      continue;
    }

    const key = arg.slice(2);
    const next = argv[index + 1];

    if (next === undefined || next.startsWith('--')) {
      options[key] = '';
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function toAbsolutePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeString(value, fallback = '') {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (!isNonEmptyString(value)) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'ja'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'nei'].includes(normalized)) return false;
  return fallback;
}

function normalizeCsv(value) {
  if (!isNonEmptyString(value)) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeModuleSelection(value) {
  const entries = normalizeCsv(value);
  if (entries.length === 0) return [...DEFAULT_MODULE_SELECTION];

  const unique = [];
  for (const entry of entries) {
    if (!MODULE_TYPES.includes(entry)) continue;
    if (!unique.includes(entry)) unique.push(entry);
  }

  return unique.length > 0 ? unique : [...DEFAULT_MODULE_SELECTION];
}

function hasValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasValidTaggboxWidgetId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{5,120}$/.test(value);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assertMode(mode) {
  if (!VALID_MODES.has(mode)) {
    throw new Error(`--mode must be one of: ${Array.from(VALID_MODES).join(', ')}`);
  }
}

function canonicalMode(mode) {
  if (mode === 'domain_ready') return 'go_live';
  return mode;
}

function resolveOutputPath(clientId, outputPathArg) {
  if (isNonEmptyString(outputPathArg)) {
    return toAbsolutePath(outputPathArg.trim());
  }
  return toAbsolutePath(path.join('config/intake', `${clientId}.json`));
}

function resolveLanguageMode(value) {
  const languageMode = normalizeString(value, 'single');
  if (!VALID_LANGUAGE_MODES.has(languageMode)) {
    throw new Error('--language-mode must be single or bilingual');
  }
  return languageMode;
}

function resolveOwnEditingLevel(value) {
  const ownEditingLevel = normalizeString(value, 'medium');
  if (!VALID_EDITING_LEVELS.has(ownEditingLevel)) {
    throw new Error('--own-editing-level must be low, medium, or high');
  }
  return ownEditingLevel;
}

function resolveThemePreset(value) {
  const themePreset = normalizeString(value, 'wellness');
  if (!(themePreset in THEME_PRESETS)) {
    throw new Error(`--theme-preset must be one of: ${Object.keys(THEME_PRESETS).join(', ')}`);
  }
  return themePreset;
}

function buildOnboardIntake(options) {
  const clientId = normalizeString(options['client-id']);
  if (!clientId) throw new Error('--client-id is required');

  const brandName = normalizeString(options['brand-name']);
  if (!brandName) throw new Error('--brand-name is required for mode=onboard');

  const repoOwner = normalizeString(options['repo-owner'], process.env.GITHUB_REPOSITORY_OWNER || '');
  if (!repoOwner) throw new Error('--repo-owner is required (or set GITHUB_REPOSITORY_OWNER)');

  const repoName = normalizeString(options['repo-name'], `${clientId}-site`);

  const productionDomain = normalizeString(options['production-domain'], 'pending-domain.example');
  const devDomain = normalizeString(options['dev-domain'], `${clientId}-dev.pages.dev`);
  const cmsProxyDomain = normalizeString(options['cms-proxy-domain'], DEFAULT_CMS_PROXY_DOMAIN);

  validateHostname(productionDomain, '--production-domain');
  validateHostname(devDomain, '--dev-domain');
  validateHostname(cmsProxyDomain, '--cms-proxy-domain');

  const languageMode = resolveLanguageMode(options['language-mode']);
  const defaultLocale = normalizeString(options['default-locale'], 'nb');
  const secondaryLocale = normalizeString(options['secondary-locale'], 'en');
  const themePreset = resolveThemePreset(options['theme-preset']);

  const modules = normalizeModuleSelection(options['module-selection']);
  const ownEditingLevel = resolveOwnEditingLevel(options['own-editing-level']);

  const enableTaggbox = normalizeBoolean(options['enable-taggbox'], false);
  const taggboxWidgetId = normalizeString(options['taggbox-widget-id']);
  if (enableTaggbox && !hasValidTaggboxWidgetId(taggboxWidgetId)) {
    throw new Error('--taggbox-widget-id is required and must be valid when --enable-taggbox=true');
  }

  const contactName = normalizeString(options['contact-name'], 'TBD');
  const contactEmailDefault = `kontakt@${clientId.replace(/[^a-z0-9-]+/gi, '')}.no`;
  const contactEmail = normalizeString(options['contact-email'], contactEmailDefault);
  if (!hasValidEmail(contactEmail)) {
    throw new Error('--contact-email is invalid');
  }

  const contactPhone = normalizeString(options['contact-phone'], '99 99 99 99');
  const contactRole = normalizeString(options['contact-role'], 'Owner');

  return {
    version: '1.0',
    capturedAt: new Date().toISOString(),
    client: {
      id: clientId,
      brandName,
      primaryContact: {
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        role: contactRole,
      },
    },
    technical: {
      repoOwner,
      repoName,
      productionDomain,
      devDomain,
      cmsProxyDomain,
      languageMode,
      defaultLocale,
      secondaryLocale,
      themePreset,
    },
    design: {
      styleDirection: normalizeString(options['style-direction'], 'Editorial and clean'),
      visualWeight: normalizeString(options['visual-weight'], 'balanced'),
      notes: normalizeString(options['design-notes']),
    },
    timeline: {
      goLiveTarget: normalizeString(options['go-live-target'], 'DEV klart innen 24 timer fra onboarding'),
      milestones: [
        { label: 'DEV preview', targetDate: 'TBD' },
        { label: 'Production launch', targetDate: 'TBD' },
      ],
    },
    modules: {
      selected: modules,
      ownEditingLevel,
    },
    social: {
      taggbox: {
        enabled: enableTaggbox,
        provider: 'taggbox',
        widgetId: enableTaggbox ? taggboxWidgetId : '',
        profileSources: normalizeCsv(options['taggbox-profile-sources']),
        refreshCadence: normalizeString(options['taggbox-refresh-cadence'], 'daily'),
        title: 'Folg oss i sosiale medier',
        lead: 'Oppdatert feed fra sosiale plattformer.',
      },
    },
  };
}

function buildGoLiveIntake(options, outputPath) {
  if (!fs.existsSync(outputPath)) {
    throw new Error(`Existing intake missing for mode=go_live: ${path.relative(process.cwd(), outputPath)}`);
  }

  const intake = readJson(outputPath);

  const productionDomain = normalizeString(options['production-domain'], intake?.technical?.productionDomain || '');
  const devDomain = normalizeString(options['dev-domain'], intake?.technical?.devDomain || '');
  const cmsProxyDomain = normalizeString(
    options['cms-proxy-domain'],
    intake?.technical?.cmsProxyDomain || DEFAULT_CMS_PROXY_DOMAIN
  );

  if (!isNonEmptyString(productionDomain)) {
    throw new Error('--production-domain is required for mode=go_live');
  }

  validateHostname(productionDomain, '--production-domain');
  validateHostname(devDomain, '--dev-domain');
  validateHostname(cmsProxyDomain, '--cms-proxy-domain');

  return {
    ...intake,
    capturedAt: new Date().toISOString(),
    technical: {
      ...intake.technical,
      productionDomain,
      devDomain,
      cmsProxyDomain,
    },
  };
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const mode = canonicalMode(normalizeString(options.mode, 'onboard'));

    assertMode(mode);

    const clientId = normalizeString(options['client-id']);
    if (!clientId) throw new Error('--client-id is required');

    const outputPath = resolveOutputPath(clientId, options.output);

    const intake = mode === 'go_live'
      ? buildGoLiveIntake(options, outputPath)
      : buildOnboardIntake(options);

    writeJson(outputPath, intake);
    console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
