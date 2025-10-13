#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import pc from 'picocolors';
import {templates} from './templates.js';

function createProject(projectName: string) {
  const targetDir = path.resolve(process.cwd(), projectName);

  console.log(pc.cyan(`\nCreating a new Pastoria app in ${pc.bold(targetDir)}\n`));

  // Create project directory
  if (fs.existsSync(targetDir)) {
    console.error(pc.red(`Error: Directory ${projectName} already exists.`));
    process.exit(1);
  }

  fs.mkdirSync(targetDir, {recursive: true});

  // Create directory structure
  const dirs = [
    '__generated__/schema',
    '__generated__/queries',
    'src/lib/server',
    'src/lib/schema',
    'src/pages',
    'public',
  ];

  dirs.forEach((dir) => {
    fs.mkdirSync(path.join(targetDir, dir), {recursive: true});
  });

  // Write template files
  Object.entries(templates).forEach(([filename, contentFn]) => {
    const content = contentFn();
    const filePath = path.join(targetDir, filename);

    if (typeof content === 'object') {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    } else {
      fs.writeFileSync(filePath, content);
    }

    console.log(pc.green(`✓ Created ${filename}`));
  });

  // Update package.json with project name
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(pc.cyan('\nInstalling dependencies...\n'));

  // Install dependencies
  try {
    execSync('pnpm install', {cwd: targetDir, stdio: 'inherit'});
  } catch (error) {
    console.error(pc.red('\nFailed to install dependencies. Please run pnpm install manually.'));
  }

  console.log(pc.cyan('\nGenerating GraphQL schema and Relay artifacts...\n'));

  // Run code generation
  try {
    execSync('pnpm generate:schema', {cwd: targetDir, stdio: 'inherit'});
    execSync('pnpm generate:relay', {cwd: targetDir, stdio: 'inherit'});
    execSync('pnpm generate:router', {cwd: targetDir, stdio: 'inherit'});
  } catch (error) {
    console.error(
      pc.yellow(
        '\nWarning: Code generation failed. You may need to run the generate commands manually.',
      ),
    );
  }

  console.log(pc.green('\n✨ Success! Created ' + projectName + ' at ' + targetDir));
  console.log('\nInside that directory, you can run several commands:\n');
  console.log(pc.cyan('  pnpm dev'));
  console.log('    Starts the development server.\n');
  console.log(pc.cyan('  pnpm build'));
  console.log('    Builds the app for production.\n');
  console.log(pc.cyan('  pnpm start'));
  console.log('    Runs the production server.\n');
  console.log('We suggest that you begin by typing:\n');
  console.log(pc.cyan('  cd'), projectName);
  console.log(pc.cyan('  pnpm dev'));
  console.log();
}

const args = process.argv.slice(2);
const projectName = args[0] || 'my-pastoria-app';

createProject(projectName);
