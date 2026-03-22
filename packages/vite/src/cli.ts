#!/usr/bin/env node

import {program} from 'commander';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {IndentationText, Project} from 'ts-morph';
import {PastoriaExecutionContext} from './generate.js';

async function runCodeGeneration(project: Project) {
  await new PastoriaExecutionContext(project).generatePastoriaArtifacts();
}

async function main() {
  const packageData = JSON.parse(
    await readFile(path.join(import.meta.dirname, '../package.json'), 'utf-8'),
  );

  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
  });

  await program
    .name('pastoria')
    .version(packageData.version)
    .description('Generate Pastoria router artifacts')
    .action(async () => {
      await runCodeGeneration(project);
    })
    .parseAsync();
}

main().catch(console.error);
