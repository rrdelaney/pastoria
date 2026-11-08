#!/usr/bin/env node

import {program} from 'commander';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {PastoriaAnalyzer} from './analyzer.js';
import {PastoriaExecutionContext} from './generate.js';

async function runCodeGeneration() {
  const analyzer = new PastoriaAnalyzer({projectDir: process.cwd()});
  try {
    await new PastoriaExecutionContext(analyzer).generatePastoriaArtifacts();
  } finally {
    analyzer.close();
  }
}

async function main() {
  const packageData = JSON.parse(
    await readFile(path.join(import.meta.dirname, '../package.json'), 'utf-8'),
  );

  await program
    .name('pastoria')
    .version(packageData.version)
    .description('Generate Pastoria router artifacts')
    .action(runCodeGeneration)
    .parseAsync();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
