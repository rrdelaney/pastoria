#!/usr/bin/env node

import {execSync, spawn} from 'child_process';
import degit from 'degit';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {mkdir} from 'fs/promises';
import {join} from 'path';
import pc from 'picocolors';

const GITHUB_REPO = 'rrdelaney/pastoria';
const STARTER_PATH = 'examples/starter';

async function main() {
  const args = process.argv.slice(2);
  const projectName = args[0] || 'my-pastoria-app';

  console.log(pc.cyan(`Creating a new Pastoria project in ${projectName}...`));

  const targetDir = join(process.cwd(), projectName);

  if (existsSync(targetDir)) {
    console.error(
      pc.red(
        `Error: Directory ${projectName} already exists. Please choose a different name.`,
      ),
    );
    process.exit(1);
  }

  try {
    // Clone the starter project using degit
    console.log(pc.blue('Cloning starter project...'));
    const emitter = degit(`${GITHUB_REPO}/${STARTER_PATH}`, {
      cache: false,
      force: true,
    });

    await emitter.clone(targetDir);

    // Replace workspace: dependencies with published versions
    console.log(pc.blue('Updating dependencies...'));
    await updatePackageJson(targetDir);

    // Create .prettierignore
    console.log(pc.blue('Creating .prettierignore...'));
    await createPrettierIgnore(targetDir);

    // Update .gitignore
    console.log(pc.blue('Updating .gitignore...'));
    await updateGitIgnore(targetDir);

    // Install dependencies
    console.log(pc.blue('Installing dependencies...'));
    await installDependencies(targetDir);

    // Create required directories for code generation
    console.log(pc.blue('Creating required directories...'));
    await createDirectories(targetDir);

    // Run code generation
    console.log(pc.blue('Generating GraphQL schema...'));
    await runCommand('pnpm', ['generate:schema'], targetDir);

    console.log(pc.blue('Generating Relay artifacts...'));
    await runCommand('pnpm', ['generate:relay'], targetDir);

    console.log(pc.blue('Generating router...'));
    await runCommand('pnpm', ['generate:router'], targetDir);

    console.log(pc.green('\n✓ Success! Created Pastoria project at:'));
    console.log(pc.cyan(`  ${targetDir}\n`));
    console.log('To get started, run:');
    console.log(pc.cyan(`  cd ${projectName}`));
    console.log(pc.cyan('  pnpm dev'));
  } catch (error) {
    console.error(pc.red('Error creating Pastoria project:'), error);
    process.exit(1);
  }
}

async function updatePackageJson(targetDir: string) {
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  // Get the latest published versions from the monorepo
  const pastoriaVersion = getPackageVersion('pastoria');
  const pastoriaRuntimeVersion = getPackageVersion('pastoria-runtime');
  const pastoriaServerVersion = getPackageVersion('pastoria-server');

  // Replace workspace: dependencies
  if (packageJson.dependencies) {
    if (packageJson.dependencies['pastoria-runtime']) {
      packageJson.dependencies['pastoria-runtime'] =
        `^${pastoriaRuntimeVersion}`;
    }
    if (packageJson.dependencies['pastoria-server']) {
      packageJson.dependencies['pastoria-server'] = `^${pastoriaServerVersion}`;
    }
  }

  if (packageJson.devDependencies) {
    if (packageJson.devDependencies['pastoria']) {
      packageJson.devDependencies['pastoria'] = `^${pastoriaVersion}`;
    }
  }

  // Update package name to not be private
  packageJson.name = targetDir.split('/').pop() || 'pastoria-app';
  packageJson.private = true;

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function getPackageVersion(packageName: string): string {
  try {
    const packageJsonPath = join(
      process.cwd(),
      'packages',
      packageName,
      'package.json',
    );

    // If running from the monorepo, read the version from the package
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.version;
    }

    // Otherwise, try to get it from npm
    const result = execSync(`npm view ${packageName} version`, {
      encoding: 'utf-8',
    });
    return result.trim();
  } catch {
    // Fallback to a reasonable default
    return '1.0.0';
  }
}

async function createPrettierIgnore(targetDir: string) {
  const prettierIgnorePath = join(targetDir, '.prettierignore');
  const content = `# Generated files
__generated__/

# Build output
dist/
build/

# Dependencies
node_modules/

# Misc
.env*
*.log
`;

  writeFileSync(prettierIgnorePath, content);
}

async function createDirectories(targetDir: string) {
  const directories = [
    join(targetDir, '__generated__', 'schema'),
    join(targetDir, '__generated__', 'queries'),
    join(targetDir, '__generated__', 'router'),
    join(targetDir, 'public'),
  ];

  for (const dir of directories) {
    await mkdir(dir, {recursive: true});
  }
}

async function updateGitIgnore(targetDir: string) {
  const gitIgnorePath = join(targetDir, '.gitignore');
  let gitIgnore = existsSync(gitIgnorePath)
    ? readFileSync(gitIgnorePath, 'utf-8')
    : '';

  // Ensure __generated__ is in .gitignore
  if (!gitIgnore.includes('__generated__')) {
    gitIgnore += '\n# Generated files\n__generated__/\n';
  }

  // Ensure .env files are properly ignored (but allow .env.example)
  if (!gitIgnore.includes('.env') || gitIgnore.includes('*.env*')) {
    // Replace the overly broad *.env* pattern
    gitIgnore = gitIgnore.replace(/\*\.env\*/g, '');
    if (!gitIgnore.includes('.env')) {
      gitIgnore += '\n# Environment files\n.env\n.env.local\n.env*.local\n';
    }
  }

  writeFileSync(gitIgnorePath, gitIgnore);
}

async function installDependencies(targetDir: string) {
  // Check if pnpm is available
  try {
    execSync('pnpm --version', {stdio: 'ignore'});
    await runCommand('pnpm', ['install'], targetDir);
  } catch {
    // Fallback to npm if pnpm is not available
    console.log(
      pc.yellow(
        'Warning: pnpm not found, falling back to npm (Pastoria recommends using pnpm)',
      ),
    );
    await runCommand('npm', ['install'], targetDir);
  }
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(`${command} ${args.join(' ')} failed with code ${code}`),
        );
      } else {
        resolve();
      }
    });

    child.on('error', reject);
  });
}

main().catch((error) => {
  console.error(pc.red('Fatal error:'), error);
  process.exit(1);
});
