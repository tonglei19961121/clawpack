import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { installSkill, type SkillsManifest } from '../config.js';

export async function importCommand(file: string): Promise<void> {
  console.log(chalk.blue(`📥 Importing from ${file}...`));
  
  let manifest: SkillsManifest;
  try {
    const content = await readFile(file, 'utf-8');
    manifest = JSON.parse(content);
  } catch (error) {
    console.error(chalk.red('❌ Failed to read file:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  console.log(chalk.green(`✓ Loaded ${manifest.skills.length} skill(s)`));
  console.log(chalk.gray(`  Platform: ${manifest.platform}`));
  console.log(chalk.gray(`  Exported: ${new Date(manifest.exportedAt).toLocaleString()}`));
  
  // Install skills
  console.log(chalk.blue('\n📦 Installing skills...\n'));
  
  const installed: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  
  for (const skill of manifest.skills) {
    const name = skill.name;
    process.stdout.write(chalk.gray(`  Installing ${name}... `));
    
    try {
      await installSkill(name, skill.source);
      console.log(chalk.green('✓'));
      installed.push(name);
    } catch (error: any) {
      if (error.message?.includes('already installed') || error.message?.includes('already exists')) {
        console.log(chalk.yellow('⚠ already installed'));
        skipped.push(name);
      } else {
        console.log(chalk.red('✗'));
        console.error(chalk.gray(`    ${error.message}`));
        failed.push(name);
      }
    }
  }
  
  // Summary
  console.log(chalk.blue('\n📊 Summary:'));
  console.log(chalk.green(`  ✓ Installed: ${installed.length}`));
  if (skipped.length > 0) {
    console.log(chalk.yellow(`  ⚠ Skipped: ${skipped.length}`));
  }
  if (failed.length > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failed.length}`));
  }
  
  if (installed.length > 0) {
    console.log(chalk.yellow('\n💡 Tip: Restart OpenClaw gateway to load new skills:'));
    console.log(chalk.cyan('  openclaw gateway restart'));
  }
}
