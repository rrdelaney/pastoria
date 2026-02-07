#!/usr/bin/env node

import {program} from 'commander';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {IndentationText, Project} from 'ts-morph';
import {build} from 'vite';
import {startDevserver} from './devserver.js';
import {PastoriaExecutionContext} from './generate.js';
import {logInfo} from './logger.js';
import {CLIENT_BUILD, createBuildConfig, SERVER_BUILD} from './vite_plugin.js';

async function runCodeGeneration(project: Project) {
  await new PastoriaExecutionContext(project).generatePastoriaArtifacts();
}

async function runViteBuild(project: Project, target: 'client' | 'server') {
  const buildType = target === 'client' ? CLIENT_BUILD : SERVER_BUILD;

  logInfo(`Building ${target}...`);

  await build({
    ...createBuildConfig(project, buildType),
    configFile: false,
  });

  logInfo(`${target} build complete!`);
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
    .command('dev')
    .description('Start the pastoria development server')
    .option('--port <port>', 'Port the devserver will listen on', '3000')
    .action(async (options) => {
      await startDevserver(project, options);
    });

  program
    .command('generate')
    .description('Generate Pastoria router artifacts')
    .action(async () => {
      await runCodeGeneration(project);
    });

  program
    .command('build')
    .description('Build for production')
    .action(async () => {
      await runViteBuild(project, 'client');
      await runViteBuild(project, 'server');
    });

  program.parseAsync();
}

main().catch(console.error);
