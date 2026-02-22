import chalk from 'chalk';
import { getConfig, saveConfig, scanLocalSkills } from '../config.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function detectGitHubToken(): Promise<string | null> {
  // Priority 1: Environment variables
  const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (envToken) {
    return { source: 'GITHUB_TOKEN env var', token: envToken } as any;
  }
  
  // Priority 2: GitHub CLI
  try {
    const { stdout } = await execAsync('gh auth token', { timeout: 5000 });
    const token = stdout.trim();
    if (token) {
      return { source: 'GitHub CLI', token } as any;
    }
  } catch {
    // GitHub CLI not installed or not logged in
  }
  
  return null;
}

export async function initCommand(): Promise<void> {
  console.log(chalk.blue('🚀 欢迎使用 clawpack！\n'));
  console.log(chalk.gray('clawpack 可以帮你备份和恢复 AI 工具的技能配置\n'));
  
  const config = await getConfig();
  const isFirstTime = !config.githubToken;
  
  if (isFirstTime) {
    console.log(chalk.cyan('🔧 首次设置\n'));
  }
  
  // Step 1: GitHub Token
  console.log(chalk.cyan('1️⃣  GitHub 认证'));
  const detected = await detectGitHubToken();
  
  if (detected) {
    const { source, token } = detected as any;
    console.log(chalk.green(`   ✓ 已授权 (${source})`));
    console.log(chalk.gray(`   Token: ${token.substring(0, 12)}...`));
    config.githubToken = token;
  } else {
    console.log(chalk.yellow('   ⚠  未授权'));
    console.log(chalk.gray('   支持以下方式：'));
    console.log(chalk.gray('   1. export GITHUB_TOKEN=your_token'));
    console.log(chalk.gray('   2. gh auth login'));
    console.log(chalk.gray('   创建 Token: https://github.com/settings/tokens'));
  }
  
  // Step 2: Scan existing skills
  console.log(chalk.cyan('\n2️⃣  扫描现有技能'));
  const skills = await scanLocalSkills();
  
  if (skills.length > 0) {
    console.log(chalk.green(`   ✓ 找到 ${skills.length} 个技能：`));
    for (const skill of skills.slice(0, 5)) {
      console.log(chalk.gray(`     • ${skill.name}`));
    }
    if (skills.length > 5) {
      console.log(chalk.gray(`     ... 还有 ${skills.length - 5} 个`));
    }
  } else {
    console.log(chalk.yellow('   ⚠  未发现技能'));
    console.log(chalk.gray('   你可能需要先安装一些 OpenClaw 技能'));
  }
  
  await saveConfig(config);
  
  // Step 3: Suggest next steps
  console.log(chalk.cyan('\n📋 常用命令'));
  
  console.log(chalk.white('   基础命令：'));
  console.log(chalk.gray('   clawpack list         查看所有技能'));
  
  if (skills.length > 0 && config.githubToken) {
    console.log(chalk.white('\n   备份技能：'));
    console.log(chalk.gray('   clawpack push         备份技能（快速）'));
    console.log(chalk.gray('   clawpack backup       完整配置备份（推荐）'));
    console.log(chalk.gray('   clawpack backup --full --workspace  包含工作区文件'));
  }
  
  if (config.defaultGistId) {
    console.log(chalk.white('\n   恢复配置：'));
    console.log(chalk.gray('   clawpack pull         恢复技能'));
    console.log(chalk.gray('   clawpack restore --full   恢复完整配置'));
  }
  
  console.log(chalk.green('\n✓ 初始化完成！'));
  console.log(chalk.gray('\n配置保存位置：~/.config/clawpack/config.json'));
  
  // Smart suggestion
  if (skills.length > 0 && config.githubToken && !config.defaultGistId) {
    console.log(chalk.yellow('\n💡 建议：'));
    console.log(chalk.gray('   首次备份推荐运行：clawpack backup --full'));
    console.log(chalk.gray('   这将备份技能 + 所有配置 + 工作区文件'));
  }
}
