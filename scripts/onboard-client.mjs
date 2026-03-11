#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  MODULE_TYPES,
  bootstrapClient,
  validateHostname,
} from './bootstrap-client.mjs';

const DEFAULT_SCHEMA_PATH = 'config/intake.schema.json';
const DEFAULT_INTAKE_DIR = 'config/intake';
const DEFAULT_OUTPUT_DIR = 'docs/client/generated';
const DEFAULT_MODULE_SELECTION = [
  'hero',
  'proof_strip',
  'service_cards',
  'rich_text',
  'gallery',
  'contact_block',
  'cta_band',
];

function parseArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    fromFile: '',
    configPath: 'config/client.config.json',
    schemaPath: DEFAULT_SCHEMA_PATH,
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

    if (arg === '--from-file') {
      const next = argv[index + 1];
      if (!next) throw new Error('--from-file requires a value');
      options.fromFile = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--from-file=')) {
      options.fromFile = arg.slice('--from-file='.length);
      continue;
    }

    if (arg === '--config') {
      const next = argv[index + 1];
      if (!next) throw new Error('--config requires a value');
      options.configPath = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--config=')) {
      options.configPath = arg.slice('--config='.length);
      continue;
    }

    if (arg === '--schema') {
      const next = argv[index + 1];
      if (!next) throw new Error('--schema requires a value');
      options.schemaPath = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--schema=')) {
      options.schemaPath = arg.slice('--schema='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function loadJson(filePath) {
  const absolutePath = normalizePath(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function ensureWritable(filePath, { force, dryRun }) {
  if (force || dryRun) return;
  if (fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite without --force: ${path.relative(process.cwd(), filePath)}`);
  }
}

function writeJson(filePath, value, options) {
  if (options.dryRun) {
    console.log(`[dry-run] Would write ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function normalizeModules(value) {
  if (!isNonEmptyString(value)) return [...DEFAULT_MODULE_SELECTION];

  const entries = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const filtered = entries.filter((item) => MODULE_TYPES.includes(item));
  return filtered.length > 0 ? Array.from(new Set(filtered)) : [...DEFAULT_MODULE_SELECTION];
}

function normalizeList(value) {
  if (!isNonEmptyString(value)) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeYesNo(value, fallback = false) {
  if (!isNonEmptyString(value)) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['y', 'yes', 'ja', 'true', '1'].includes(normalized)) return true;
  if (['n', 'no', 'nei', 'false', '0'].includes(normalized)) return false;
  return fallback;
}

function normalizePhoneLink(value) {
  return (value ?? '').replace(/[^0-9+]/g, '');
}

function hasValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasValidTaggboxWidgetId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{5,120}$/.test(value);
}

function createDefaultMilestones() {
  return [
    {
      label: 'DEV preview',
      targetDate: 'TBD',
    },
    {
      label: 'Production launch',
      targetDate: 'TBD',
    },
  ];
}

function buildMissingClarifications(intake) {
  const missing = [];

  if (!isNonEmptyString(intake.design.notes)) {
    missing.push('Design notes are empty.');
  }

  if (!isNonEmptyString(intake.timeline.goLiveTarget)) {
    missing.push('Go-live target missing.');
  }

  if (!Array.isArray(intake.timeline.milestones) || intake.timeline.milestones.length === 0) {
    missing.push('No milestones defined.');
  }

  if (intake.social.taggbox.enabled && !hasValidTaggboxWidgetId(intake.social.taggbox.widgetId)) {
    missing.push('Taggbox enabled but widgetId is missing/invalid.');
  }

  return missing;
}

function validateMeetingIntake(intake, schema) {
  const errors = [];

  if (!schema || schema.title !== 'MeetingIntake') {
    errors.push('Meeting intake schema could not be loaded or is invalid.');
  }

  if (intake?.version !== '1.0') {
    errors.push('version must be 1.0');
  }

  if (!isNonEmptyString(intake?.capturedAt)) {
    errors.push('capturedAt is required');
  }

  if (!isNonEmptyString(intake?.client?.id)) {
    errors.push('client.id is required');
  }

  if (!isNonEmptyString(intake?.client?.brandName)) {
    errors.push('client.brandName is required');
  }

  if (!hasValidEmail(intake?.client?.primaryContact?.email)) {
    errors.push('client.primaryContact.email is invalid');
  }

  if (!isNonEmptyString(intake?.client?.primaryContact?.phone)) {
    errors.push('client.primaryContact.phone is required');
  }

  try {
    validateHostname(intake?.technical?.productionDomain, 'technical.productionDomain');
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validateHostname(intake?.technical?.devDomain, 'technical.devDomain');
  } catch (error) {
    errors.push(error.message);
  }

  try {
    validateHostname(intake?.technical?.cmsProxyDomain, 'technical.cmsProxyDomain');
  } catch (error) {
    errors.push(error.message);
  }

  if (!['single', 'bilingual'].includes(intake?.technical?.languageMode)) {
    errors.push('technical.languageMode must be single or bilingual');
  }

  if (!Array.isArray(intake?.modules?.selected) || intake.modules.selected.length === 0) {
    errors.push('modules.selected must contain at least one module');
  } else {
    const invalidModules = intake.modules.selected.filter((value) => !MODULE_TYPES.includes(value));
    if (invalidModules.length > 0) {
      errors.push(`modules.selected contains unsupported values: ${invalidModules.join(', ')}`);
    }
  }

  if (!['low', 'medium', 'high'].includes(intake?.modules?.ownEditingLevel)) {
    errors.push('modules.ownEditingLevel must be low, medium, or high');
  }

  if (intake?.social?.taggbox?.enabled) {
    if (intake.social.taggbox.provider !== 'taggbox') {
      errors.push('social.taggbox.provider must be taggbox when enabled');
    }
    if (!hasValidTaggboxWidgetId(intake.social.taggbox.widgetId)) {
      errors.push('social.taggbox.widgetId must be set when Taggbox is enabled');
    }
  }

  return errors;
}

function buildMeetingReport({ intake, bootstrapResult, missingClarifications }) {
  const today = new Date().toISOString().slice(0, 10);
  const selectedModules = Array.from(
    new Set([
      ...intake.modules.selected,
      ...(intake.social.taggbox.enabled ? ['social_feed'] : []),
    ])
  ).join(', ');
  const milestones = intake.timeline.milestones
    .map((item) => `- ${item.label}: ${item.targetDate}`)
    .join('\n');

  return `# Onboarding Summary - ${intake.client.brandName}

Generated: ${today}

## Decision Summary
- Client ID: \`${intake.client.id}\`
- Brand: \`${intake.client.brandName}\`
- Repo: \`${intake.technical.repoOwner}/${intake.technical.repoName}\`
- Domains:
  - Production: \`${intake.technical.productionDomain}\`
  - DEV: \`${intake.technical.devDomain}\`
  - CMS proxy: \`${intake.technical.cmsProxyDomain}\`
- Language mode: \`${intake.technical.languageMode}\`
- Theme preset: \`${intake.technical.themePreset}\`
- Own-editing level: \`${intake.modules.ownEditingLevel}\`
- Selected modules: ${selectedModules}

## Technical Status
- Client config generated: \`${bootstrapResult.config.clientId}\`
- DEV Pages project: \`${bootstrapResult.config.cloudflare.pagesProjectDev}\`
- PROD Pages project: \`${bootstrapResult.config.cloudflare.pagesProjectProd}\`
- Files generated:
${bootstrapResult.generatedFiles.map((file) => `- \`${file}\``).join('\n')}

## Design Direction
- Style direction: ${intake.design.styleDirection}
- Visual weight: ${intake.design.visualWeight}
- Notes: ${intake.design.notes || 'Not provided'}

## Timeline
- Go-live target: ${intake.timeline.goLiveTarget}
- Milestones:
${milestones}

## Social Feed / Taggbox
- Enabled: ${intake.social.taggbox.enabled ? 'Yes' : 'No'}
- Provider: ${intake.social.taggbox.provider}
- Widget ID: ${intake.social.taggbox.widgetId || 'Not set'}
- Profile sources: ${(intake.social.taggbox.profileSources || []).join(', ') || 'None'}
- Refresh cadence: ${intake.social.taggbox.refreshCadence || 'Not set'}

## TODO - You
- Set GitHub variables: \`CF_PAGES_DEV_PROJECT\`, \`CF_PAGES_PROD_PROJECT\`.
- Ensure shared OAuth worker \`ALLOWED_ORIGINS\` has production + www + localhost.
- Ensure worker \`DEV_ORIGIN_REGEX\` allows \`*-dev.pages.dev\`.
- Run \`npm run client:onboard:smoke -- config/intake/${intake.client.id}.json\`.

## TODO - Customer
- Provide final logo/image assets.
- Confirm approved module set and textual copy.
- Confirm Taggbox widget ID and social sources if social feed is enabled.

## Missing Clarifications
${missingClarifications.length > 0 ? missingClarifications.map((item) => `- ${item}`).join('\n') : '- None'}
`;
}

async function askQuestion(rl, question, defaultValue = '') {
  const suffix = isNonEmptyString(defaultValue) ? ` [${defaultValue}]` : '';
  const answer = await rl.question(`${question}${suffix}: `);
  return isNonEmptyString(answer) ? answer.trim() : defaultValue;
}

async function collectInteractiveIntake() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('Meeting-mode onboarding wizard');
    console.log('Press enter to accept defaults.\n');

    const brandName = await askQuestion(rl, 'Brand name');
    const clientIdDefault = slugify(brandName) || 'new-client';
    const clientId = await askQuestion(rl, 'Client ID (slug)', clientIdDefault);

    const contactName = await askQuestion(rl, 'Primary contact name');
    const contactEmail = await askQuestion(rl, 'Primary contact email');
    const contactPhone = await askQuestion(rl, 'Primary contact phone');
    const contactRole = await askQuestion(rl, 'Primary contact role', 'Owner');

    const repoOwner = await askQuestion(rl, 'GitHub repo owner', 'allisson79');
    const repoName = await askQuestion(rl, 'GitHub repo name', `${clientId}-site`);
    const productionDomain = await askQuestion(rl, 'Production domain (no protocol)', `${clientId}.no`);
    const devDomain = await askQuestion(rl, 'DEV domain (no protocol)', `${clientId}-dev.pages.dev`);
    const cmsProxyDomain = await askQuestion(rl, 'CMS proxy domain (no protocol)', `decap.${productionDomain}`);

    const languageMode = await askQuestion(rl, 'Language mode (single|bilingual)', 'single');
    const defaultLocale = await askQuestion(rl, 'Default locale', 'no');
    const secondaryLocale = await askQuestion(rl, 'Secondary locale', 'en');
    const themePreset = await askQuestion(rl, 'Theme preset (wellness|ocean|sunrise|minimal)', 'wellness');

    const styleDirection = await askQuestion(rl, 'Design style direction', 'Confident and editorial');
    const visualWeight = await askQuestion(rl, 'Visual weight (light|balanced|bold)', 'balanced');
    const designNotes = await askQuestion(rl, 'Design notes', '');

    const goLiveTarget = await askQuestion(rl, 'Go-live target', 'DEV klar innen 24 timer fra onboarding');
    const milestone1Date = await askQuestion(rl, 'Milestone: DEV preview date', 'TBD');
    const milestone2Date = await askQuestion(rl, 'Milestone: Production launch date', 'TBD');

    const selectedModulesInput = await askQuestion(
      rl,
      `Selected modules (comma separated: ${MODULE_TYPES.join(', ')})`,
      DEFAULT_MODULE_SELECTION.join(',')
    );
    const ownEditingLevel = await askQuestion(rl, 'Own editing level (low|medium|high)', 'medium');

    const enableTaggboxInput = await askQuestion(rl, 'Enable Taggbox social feed? (yes/no)', 'no');
    const enableTaggbox = normalizeYesNo(enableTaggboxInput, false);
    const taggboxWidgetId = enableTaggbox
      ? await askQuestion(rl, 'Taggbox widget ID', '')
      : '';
    const taggboxSources = enableTaggbox
      ? await askQuestion(rl, 'Taggbox profile sources (comma separated)', '')
      : '';
    const taggboxCadence = enableTaggbox
      ? await askQuestion(rl, 'Taggbox refresh cadence', 'daily')
      : 'daily';

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
        styleDirection,
        visualWeight,
        notes: designNotes,
      },
      timeline: {
        goLiveTarget,
        milestones: [
          {
            label: 'DEV preview',
            targetDate: milestone1Date,
          },
          {
            label: 'Production launch',
            targetDate: milestone2Date,
          },
        ],
      },
      modules: {
        selected: normalizeModules(selectedModulesInput),
        ownEditingLevel,
      },
      social: {
        taggbox: {
          enabled: enableTaggbox,
          provider: 'taggbox',
          widgetId: taggboxWidgetId,
          profileSources: normalizeList(taggboxSources),
          refreshCadence: taggboxCadence,
          title: 'Folg oss i sosiale medier',
          lead: 'Oppdatert feed fra sosiale plattformer.',
        },
      },
    };
  } finally {
    rl.close();
  }
}

