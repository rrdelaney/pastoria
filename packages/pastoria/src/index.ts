#!/usr/bin/env node

import {program} from 'commander';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {createBuild} from './build.js';
import {startDevserver} from './devserver.js';

async function main() {
  const packageData = JSON.parse(
    await readFile(path.join(import.meta.dirname, '../package.json'), 'utf-8'),
  );

  program
    .name('pastoria')
    .description(packageData.description)
    .version(packageData.version);

  program
    .command('dev')
    .description('Start the pastoria devserver')
    .option('--port <port>', 'Port the devserver will listen on', '3000')
    .action(startDevserver);

  program
    .command('make')
    .description('Creates a production build of the project')
    .argument(
      '[steps...]',
      'Specific build steps to run (schema, relay, router). If not provided, will infer from changed files.',
    )
    .option('-B, --always-make', 'Always make, never cache')
    .option('--release', 'Build for production')
    .option('-w, --watch', 'Watch for changes and rebuild')
    .action(createBuild);

  program.parseAsync();
}

main().catch(console.error);
