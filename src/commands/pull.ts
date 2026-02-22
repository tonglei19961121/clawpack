import chalk from 'chalk';
import { getConfig, saveConfig, installSkill, type SkillsManifest } from '../config.js';
import { getGist, getFromRepo } from '../github.js';

export async function pullCommand(source?: string, options?: { force?: boolean; yes?: boolean }): Promise<void> {
  const config = await getConfig();
  
  if (!config.githubToken) {
    console.log(chalk.red('❌ GitHub Token 未配置'));
    console.log(chalk.yellow('请先运行：clawpack init'));
    process.exit(1);
  }
  
  // Auto-detect source if not provided
  if (!source) {
    if (config.defaultGistId) {
      console.log(chalk.blue(`💡 发现之前的备份：${config.defaultGistId}`));
      
      if (!options?.yes) {
        // Note: In real implementation, we'd use inquirer here
        // For now, we proceed automatically
        console.log(chalk.gray('   正在恢复... (使用 --yes 自动确认)'));
      }
      source = config.defaultGistId;
    } else {
      console.log(chalk.red('❌ 未提供恢复来源'));
      console.log(chalk.yellow('请提供 Gist ID 或仓库：'));
      console.log(chalk.cyan('  clawpack pull <gist-id>'));
      console.log(chalk.cyan('  clawpack pull user/repo'));
      process.exit(1);
    }
  }
  
  console.log(chalk.blue(`📥 正在从 ${source} 下载...`));
  
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
    console.error(chalk.red('❌ 下载失败：'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  console.log(chalk.green(`✓ 下载成功，共 ${manifest.skills.length} 个技能`));
  console.log(chalk.gray(`  平台：${manifest.platform}`));
  console.log(chalk.gray(`  备份时间：${new Date(manifest.exportedAt).toLocaleString()}`));
  
  if (manifest.skills.length === 0) {
    console.log(chalk.yellow('\n⚠ 备份中没有技能'));
    return;
  }
  
  // Show what will be installed
  console.log(chalk.blue('\n📋 技能清单：'));
  for (const skill of manifest.skills) {
    console.log(chalk.gray(`  • ${skill.name} (${skill.source})`));
  }
  
  // Install skills
  console.log(chalk.blue('\n📦 开始安装...\n'));
  
  const installed: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];
  
  for (const skill of manifest.skills) {
    const name = skill.name;
    process.stdout.write(chalk.gray(`  安装 ${name}... `));
    
    try {
      await installSkill(name, skill.source);
      console.log(chalk.green('✓'));
      installed.push(name);
    } catch (error: any) {
      if (error.message?.includes('already installed') || error.message?.includes('already exists')) {
        console.log(chalk.yellow('已安装'));
        skipped.push(name);
      } else {
        console.log(chalk.red('✗'));
        console.error(chalk.gray(`    ${error.message}`));
        failed.push(name);
      }
    }
  }
  
  // Summary
  console.log(chalk.blue('\n📊 安装结果：'));
  console.log(chalk.green(`  ✓ 新安装：${installed.length}`));
  if (skipped.length > 0) {
    console.log(chalk.yellow(`  ⚠ 已存在：${skipped.length}`));
  }
  if (failed.length > 0) {
    console.log(chalk.red(`  ✗ 失败：${failed.length}`));
  }
  
  // Save as default for future pulls
  if (!source.includes('/')) {
    config.defaultGistId = source;
    await saveConfig(config);
  }
  
  // Smart next steps
  if (installed.length > 0) {
    console.log(chalk.yellow('\n💡 提示：'));
    console.log(chalk.cyan('  openclaw gateway restart    # 重启以加载新技能'));
  } else if (skipped.length === manifest.skills.length) {
    console.log(chalk.green('\n✓ 所有技能都已是最新'));
  }
  
  if (failed.length > 0) {
    console.log(chalk.yellow('\n💡 失败的技能可以手动安装：'));
    for (const name of failed) {
      console.log(chalk.cyan(`  openclaw plugins install ${name}`));
    }
  }
}
