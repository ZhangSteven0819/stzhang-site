#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CONFIG_PATH = 'config/client.config.json';

const DEFAULT_RENDER_TARGETS = [
  {
    templatePath: 'public/admin/config.template.yml',
    outputPath: 'public/admin/config.yml',
  },
  {
    templatePath: 'public/_headers.template',
    outputPath: 'public/_headers',
  },
];

const TAGGBOX_CSP = {
  scriptSrc: ['https://widget.taggbox.com'],
  connectSrc: ['https://widget.taggbox.com', 'https://api.taggbox.com'],
  frameSrc: ['https://widget.taggbox.com'],
};

function parseArgs(argv) {
  const options = {
    configPath: DEFAULT_CONFIG_PATH,
    dryRun: false,
    validateOnly: false,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--validate') {
      options.validateOnly = true;
      continue;
    }

    if (value === '--quiet') {
      options.quiet = true;
      continue;
    }

    if (value === '--config') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--config requires a value');
      }
      options.configPath = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  return options;
}

function normalizePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function loadJson(jsonPath) {
  const absolutePath = normalizePath(jsonPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing JSON file: ${jsonPath}`);
  }

  try {
    const raw = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${jsonPath}: ${error.message}`);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidHostname(value) {
  if (!isNonEmptyString(value)) return false;
  if (value.includes('http://') || value.includes('https://')) return false;
  if (value.includes('/')) return false;
  return /^[a-zA-Z0-9.-]+$/.test(value);
}

function ensureOrigin(domainOrOrigin) {
  if (!isNonEmptyString(domainOrOrigin)) return '';
  if (domainOrOrigin.startsWith('http://') || domainOrOrigin.startsWith('https://')) {
    return domainOrOrigin.replace(/\/$/, '');
  }
  return `https://${domainOrOrigin}`;
}

function getNested(config, pathValue) {
  return pathValue.split('.').reduce((accumulator, part) => {
    if (accumulator && typeof accumulator === 'object' && part in accumulator) {
      return accumulator[part];
    }
    return undefined;
  }, config);
}

export function validateClientConfig(config) {
  const errors = [];

  const requiredPaths = [
    'clientId',
    'brandName',
    'repository.owner',
    'repository.name',
    'repository.branch',
    'domains.production',
    'domains.dev',
    'domains.cmsProxy',
    'cloudflare.pagesProjectDev',
    'cloudflare.pagesBranchDev',
    'cloudflare.pagesProjectProd',
    'cloudflare.pagesBranchProd',
    'cms.publishMode',
    'cms.siteOrigin',
    'cms.displayOrigin',
    'cms.mediaFolder',
    'cms.publicFolder',
    'localization.mode',
    'localization.defaultLocale',
    'localization.locales',
    'theme.preset',
    'theme.tokens.brandColor',
  ];

  for (const keyPath of requiredPaths) {
    const value = getNested(config, keyPath);
    if (Array.isArray(value)) {
      if (value.length === 0) {
        errors.push(`Missing required value: ${keyPath}`);
      }
      continue;
    }

    if (!isNonEmptyString(value)) {
      errors.push(`Missing required value: ${keyPath}`);
    }
  }

  if (!['single', 'bilingual'].includes(config?.localization?.mode)) {
    errors.push('localization.mode must be "single" or "bilingual"');
  }

  if (!isValidHostname(config?.domains?.production)) {
    errors.push('domains.production must be a hostname without protocol');
  }

  if (!isValidHostname(config?.domains?.dev)) {
    errors.push('domains.dev must be a hostname without protocol');
  }

  if (!isValidHostname(config?.domains?.cmsProxy)) {
    errors.push('domains.cmsProxy must be a hostname without protocol');
  }

  if (isNonEmptyString(config?.cms?.siteOrigin)) {
    try {
      new URL(config.cms.siteOrigin);
    } catch {
      errors.push('cms.siteOrigin must be a valid origin URL');
    }
  }

  if (isNonEmptyString(config?.cms?.displayOrigin)) {
    try {
      new URL(config.cms.displayOrigin);
    } catch {
      errors.push('cms.displayOrigin must be a valid origin URL');
    }
  }

  if (typeof config?.theme?.tokens?.brandColor !== 'string' || !/^#([0-9a-fA-F]{6})$/.test(config.theme.tokens.brandColor)) {
    errors.push('theme.tokens.brandColor must be a 6-digit hex color (example: #411e25)');
  }

  const locales = config?.localization?.locales;
  if (!Array.isArray(locales) || locales.some((locale) => !isNonEmptyString(locale))) {
    errors.push('localization.locales must be an array of locale strings');
  }

  if (config?.localization?.mode === 'bilingual' && Array.isArray(locales) && locales.length < 2) {
    errors.push('localization.locales must contain at least 2 locales when mode is bilingual');
  }

  return errors;
}

export function loadClientConfig(configPath = DEFAULT_CONFIG_PATH) {
  const config = loadJson(configPath);
  const errors = validateClientConfig(config);

  if (errors.length > 0) {
    const details = errors.map((error) => `- ${error}`).join('\n');
    throw new Error(`Invalid client config (${configPath}):\n${details}`);
  }

  return config;
}

function renderTemplateString(template, replacements) {
  return Object.entries(replacements).reduce((output, [token, value]) => {
    return output.split(token).join(String(value));
  }, template);
}

function hasValidTaggboxWidgetId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{5,120}$/.test(value);
}

