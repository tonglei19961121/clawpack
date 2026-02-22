import chalk from 'chalk';
import { getConfig, saveConfig } from '../config.js';
import { 
  createFullBackup, 
  backupWorkspaceFiles, 
  type FullBackupManifest 
} from '../backup.js';
import { createGist, updateGist, pushToRepo } from '../github.js';

export async function backupCommand(options: { 
  full?: boolean; 
  workspace?: boolean; 
  sensitive?: boolean;
  repo?: string;
}): Promise<void> {
  const config = await getConfig();
  
  if (!config.githubToken) {
    console.log(chalk.red('❌ GitHub Token 未配置'));
    console.log(chalk.yellow('请先运行：clawpack init'));
    process.exit(1);
  }
  
  console.log(chalk.blue('📦 正在创建备份...\n'));
  
  try {
    let manifest: FullBackupManifest;
    
    if (options.full) {
      console.log(chalk.cyan('🔧 完整配置备份模式'));
      manifest = await createFullBackup(options.sensitive);
      
      console.log(chalk.green(`✓ 已备份配置：`));
      if (manifest.config.agents) console.log(chalk.gray('  • 代理配置'));
      if (manifest.config.channels) console.log(chalk.gray(`  • 通道配置 (${Object.keys(manifest.config.channels).length} 个)`));
      if (manifest.config.plugins) console.log(chalk.gray('  • 插件配置'));
      if (manifest.config.commands) console.log(chalk.gray('  • 命令设置'));
      if (manifest.config.hooks) console.log(chalk.gray('  • 钩子配置'));
      
      if (!options.sensitive) {
        console.log(chalk.yellow('\n⚠  敏感信息已排除（使用 --sensitive 包含）'));
      }
    } else {
      // Skills-only backup (original behavior)
      const { scanLocalSkills } = await import('../config.js');
      const skills = await scanLocalSkills();
      
      manifest = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        platform: 'openclaw',
        type: 'skills-only',
        config: {},
        skills,
      };
      
      console.log(chalk.green(`✓ 已备份 ${skills.length} 个技能`));
    }
    
    // Backup workspace files if requested
    let workspaceFiles: Record<string, string> | undefined;
    if (options.workspace || options.full) {
      console.log(chalk.cyan('\n📁 备份工作区文件...'));
      workspaceFiles = await backupWorkspaceFiles();
      const fileNames = Object.keys(workspaceFiles);
      if (fileNames.length > 0) {
        console.log(chalk.green(`✓ 已备份 ${fileNames.length} 个文件：`));
        for (const name of fileNames) {
          console.log(chalk.gray(`  • ${name}`));
        }
      } else {
        console.log(chalk.yellow('⚠  未发现工作区文件'));
      }
    }
    
    // Upload to GitHub
    console.log(chalk.blue('\n📤 上传到 GitHub...'));
    
    const fullManifest = {
      ...manifest,
      _workspaceFiles: workspaceFiles,
    };
    
    let location: string;
    
    if (options.repo) {
      await pushToRepo(config.githubToken, options.repo, fullManifest as any);
      location = options.repo;
      console.log(chalk.green(`✓ 已推送到仓库：${location}`));
    } else {
      if (config.defaultGistId) {
        await updateGist(config.githubToken, config.defaultGistId, fullManifest as any);
        location = config.defaultGistId;
        console.log(chalk.green(`✓ 已更新 Gist：${location}`));
      } else {
        const gistId = await createGist(config.githubToken, fullManifest as any);
        config.defaultGistId = gistId;
        await saveConfig(config);
        location = gistId;
        console.log(chalk.green(`✓ 已创建 Gist：${location}`));
      }
    }
    
    // Summary
    console.log(chalk.blue('\n📊 备份摘要：'));
    console.log(chalk.green(`  类型：${options.full ? '完整配置' : '仅技能'}`));
    console.log(chalk.green(`  技能：${manifest.skills.length} 个`));
    if (options.full) {
      const configSections = Object.keys(manifest.config).length;
      console.log(chalk.green(`  配置：${configSections} 个模块`));
    }
    if (workspaceFiles) {
      console.log(chalk.green(`  文件：${Object.keys(workspaceFiles).length} 个`));
    }
    
    console.log(chalk.yellow('\n💡 恢复命令：'));
    console.log(chalk.cyan(`  clawpack restore ${location}${options.full ? ' --full' : ''}`));
    
  } catch (error) {
    console.error(chalk.red('❌ 备份失败：'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
