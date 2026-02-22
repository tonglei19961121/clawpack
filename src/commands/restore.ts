import chalk from 'chalk';
import { getConfig, saveConfig, installSkill, getProfile } from '../config.js';
import { 
  restoreFullBackup, 
  restoreWorkspaceFiles,
  readOpenClawConfig,
  type FullBackupManifest 
} from '../backup.js';
import { getGist, getFromRepo } from '../github.js';

export async function restoreCommand(
  source?: string, 
  options?: { 
    full?: boolean; 
    workspace?: boolean;
    skipChannels?: boolean;
    skipAgents?: boolean;
    yes?: boolean;
  }
): Promise<void> {
  const config = await getConfig();
  
  if (!config.githubToken) {
    console.log(chalk.red('❌ GitHub Token 未配置'));
    console.log(chalk.yellow('请先运行：clawpack init'));
    process.exit(1);
  }
  
  // Resolve source - could be a profile name or gist ID
  let resolvedSource = source;
  let profileName: string | undefined;
  
  if (source) {
    // Check if source is a profile name
    const profile = getProfile(config, source);
    if (profile) {
      resolvedSource = profile.gistId;
      profileName = source;
      console.log(chalk.blue(`💡 使用配置 "${source}" (Gist: ${resolvedSource})`));
    }
  } else {
    // Auto-detect source
    const activeProfile = getProfile(config);
    if (activeProfile) {
      resolvedSource = activeProfile.gistId;
      profileName = config.activeProfile;
      console.log(chalk.blue(`💡 使用默认配置 "${profileName}"`));
    } else if (config.defaultGistId) {
      resolvedSource = config.defaultGistId;
      console.log(chalk.blue(`💡 使用默认 Gist: ${resolvedSource}`));
    }
  }
  
  if (!resolvedSource) {
    console.log(chalk.red('❌ 未提供恢复来源'));
    console.log(chalk.yellow('请提供 Gist ID、昵称或仓库：'));
    console.log(chalk.cyan('  clawpack restore <gist-id>'));
    console.log(chalk.cyan('  clawpack restore <nickname>     # 使用配置的昵称'));
    console.log(chalk.cyan('  clawpack restore user/repo'));
    console.log(chalk.gray('\n使用 "clawpack profile list" 查看所有配置'));
    process.exit(1);
  }
  
  console.log(chalk.blue(`📥 正在从 ${resolvedSource} 下载...`));
  
  let manifest: any;
  try {
    if (resolvedSource.includes('/')) {
      manifest = await getFromRepo(config.githubToken, resolvedSource);
    } else {
      manifest = await getGist(config.githubToken, resolvedSource);
    }
  } catch (error) {
    console.error(chalk.red('❌ 下载失败：'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  console.log(chalk.green(`✓ 下载成功`));
  console.log(chalk.gray(`  备份类型：${manifest.type === 'full' ? '完整配置' : '仅技能'}`));
  console.log(chalk.gray(`  备份时间：${new Date(manifest.exportedAt).toLocaleString()}`));
  
  // Save as default
  if (!resolvedSource.includes('/')) {
    config.defaultGistId = resolvedSource;
    await saveConfig(config);
  }
  
  const isFullBackup = options?.full || manifest.type === 'full';
  
  // Restore skills (always)
  if (manifest.skills?.length > 0) {
    console.log(chalk.blue(`\n📦 恢复技能 (${manifest.skills.length} 个)...`));
    
    const installed: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];
    
    for (const skill of manifest.skills) {
      process.stdout.write(chalk.gray(`  ${skill.name}... `));
      
      try {
        await installSkill(skill.name, skill.source);
        console.log(chalk.green('✓'));
        installed.push(skill.name);
      } catch (error: any) {
        if (error.message?.includes('already installed')) {
          console.log(chalk.yellow('已存在'));
          skipped.push(skill.name);
        } else {
          console.log(chalk.red('✗'));
          failed.push(skill.name);
        }
      }
    }
    
    console.log(chalk.gray(`   新安装：${installed.length}，已存在：${skipped.length}，失败：${failed.length}`));
  }
  
  // Restore configuration
  if (isFullBackup && manifest.config) {
    console.log(chalk.blue('\n🔧 恢复配置...'));
    
    const currentConfig = await readOpenClawConfig();
    
    if (manifest.config.agents && !options?.skipAgents) {
      console.log(chalk.gray('  • 代理配置'));
    }
    
    if (manifest.config.channels && !options?.skipChannels) {
      const channelCount = Object.keys(manifest.config.channels).length;
      console.log(chalk.gray(`  • 通道配置 (${channelCount} 个)`));
      console.log(chalk.yellow('    ⚠ 注意：通道配置包含敏感信息，可能需要手动填写 appSecret'));
    }
    
    if (manifest.config.plugins) {
      console.log(chalk.gray('  • 插件配置'));
    }
    
    await restoreFullBackup(manifest as FullBackupManifest, {
      merge: true,
      skipChannels: options?.skipChannels,
      skipAgents: options?.skipAgents,
    });
    
    console.log(chalk.green('✓ 配置已恢复'));
  }
  
  // Restore workspace files
  const hasWorkspaceFiles = manifest._workspaceFiles && Object.keys(manifest._workspaceFiles).length > 0;
  if ((options?.workspace || isFullBackup) && hasWorkspaceFiles) {
    console.log(chalk.blue('\n📁 恢复工作区文件...'));
    
    const files = manifest._workspaceFiles!;
    const fileNames = Object.keys(files);
    
    console.log(chalk.gray(`  即将恢复 ${fileNames.length} 个文件：`));
    for (const name of fileNames) {
      console.log(chalk.gray(`    • ${name}`));
    }
    
    await restoreWorkspaceFiles(files);
    console.log(chalk.green('✓ 工作区文件已恢复'));
  }
  
  // Summary
  console.log(chalk.blue('\n📊 恢复完成'));
  if (profileName) {
    console.log(chalk.green(`  来源配置：${profileName}`));
  }
  console.log(chalk.yellow('\n💡 提示：'));
  
  if (manifest.skills?.length > 0) {
    console.log(chalk.cyan('  openclaw gateway restart    # 重启以加载新技能'));
  }
  
  if (isFullBackup && manifest.config?.channels && !options?.skipChannels) {
    console.log(chalk.cyan('  openclaw config edit        # 检查并填写通道密钥'));
  }
  
  console.log(chalk.gray('\n你的 OpenClaw 配置已同步完成！'));
}
