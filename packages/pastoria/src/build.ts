import ParcelWatcher, {getEventsSince, writeSnapshot} from '@parcel/watcher';
import {spawn} from 'node:child_process';
import {access, readFile} from 'node:fs/promises';
import path from 'node:path';
import {IndentationText, Project} from 'ts-morph';
import {build} from 'vite';
import {
  generatePastoriaArtifacts,
  generatePastoriaExports,
  PASTORIA_TAG_REGEX,
  PastoriaMetadata,
} from './generate.js';
import {logger, logInfo} from './logger.js';
import {CLIENT_BUILD, createBuildConfig, SERVER_BUILD} from './vite_plugin.js';

enum PastoriaMakePhase {
  PASTORIA_EXPORTS,
  PASTORIA_ARTIFACTS,
  RELAY,
  GRATS,
}

const ALL_MAKE_PHASES = new Set([
  PastoriaMakePhase.PASTORIA_EXPORTS,
  PastoriaMakePhase.PASTORIA_ARTIFACTS,
  PastoriaMakePhase.RELAY,
  PastoriaMakePhase.GRATS,
]);

const SNAPSHOT_PATH = '.pastoriainfo';

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'inherit', // Stream output to terminal
      shell: true,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runGratsCompiler(): Promise<void> {
  const gratsPath = path.join(process.cwd(), 'node_modules', '.bin', 'grats');
  await runCommand(gratsPath, []);
}

async function runRelayCompiler(): Promise<void> {
  const relayPath = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    'relay-compiler',
  );
  await runCommand(relayPath, ['--repersist']);
}

function fileMatchesPastoriaTags(filePath: string, content: string): boolean {
  // Skip generated files
  if (filePath.includes('__generated__')) {
    return false;
  }
  return PASTORIA_TAG_REGEX.test(content);
}

function fileMatchesGratsTags(filePath: string, content: string): boolean {
  // Skip generated files
  if (filePath.includes('__generated__')) {
    return false;
  }
  // Match any Grats JSDoc tag
  return /@gql\w+/.test(content);
}

