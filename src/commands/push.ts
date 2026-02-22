import chalk from 'chalk';
import { getConfig, saveConfig, scanLocalSkills, type SkillsManifest } from '../config.js';
import { createGist, updateGist, pushToRepo } from '../github.js';

export async function pushCommand(options: { gist?: boolean; repo?: string }): Promise<void> {
  const config = await getConfig();
  
  if (!config.githubToken) {
    console.log(chalk.red('❌ GitHub token not configured'));
    console.log(chalk.yellow('Please set your GitHub token first:'));
    console.log(chalk.cyan('  export GITHUB_TOKEN=your_token_here'));
    console.log(chalk.gray('Or create one at: https://github.com/settings/tokens'));
    process.exit(1);
  }
  
  console.log(chalk.blue('📦 Scanning local skills...'));
  const skills = await scanLocalSkills();
  
  if (skills.length === 0) {
    console.log(chalk.yellow('⚠️  No skills found'));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${skills.length} skill(s)`));
  
  const manifest: SkillsManifest = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    platform: 'openclaw',
    skills,
  };
  
  try {
    if (options.repo) {
      console.log(chalk.blue(`📤 Pushing to repository ${options.repo}...`));
      await pushToRepo(config.githubToken, options.repo, manifest);
      console.log(chalk.green(`✓ Successfully pushed to ${options.repo}`));
    } else {
      // Use Gist by default
      if (config.defaultGistId) {
        console.log(chalk.blue('📤 Updating existing Gist...'));
        await updateGist(config.githubToken, config.defaultGistId, manifest);
        console.log(chalk.green('✓ Successfully updated Gist'));
        console.log(chalk.gray(`  Gist ID: ${config.defaultGistId}`));
      } else {
        console.log(chalk.blue('📤 Creating new Gist...'));
        const gistId = await createGist(config.githubToken, manifest);
        config.defaultGistId = gistId;
        await saveConfig(config);
        console.log(chalk.green('✓ Successfully created Gist'));
        console.log(chalk.cyan(`  Gist ID: ${gistId}`));
        console.log(chalk.yellow('\n💡 Tip: Save this Gist ID to pull your skills later:'));
        console.log(chalk.cyan(`  clawpack pull ${gistId}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to push:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
