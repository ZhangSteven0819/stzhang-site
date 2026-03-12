#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { validateHostname } from './bootstrap-client.mjs';

const DEFAULT_CONFIG_PATH = 'config/client.config.json';

function parseArgs(argv) {
  const options = {
    clientId: '',
    intakePath: '',
    configPath: DEFAULT_CONFIG_PATH,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--client-id') {
      const next = argv[index + 1];
      if (!next) throw new Error('--client-id requires a value');
      options.clientId = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--client-id=')) {
      options.clientId = arg.slice('--client-id='.length);
      continue;
    }

    if (arg === '--intake') {
      const next = argv[index + 1];
      if (!next) throw new Error('--intake requires a value');
      options.intakePath = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--intake=')) {
      options.intakePath = arg.slice('--intake='.length);
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

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${path.relative(process.cwd(), filePath)}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${path.relative(process.cwd(), filePath)}: ${error.message}`);
  }
}

function resolveIntakePath(options) {
  if (typeof options.intakePath === 'string' && options.intakePath.trim().length > 0) {
    return normalizePath(options.intakePath.trim());
  }

  if (typeof options.clientId === 'string' && options.clientId.trim().length > 0) {
    return normalizePath(path.join('config/intake', `${options.clientId.trim()}.json`));
  }

  throw new Error('Provide --intake <path> or --client-id <id>');
}

function ensureString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const intakePath = resolveIntakePath(options);
    const configPath = normalizePath(options.configPath);

    const intake = readJson(intakePath);
    const config = readJson(configPath);

    const productionDomain = ensureString(intake?.technical?.productionDomain, 'technical.productionDomain');
    const devDomain = ensureString(intake?.technical?.devDomain, 'technical.devDomain');
    const cmsProxyDomain = ensureString(intake?.technical?.cmsProxyDomain, 'technical.cmsProxyDomain');

    validateHostname(productionDomain, 'technical.productionDomain');
    validateHostname(devDomain, 'technical.devDomain');
    validateHostname(cmsProxyDomain, 'technical.cmsProxyDomain');

    const clientId = ensureString(config?.clientId, 'config.clientId');

    const updated = {
      ...config,
      domains: {
        ...(config.domains ?? {}),
        production: productionDomain,
        dev: devDomain,
        cmsProxy: cmsProxyDomain,
      },
      cloudflare: {
        ...(config.cloudflare ?? {}),
        pagesProjectDev: config?.cloudflare?.pagesProjectDev || `${clientId}-dev`,
        pagesProjectProd: config?.cloudflare?.pagesProjectProd || `${clientId}-main`,
      },
    };

    if (options.dryRun) {
      console.log(`[dry-run] Would update ${path.relative(process.cwd(), configPath)}`);
      console.log(
        `[dry-run] domains.production=${productionDomain}, domains.dev=${devDomain}, domains.cmsProxy=${cmsProxyDomain}`
      );
      return;
    }

    fs.writeFileSync(configPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    console.log(`Updated ${path.relative(process.cwd(), configPath)} from ${path.relative(process.cwd(), intakePath)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
