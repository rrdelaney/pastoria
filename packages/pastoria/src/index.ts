#!/usr/bin/env node

import {program} from 'commander';
import {copyFile, mkdir, readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {IndentationText, Project} from 'ts-morph';
import {PastoriaExecutionContext} from './generate.js';
import {logInfo} from './logger.js';

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

  program
    .name('pastoria')
    .description(packageData.description)
    .version(packageData.version);

  program
    .command('generate')
    .description('Generate Pastoria router artifacts')
    .action(async () => {
      await runCodeGeneration(project);
    });

  program
    .command('add-skill')
    .description('Install the Pastoria Claude Code skill into this project')
    .action(async () => {
      const src = path.join(
        PastoriaExecutionContext.TEMPLATES_DIRECTORY,
        'SKILL.md',
      );
      const destDir = path.join(process.cwd(), '.claude', 'skills', 'pastoria');
      const dest = path.join(destDir, 'SKILL.md');
      await mkdir(destDir, {recursive: true});
      await copyFile(src, dest);
      logInfo(
        `Installed Pastoria skill to ${path.relative(process.cwd(), dest)}`,
      );
    });

  program.parseAsync();
}

main().catch(console.error);
