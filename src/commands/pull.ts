import chalk from 'chalk';
import { getConfig, saveConfig, installSkill, type SkillsManifest } from '../config.js';
import { getGist, getFromRepo } from '../github.js';

export async function pullCommand(source: string, options: { force?: boolean }): Promise<void> {
  const config = await getConfig();
  
  if (!config.githubToken) {
    console.log(chalk.red('❌ GitHub token not configured'));
    console.log(chalk.yellow('Please set your GitHub token:'));
    console.log(chalk.cyan('  export GITHUB_TOKEN=your_token_here'));
    process.exit(1);
  }
  
  console.log(chalk.blue(`📥 Downloading skills from ${source}...`));
  
  let manifest: SkillsManifest;
  try {
    if (source.includes('/')) {
      // Repo format: owner/repo
      manifest = await getFromRepo(config.githubToken, source);
    } else {
      // Gist ID
      manifest = await getGist(config.githubToken, source);
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to download:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  console.log(chalk.green(`✓ Downloaded ${manifest.skills.length} skill(s)`));
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
  
  // Save as default for future pushes
  if (!source.includes('/')) {
    config.defaultGistId = source;
    await saveConfig(config);
  }
  
  if (installed.length > 0) {
    console.log(chalk.yellow('\n💡 Tip: Restart OpenClaw gateway to load new skills:'));
    console.log(chalk.cyan('  openclaw gateway restart'));
  }
}