function getHomeModulesPath() {
  return normalizePath('src/data/page-modules/home.json');
}

function loadHomeModules() {
  const modulesPath = getHomeModulesPath();
  if (!fs.existsSync(modulesPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
    if (!parsed || !Array.isArray(parsed.modules)) {
      return [];
    }
    return parsed.modules;
  } catch {
    return [];
  }
}

function getTaggboxCspExtras() {
  const modules = loadHomeModules();
  const activeTaggbox = modules.find((module) => {
    return (
      module?.type === 'social_feed' &&
      module?.enabled === true &&
      module?.provider === 'taggbox' &&
      hasValidTaggboxWidgetId(module?.widgetId)
    );
  });

  if (!activeTaggbox) {
    return {
      scriptSrc: '',
      connectSrc: '',
      frameSrc: '',
    };
  }

  return {
    scriptSrc: ` ${TAGGBOX_CSP.scriptSrc.join(' ')}`,
    connectSrc: ` ${TAGGBOX_CSP.connectSrc.join(' ')}`,
    frameSrc: ` ${TAGGBOX_CSP.frameSrc.join(' ')}`,
  };
}

function toReplacements(config) {
  const cspExtras = getTaggboxCspExtras();
  const cmsSiteOrigin = ensureOrigin(config?.cms?.siteOrigin || config?.domains?.production);
  const cmsDisplayOrigin = ensureOrigin(
    config?.cms?.displayOrigin || config?.cms?.siteOrigin || config?.domains?.production
  );

  return {
    '__REPO_FULL__': `${config.repository.owner}/${config.repository.name}`,
    '__REPO_BRANCH__': config.repository.branch,
    '__CMS_PROXY_ORIGIN__': ensureOrigin(config.domains.cmsProxy),
    '__CMS_SITE_ORIGIN__': cmsSiteOrigin,
    '__CMS_DISPLAY_ORIGIN__': cmsDisplayOrigin,
    '__CMS_PUBLISH_MODE__': config.cms.publishMode,
    '__CMS_MEDIA_FOLDER__': config.cms.mediaFolder,
    '__CMS_PUBLIC_FOLDER__': config.cms.publicFolder,
    '__SCRIPT_SRC_EXTRA__': cspExtras.scriptSrc,
    '__CONNECT_SRC_EXTRA__': cspExtras.connectSrc,
    '__FRAME_SRC_EXTRA__': cspExtras.frameSrc,
  };
}

function ensureParentDirectory(filePath) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

export function renderClientFiles(config, options = {}) {
  const {
    dryRun = false,
    quiet = false,
    targets = DEFAULT_RENDER_TARGETS,
  } = options;

  const replacements = toReplacements(config);
  const rendered = [];

  for (const target of targets) {
    const templatePath = normalizePath(target.templatePath);
    const outputPath = normalizePath(target.outputPath);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Missing template file: ${target.templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const outputContent = renderTemplateString(templateContent, replacements);
    rendered.push({ outputPath, outputContent, relativeOutputPath: target.outputPath });
  }

  if (dryRun) {
    if (!quiet) {
      for (const file of rendered) {
        console.log(`[dry-run] Would write ${file.relativeOutputPath}`);
      }
    }
    return rendered;
  }

  for (const file of rendered) {
    ensureParentDirectory(file.outputPath);
    fs.writeFileSync(file.outputPath, file.outputContent, 'utf8');
    if (!quiet) {
      console.log(`Wrote ${file.relativeOutputPath}`);
    }
  }

  return rendered;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const config = loadClientConfig(options.configPath);

    if (!options.quiet) {
      console.log(`Loaded ${options.configPath}`);
    }

    if (options.validateOnly) {
      if (!options.quiet) {
        console.log('Client config validation: OK');
      }
      return;
    }

    renderClientFiles(config, {
      dryRun: options.dryRun,
      quiet: options.quiet,
    });
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
