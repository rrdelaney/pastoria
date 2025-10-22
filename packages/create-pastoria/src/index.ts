#!/usr/bin/env node

import {execSync, spawn} from 'child_process';
import degit from 'degit';
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {mkdir} from 'fs/promises';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';
import pc from 'picocolors';
import {parse as parseYaml} from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

    // Install dependencies
    console.log(pc.blue('Installing dependencies...'));
    await installDependencies(targetDir);

    console.log(pc.green('\n✓ Success! Created Pastoria project at:'));
    console.log(pc.cyan(`  ${targetDir}\n`));
    console.log('To get started, run:');
    console.log(pc.cyan(`  cd ${projectName}`));
    console.log(pc.cyan('  npm run dev'));
  } catch (error) {
    console.error(pc.red('Error creating Pastoria project:'), error);
    process.exit(1);
  }
}

async function updatePackageJson(targetDir: string) {
  const packageJsonPath = join(targetDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  // Load the catalog
  const catalog = loadCatalog();

  // Get the latest published versions from the monorepo
  const pastoriaVersion = getPackageVersion('pastoria');
  const pastoriaRuntimeVersion = getPackageVersion('pastoria-runtime');
  const pastoriaServerVersion = getPackageVersion('pastoria-server');

  // Helper function to replace workspace: and catalog: references
  const replaceDependency = (deps: Record<string, string>) => {
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*') {
        // Replace workspace: dependencies
        if (name === 'pastoria-runtime') {
          deps[name] = `^${pastoriaRuntimeVersion}`;
        } else if (name === 'pastoria-server') {
          deps[name] = `^${pastoriaServerVersion}`;
        } else if (name === 'pastoria') {
          deps[name] = `^${pastoriaVersion}`;
        }
      } else if (version === 'catalog:') {
        // Replace catalog: dependencies
        if (catalog[name]) {
          deps[name] = catalog[name];
        } else {
          console.warn(
            pc.yellow(
              `Warning: ${name} references catalog but not found in catalog`,
            ),
          );
        }
      }
    }
  };

  // Replace dependencies
  if (packageJson.dependencies) {
    replaceDependency(packageJson.dependencies);
  }

  if (packageJson.devDependencies) {
    replaceDependency(packageJson.devDependencies);
  }

  // Update package name to not be private
  packageJson.name = targetDir.split('/').pop() || 'pastoria-app';
  packageJson.private = true;

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

function loadCatalog(): Record<string, string> {
  try {
    // Read pnpm-workspace.yaml from the dist directory (copied during build)
    const workspaceYamlPath = join(__dirname, 'pnpm-workspace.yaml');

    if (existsSync(workspaceYamlPath)) {
      const workspaceYaml = readFileSync(workspaceYamlPath, 'utf-8');
      const workspace = parseYaml(workspaceYaml);
      return workspace.catalog || {};
    }

    console.warn(
      pc.yellow('Warning: pnpm-workspace.yaml not found in package'),
    );
    return {};
  } catch (error) {
    console.warn(
      pc.yellow('Warning: Could not load catalog from pnpm-workspace.yaml'),
    );
    return {};
  }
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

async function installDependencies(targetDir: string) {
  await runCommand('npm', ['install'], targetDir);
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
