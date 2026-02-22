import chalk from 'chalk';
import { getConfig } from '../config.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function statusCommand(): Promise<void> {
  console.log(chalk.blue('📊 clawpack 状态检查\n'));
  
  // GitHub Token Status
  console.log(chalk.cyan('🔐 GitHub 授权状态'));
  
  const config = await getConfig();
  let authSource = '未配置';
  let authStatus = '❌';
  
  if (process.env.GITHUB_TOKEN) {
    authSource = 'GITHUB_TOKEN 环境变量';
    authStatus = '✅';
  } else if (process.env.GH_TOKEN) {
    authSource = 'GH_TOKEN 环境变量';
    authStatus = '✅';
  } else if (config.githubToken) {
    // Check if it's from gh CLI
    try {
      const { stdout } = await execAsync('gh auth token', { timeout: 3000 });
      if (stdout.trim() === config.githubToken) {
        authSource = 'GitHub CLI (gh auth)';
      } else {
        authSource = '配置文件 (~/.config/clawpack/config.json)';
      }
    } catch {
      authSource = '配置文件 (~/.config/clawpack/config.json)';
    }
    authStatus = '✅';
  }
  
  console.log(`   状态: ${authStatus === '✅' ? chalk.green('已授权') : chalk.red('未授权')}`);
  if (authStatus === '✅') {
    console.log(`   来源: ${chalk.gray(authSource)}`);
    console.log(`   Token: ${chalk.gray(config.githubToken?.substring(0, 12) + '...')}`);
  }
  
  // Config Status
  console.log(chalk.cyan('\n⚙️  配置状态'));
  if (config.defaultGistId) {
    console.log(`   默认备份: ${chalk.green(config.defaultGistId)}`);
    console.log(`   查看备份: ${chalk.gray(`https://gist.github.com/${config.defaultGistId}`)}`);
  } else {
    console.log(`   默认备份: ${chalk.yellow('未设置')}`);
  }
  
  // Next Steps
  if (authStatus !== '✅') {
    console.log(chalk.yellow('\n💡 如何授权？'));
    console.log(chalk.gray('   方式 1 (推荐):'));
    console.log(chalk.gray('     export GITHUB_TOKEN=ghp_your_token_here'));
    console.log(chalk.gray('   方式 2:'));
    console.log(chalk.gray('     gh auth login'));
    console.log(chalk.gray('   创建 Token: https://github.com/settings/tokens'));
  } else {
    console.log(chalk.green('\n✓ 授权正常，可以使用所有功能'));
  }
}
