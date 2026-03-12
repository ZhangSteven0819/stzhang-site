#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CONFIG_PATH = 'config/client.config.json';
const TARGET_PUBLISH_MODE = {
  dev: 'simple',
  production: 'editorial_workflow',
};

function parseArgs(argv) {
  const options = {
    target: 'dev',
    configPath: DEFAULT_CONFIG_PATH,
    publishMode: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--target') {
      const next = argv[index + 1];
      if (!next) throw new Error('--target requires a value');
      options.target = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--target=')) {
      options.target = arg.slice('--target='.length);
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

    if (arg === '--publish-mode') {
      const next = argv[index + 1];
      if (!next) throw new Error('--publish-mode requires a value');
      options.publishMode = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--publish-mode=')) {
      options.publishMode = arg.slice('--publish-mode='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function normalizePath(relativePath) {
  return path.resolve(process.cwd(), relativePath);
}

function isValidHostname(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  if (value.includes('http://') || value.includes('https://') || value.includes('/')) return false;
  return /^[a-zA-Z0-9.-]+$/.test(value);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));

    if (!['dev', 'production'].includes(options.target)) {
      throw new Error('--target must be dev or production');
    }

    const configPath = normalizePath(options.configPath);

    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${options.configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const domain = options.target === 'dev'
      ? config?.domains?.dev
      : config?.domains?.production;

    if (!isValidHostname(domain)) {
      throw new Error(`Missing/invalid domain for target=${options.target}`);
    }

    const origin = `https://${domain}`;
    const publishMode = options.publishMode || TARGET_PUBLISH_MODE[options.target];
    config.cms = {
      ...config.cms,
      siteOrigin: origin,
      displayOrigin: origin,
      publishMode,
    };

    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    console.log(`Set CMS origin to ${origin} (${options.target}), publish mode=${publishMode}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
