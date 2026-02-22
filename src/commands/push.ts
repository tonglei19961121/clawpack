import chalk from 'chalk';
import { getConfig, saveConfig, scanLocalSkills, type SkillsManifest, addProfile, getProfile } from '../config.js';
import { createGist, updateGist, pushToRepo } from '../github.js';

export async function pushCommand(options: { gist?: boolean; repo?: string; profile?: string }): Promise<void> {
  const config = await getConfig();
  
  if (!config.githubToken) {
    console.log(chalk.red('❌ GitHub Token 未配置'));
    console.log(chalk.yellow('请先运行：clawpack init'));
    console.log(chalk.gray('或设置环境变量：export GITHUB_TOKEN=你的token'));
    process.exit(1);
  }
  
  // Determine target profile
  let targetProfileName = options.profile;
  let gistId: string | undefined;
  
  if (targetProfileName) {
    const profile = getProfile(config, targetProfileName);
    if (!profile) {
      console.log(chalk.red(`❌ 配置 "${targetProfileName}" 不存在`));
      console.log(chalk.gray('   使用 "clawpack profile list" 查看所有配置'));
      console.log(chalk.gray('   或使用 "clawpack profile add" 添加新配置'));
      process.exit(1);
    }
    gistId = profile.gistId;
    console.log(chalk.blue(`📦 使用配置 "${targetProfileName}"`));
  } else {
    gistId = config.defaultGistId;
  }
  
  console.log(chalk.blue('📦 正在扫描本地技能...'));
  const skills = await scanLocalSkills();
  
  if (skills.length === 0) {
    console.log(chalk.yellow('⚠  未发现技能'));
    console.log(chalk.gray('你可能需要先安装一些 OpenClaw 技能'));
    console.log(chalk.gray('例如：openclaw plugins install @openclaw/github'));
    return;
  }
  
  console.log(chalk.green(`✓ 发现 ${skills.length} 个技能`));
  console.log(chalk.gray('  即将备份：'));
  for (const skill of skills.slice(0, 5)) {
    console.log(chalk.gray(`    • ${skill.name}`));
  }
  if (skills.length > 5) {
    console.log(chalk.gray(`    ... 还有 ${skills.length - 5} 个`));
  }
  
  const manifest: SkillsManifest = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    platform: 'openclaw',
    skills,
  };
  
  try {
    if (options.repo) {
      // Push to repository
      console.log(chalk.blue(`\n📤 推送到仓库 ${options.repo}...`));
      await pushToRepo(config.githubToken, options.repo, manifest);
      console.log(chalk.green(`✓ 推送成功！`));
      console.log(chalk.gray(`  仓库：${options.repo}`));
    } else {
      // Use Gist
      if (gistId) {
        console.log(chalk.blue(`\n📤 更新 Gist...`));
        await updateGist(config.githubToken, gistId, manifest);
        console.log(chalk.green('✓ 更新成功！'));
        console.log(chalk.gray(`  Gist ID：${gistId}`));
        
        // Update profile's lastBackup if using a named profile
        if (targetProfileName) {
          await addProfile(config, targetProfileName, gistId, 
            getProfile(config, targetProfileName)?.description);
        }
      } else {
        console.log(chalk.blue('\n📤 创建新 Gist...'));
        const newGistId = await createGist(config.githubToken, manifest);
        
        if (targetProfileName) {
          // Update existing profile
          await addProfile(config, targetProfileName, newGistId,
            getProfile(config, targetProfileName)?.description);
        } else {
          // Save as default
          config.defaultGistId = newGistId;
          await saveConfig(config);
        }
        
        console.log(chalk.green('✓ 创建成功！'));
        console.log(chalk.cyan(`  Gist ID：${newGistId}`));
        gistId = newGistId;
      }
    }
    
    // Summary and next steps
    console.log(chalk.blue('\n📊 备份摘要：'));
    console.log(chalk.green(`  ✓ 技能数量：${skills.length}`));
    console.log(chalk.gray(`  ✓ 备份时间：${new Date().toLocaleString()}`));
    
    if (!options.repo) {
      console.log(chalk.yellow('\n💡 在其他设备恢复：'));
      if (targetProfileName) {
        console.log(chalk.cyan(`  clawpack restore ${targetProfileName}`));
        console.log(chalk.gray(`   或: clawpack pull ${gistId}`));
      } else {
        console.log(chalk.cyan(`  clawpack pull ${gistId}`));
        console.log(chalk.gray('   或使用昵称: clawpack profile add my-nick ' + gistId));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 备份失败：'), error instanceof Error ? error.message : error);
    console.log(chalk.gray('\n可能的原因：'));
    console.log(chalk.gray('  • GitHub Token 权限不足（需要 gist 权限）'));
    console.log(chalk.gray('  • 网络连接问题'));
    console.log(chalk.gray('  • GitHub API 限制'));
    process.exit(1);
  }
}
