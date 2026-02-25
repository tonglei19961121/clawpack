#!/usr/bin/env node
import { Command } from 'commander';
import { pullCommand } from './commands/pull.js';
import { listCommand } from './commands/list.js';
import { exportCommand } from './commands/export.js';
import { importCommand } from './commands/import.js';
import { initCommand } from './commands/init.js';
import { backupCommand } from './commands/backup.js';
import { restoreCommand } from './commands/restore.js';
import { statusCommand } from './commands/status.js';
import { packCommand } from './commands/pack.js';
import { unpackCommand } from './commands/unpack.js';
import { profileCommand } from './commands/profile.js';

const program = new Command();

program
  .name('clawpack')
  .description('Backup and share your OpenClaw skills via GitHub')
  .version('1.6.0');

program
  .command('init')
  .description('Initialize clawpack configuration')
  .action(initCommand);

program
  .command('status')
  .description('Check authentication and configuration status')
  .action(statusCommand);

program
  .command('list')
  .description('List installed OpenClaw skills')
  .action(listCommand);

program
  .command('pull')
  .description('Download skills from GitHub')
  .argument('[source]', 'Gist ID, profile name, or repo (owner/repo) - optional if used before')
  .option('-f, --force', 'Overwrite existing skills')
  .option('-y, --yes', 'Auto-confirm without prompting')
  .action(pullCommand);

program
  .command('export')
  .description('Export skills to a local file')
  .option('-o, --output <file>', 'Output file', 'clawpack.json')
  .action(exportCommand);

program
  .command('import')
  .description('Import skills from a local file')
  .argument('<file>', 'Path to clawpack.json file')
  .action(importCommand);

// Backup commands (unified)
program
  .command('backup')
  .description('Create a backup of OpenClaw configuration')
  .option('-f, --full', 'Include complete configuration (not just skills)')
  .option('-w, --workspace', 'Include workspace files (SOUL.md, AGENTS.md, etc.)')
  .option('-s, --sensitive', 'Include sensitive data (appSecret, tokens)')
  .option('-r, --repo <repo>', 'Push to a GitHub repository')
  .option('-p, --profile <name>', 'Push to a named profile')
  .action(backupCommand);

program
  .command('restore')
  .description('Restore OpenClaw configuration from backup')
  .argument('[source]', 'Gist ID, profile name, or repo (optional if used before)')
  .option('-f, --full', 'Restore full configuration (not just skills)')
  .option('-w, --workspace', 'Restore workspace files')
  .option('--skip-channels', 'Skip restoring channel configurations')
  .option('--skip-agents', 'Skip restoring agent configurations')
  .option('-y, --yes', 'Auto-confirm without prompting')
  .action(restoreCommand);

// Profile management
program
  .command('profile')
  .description('Manage backup profiles (nicknames for Gist IDs)')
  .argument('<action>', 'Action: list, add, remove, use, show')
  .argument('[args...]', 'Additional arguments')
  .action((action, args) => profileCommand(action, ...args));

// Local file backup (no GitHub required)
program
  .command('pack')
  .description('Pack OpenClaw configuration into a local file (no GitHub needed)')
  .argument('[output]', 'Output file name')
  .action(packCommand);

program
  .command('unpack')
  .description('Unpack configuration from a local file')
  .argument('<file>', 'Pack file to unpack (.zip)')
  .action(unpackCommand);

program.parse();