function createBootstrapFlags(intake) {
  return {
    'client-id': intake.client.id,
    'brand-name': intake.client.brandName,
    'repo-owner': intake.technical.repoOwner,
    'repo-name': intake.technical.repoName,
    'prod-domain': intake.technical.productionDomain,
    'dev-domain': intake.technical.devDomain,
    'cms-proxy-domain': intake.technical.cmsProxyDomain,
    'language-mode': intake.technical.languageMode,
    'default-locale': intake.technical.defaultLocale,
    'theme-preset': intake.technical.themePreset,
  };
}

function createMeetingInput(intake) {
  const selected = new Set(intake.modules.selected);

  if (intake.social.taggbox.enabled) {
    selected.add('social_feed');
  }

  return {
    contact: {
      email: intake.client.primaryContact.email,
      phoneDisplay: intake.client.primaryContact.phone,
      phoneLink: normalizePhoneLink(intake.client.primaryContact.phone),
      address: '',
    },
    moduleSelection: Array.from(selected),
    ownEditingLevel: intake.modules.ownEditingLevel,
    socialFeed: {
      enabled: intake.social.taggbox.enabled,
      provider: 'taggbox',
      widgetId: intake.social.taggbox.widgetId,
      profileSources: intake.social.taggbox.profileSources,
      refreshCadence: intake.social.taggbox.refreshCadence,
      title: intake.social.taggbox.title,
      lead: intake.social.taggbox.lead,
    },
  };
}

