import chalk from 'chalk';
import { getConfig, saveConfig } from '../config.js';

export async function initCommand(): Promise<void> {
  console.log(chalk.blue('🚀 Initializing clawpack...\n'));
  
  const config = await getConfig();
  
  // Check for GitHub token
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    console.log(chalk.green('✓ Found GITHUB_TOKEN in environment'));
    config.githubToken = envToken;
  } else {
    console.log(chalk.yellow('⚠️  GITHUB_TOKEN not found in environment'));
    console.log(chalk.gray('  You can set it later with: export GITHUB_TOKEN=your_token'));
  }
  
  await saveConfig(config);
  
  console.log(chalk.green('\n✓ clawpack initialized!'));
  console.log(chalk.gray('\nConfig location: ~/.config/clawpack/config.json'));
  
  if (!config.githubToken) {
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.cyan('  1. Create a GitHub token at https://github.com/settings/tokens'));
    console.log(chalk.cyan('  2. Export it: export GITHUB_TOKEN=your_token'));
    console.log(chalk.cyan('  3. Run: clawpack push'));
  } else {
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.cyan('  1. Run: clawpack list    # See your current skills'));
    console.log(chalk.cyan('  2. Run: clawpack push    # Backup to GitHub'));
  }
}