function fileMatchesRelayImports(filePath: string, content: string): boolean {
  // Skip generated files
  if (filePath.includes('__generated__')) {
    return false;
  }
  return (
    /import\s+.*\s+from\s+['"]react-relay['"]/.test(content) ||
    /import\s+.*\s+from\s+['"]relay-runtime['"]/.test(content)
  );
}

async function requiredMakePhasesForChanges(
  events: Array<{type: string; path: string}>,
): Promise<Set<PastoriaMakePhase>> {
  let makePhases = new Set<PastoriaMakePhase>();

  await Promise.all(
    events.map(async (event) => {
      const filePath = event.path;

      // Skip non-TypeScript/TSX files
      if (!filePath.match(/\.(ts|tsx)$/)) {
        return;
      }

      // For delete events, we can't read content, so assume it might affect all pipelines
      if (event.type === 'delete') {
        makePhases = ALL_MAKE_PHASES;
        return;
      }

      // Read file content for create/update events
      try {
        const content = await readFile(filePath, 'utf-8');

        if (fileMatchesPastoriaTags(filePath, content)) {
          makePhases.add(PastoriaMakePhase.PASTORIA_EXPORTS);
          makePhases.add(PastoriaMakePhase.PASTORIA_ARTIFACTS);
        }

        if (fileMatchesGratsTags(filePath, content)) {
          makePhases.add(PastoriaMakePhase.GRATS);
          makePhases.add(PastoriaMakePhase.RELAY); // Relay depends on Grats schema
        }

        if (fileMatchesRelayImports(filePath, content)) {
          makePhases.add(PastoriaMakePhase.RELAY);
        }
      } catch {
        // If we can't read the file, assume it might affect all pipelines
        makePhases = ALL_MAKE_PHASES;
      }
    }),
  );

  return makePhases;
}

function requiredMakePhasesForArgs(steps: string[]): Set<PastoriaMakePhase> {
  const validSteps = new Set(['schema', 'relay', 'router']);
  const needs = new Set<PastoriaMakePhase>();

  for (const step of steps) {
    if (!validSteps.has(step)) {
      throw new Error(
        `Invalid build step: ${step}. Valid steps are: schema, relay, router`,
      );
    }

    switch (step) {
      case 'schema':
        needs.add(PastoriaMakePhase.GRATS);
        break;
      case 'relay':
        needs.add(PastoriaMakePhase.RELAY);

        break;
      case 'router':
        needs.add(PastoriaMakePhase.PASTORIA_EXPORTS);
        needs.add(PastoriaMakePhase.PASTORIA_ARTIFACTS);
        break;
    }
  }

  return needs;
}

async function executeBuildSteps(
  project: Project,
  needs: Set<PastoriaMakePhase>,
): Promise<boolean> {
  let rebuiltAnything = false;
  let cachedMetadata: PastoriaMetadata | undefined = undefined;

  if (needs.has(PastoriaMakePhase.PASTORIA_EXPORTS)) {
    logInfo('Running Pastoria exports generation...');
    cachedMetadata = await generatePastoriaExports(project);
    rebuiltAnything = true;
  }

  if (needs.has(PastoriaMakePhase.GRATS)) {
    logInfo('Running Grats compiler...');
    await runGratsCompiler();
    rebuiltAnything = true;
  }

  if (needs.has(PastoriaMakePhase.RELAY)) {
    logInfo('Running Relay compiler...');
    await runRelayCompiler();
    rebuiltAnything = true;
  }

  if (needs.has(PastoriaMakePhase.PASTORIA_ARTIFACTS)) {
    logInfo('Running Pastoria artifacts generation...');
    await generatePastoriaArtifacts(project, cachedMetadata);
    rebuiltAnything = true;
  }

  return rebuiltAnything;
}

export async function createBuild(
  steps: string[],
  opts: {
    alwaysMake: boolean;
    release: boolean;
    watch?: boolean;
  },
) {
  if (opts.watch && opts.release) {
    throw new Error(
      'Cannot use --watch and --release together. Watch mode is for development only.',
    );
  }

  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
  });

  const cwd = process.cwd();
  let makePhases = new Set<PastoriaMakePhase>();

  // If specific steps are provided, override automatic inference
  if (steps.length > 0) {
    makePhases = makePhases.union(requiredMakePhasesForArgs(steps));
  } else if (opts.alwaysMake) {
    makePhases = ALL_MAKE_PHASES;
  }
  // Use @parcel/watcher to get changes since last snapshot
  else {
    try {
      // Check if snapshot exists - if not, do a full build
      await access(SNAPSHOT_PATH);

      // Get events since last snapshot
      const events = await getEventsSince(cwd, SNAPSHOT_PATH);

      if (events.length > 0) {
        // Analyze which files changed and determine what needs to be rebuilt
        makePhases = makePhases.union(
          await requiredMakePhasesForChanges(events),
        );
      }
    } catch (err) {
      // No snapshot exists yet, or error reading it - do a full build
      makePhases = ALL_MAKE_PHASES;
    }
  }

  // Execute build pipeline conditionally
  await executeBuildSteps(project, makePhases);

  // Write snapshot for next incremental build
  await writeSnapshot(cwd, SNAPSHOT_PATH);

  if (opts.release) {
    await build({
      ...createBuildConfig(CLIENT_BUILD),
      configFile: false,
    });

    await build({
      ...createBuildConfig(SERVER_BUILD),
      configFile: false,
    });
  }

  // Start watch mode if requested
  if (opts.watch) {
    logInfo('Watching for changes...');

    const subscription = await ParcelWatcher.subscribe(
      cwd,
      async (err, events) => {
        if (err) {
          logger.error('Watch error!', {error: err});
          return;
        }

        // Analyze which files changed and determine what needs to be rebuilt
        const rebuiltAnything = await executeBuildSteps(
          project,
          await requiredMakePhasesForChanges(events),
        );

        if (rebuiltAnything) {
          // Write snapshot after successful rebuild
          await writeSnapshot(cwd, SNAPSHOT_PATH);
          logInfo('Rebuild complete. Watching for changes...');
        }
      },
    );

    // Keep the process running
    process.on('SIGINT', async () => {
      await subscription.unsubscribe();
      process.exit(0);
    });
  }
}
