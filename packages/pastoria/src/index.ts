#!/usr/bin/env node

import {program} from 'commander';
import {printSchema, type GraphQLSchema} from 'graphql';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import * as path from 'node:path';
import {IndentationText, Project} from 'ts-morph';
import {build, createServer as createViteServer} from 'vite';
import {startDevserver} from './devserver.js';
import {
  generatePastoriaArtifacts,
  generatePastoriaExports,
} from './generate.js';
import {logInfo} from './logger.js';
import {CLIENT_BUILD, createBuildConfig, SERVER_BUILD} from './vite_plugin.js';

interface PastoriaEnvironmentModule {
  default: {
    schema: GraphQLSchema;
  };
}

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

async function printGraphQLSchema() {
  logInfo('Printing GraphQL schema...');

  const buildConfig = createBuildConfig(CLIENT_BUILD);
  const vite = await createViteServer({
    ...buildConfig,
    configFile: false,
    server: {middlewareMode: true},
  });

  try {
    const environmentModule = (await vite.ssrLoadModule(
      './pastoria/environment.ts',
    )) as PastoriaEnvironmentModule;

    const schema = environmentModule.default.schema;
    const sdl = printSchema(schema);

    await mkdir('__generated__/schema', {recursive: true});
    await writeFile('__generated__/schema/schema.graphql', sdl);

    logInfo('Schema written to __generated__/schema/schema.graphql');
  } finally {
    await vite.close();
  }
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
    .description('Generate Pastoria routing and resources')
    .action(async () => {
      await runCodeGeneration();
      await printGraphQLSchema();
    });

  program
    .command('build')
    .description('Build for production')
    .argument('[target]', 'Build target: client, server, or omit for both')
    .action(async (target?: string) => {
      if (target != null && target !== 'client' && target !== 'server') {
        console.error('Invalid target. Must be "client" or "server"');
        process.exit(1);
      }

      if (target == null) {
        await runViteBuild('client');
        await runViteBuild('server');
      } else {
        await runViteBuild(target as 'client' | 'server');
      }
    });

  program.parseAsync();
}

main().catch(console.error);