function printMeetingSummary({ bootstrapResult, intake, missingClarifications, reportPath }) {
  console.log('\nGenerated files:');
  for (const file of bootstrapResult.generatedFiles) {
    console.log(`- ${file}`);
  }
  console.log(`- ${reportPath}`);

  console.log('\nManual steps after meeting:');
  console.log('- Add CF_PAGES_DEV_PROJECT and CF_PAGES_PROD_PROJECT in GitHub Variables.');
  console.log('- Add production + www + localhost origins to ALLOWED_ORIGINS in shared worker.');
  console.log('- Ensure DEV_ORIGIN_REGEX allows *-dev.pages.dev.');
  console.log('- Deploy worker and verify /health + /auth?origin=...');

  console.log('\nMissing clarifications:');
  if (missingClarifications.length === 0) {
    console.log('- None');
    return;
  }

  for (const item of missingClarifications) {
    console.log(`- ${item}`);
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const schema = loadJson(options.schemaPath);

    const intake = options.fromFile
      ? loadJson(options.fromFile)
      : await collectInteractiveIntake();

    if (!Array.isArray(intake.timeline?.milestones) || intake.timeline.milestones.length === 0) {
      intake.timeline = {
        ...intake.timeline,
        milestones: createDefaultMilestones(),
      };
    }

    const errors = validateMeetingIntake(intake, schema);
    if (errors.length > 0) {
      throw new Error(`Invalid meeting intake:\n${errors.map((item) => `- ${item}`).join('\n')}`);
    }

    const intakePath = normalizePath(path.join(DEFAULT_INTAKE_DIR, `${intake.client.id}.json`));
    ensureWritable(intakePath, options);

    writeJson(intakePath, intake, options);

    const bootstrapResult = bootstrapClient({
      flags: createBootstrapFlags(intake),
      dryRun: options.dryRun,
      force: options.force,
      configPath: options.configPath,
      secondaryLocale: intake.technical.secondaryLocale,
      meetingInput: createMeetingInput(intake),
    });

    const missingClarifications = buildMissingClarifications(intake);
    const reportPath = normalizePath(path.join(DEFAULT_OUTPUT_DIR, `${intake.client.id}-onboarding.md`));
    ensureWritable(reportPath, options);

    const report = buildMeetingReport({
      intake,
      bootstrapResult,
      missingClarifications,
    });

    writeText(reportPath, report, options);

    printMeetingSummary({
      bootstrapResult,
      intake,
      missingClarifications,
      reportPath: path.relative(process.cwd(), reportPath),
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
