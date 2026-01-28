#!/usr/bin/env node

import {program} from 'commander';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {IndentationText, Project} from 'ts-morph';
import {build} from 'vite';
import {startDevserver} from './devserver.js';
import {
  generatePastoriaArtifacts,
  generatePastoriaExports,
} from './generate.js';
import {logInfo} from './logger.js';
import {CLIENT_BUILD, createBuildConfig, SERVER_BUILD} from './vite_plugin.js';

async function runCodeGeneration() {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
  });

  logInfo('Generating Pastoria artifacts...');

  // Generate exports and collect metadata
  const metadata = await generatePastoriaExports(project);

  // Generate artifacts using cached metadata
  await generatePastoriaArtifacts(project, metadata);

  logInfo('Code generation complete!');
}

async function runViteBuild(target: 'client' | 'server') {
  const buildType = target === 'client' ? CLIENT_BUILD : SERVER_BUILD;

  logInfo(`Building ${target}...`);

  await build({
    ...createBuildConfig(buildType),
    configFile: false,
  });

  logInfo(`${target} build complete!`);
}

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
    .description('Start the pastoria development server')
    .option('--port <port>', 'Port the devserver will listen on', '3000')
    .action(startDevserver);

  program
    .command('generate')
    .description('Generate Pastoria router artifacts')
    .action(runCodeGeneration);

  program
    .command('build')
    .description('Build for production')
    .action(async () => {
      await runViteBuild('client');
      await runViteBuild('server');
    });

  program.parseAsync();
}

main().catch(console.error);
