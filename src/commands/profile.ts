import chalk from 'chalk';
import { getConfig, saveConfig, addProfile, removeProfile, setActiveProfile, listProfiles, getProfile } from '../config.js';

export async function profileCommand(action: string, ...args: string[]): Promise<void> {
  const config = await getConfig();
  
  switch (action) {
    case 'list':
    case 'ls':
      await listCommand();
      break;
      
    case 'add':
      if (args.length < 2) {
        console.log(chalk.red('❌ 用法: clawpack profile add <昵称> <gist-id> [描述]'));
        process.exit(1);
      }
      await addCommand(args[0], args[1], args.slice(2).join(' '));
      break;
      
    case 'remove':
    case 'rm':
      if (args.length < 1) {
        console.log(chalk.red('❌ 用法: clawpack profile remove <昵称>'));
        process.exit(1);
      }
      await removeCommand(args[0]);
      break;
      
    case 'use':
      if (args.length < 1) {
        console.log(chalk.red('❌ 用法: clawpack profile use <昵称>'));
        process.exit(1);
      }
      await useCommand(args[0]);
      break;
      
    case 'show':
      if (args.length < 1) {
        console.log(chalk.red('❌ 用法: clawpack profile show <昵称>'));
        process.exit(1);
      }
      await showCommand(args[0]);
      break;
      
    default:
      showHelp();
  }
}

function showHelp(): void {
  console.log(chalk.blue('📋 Profile 管理命令'));
  console.log('');
  console.log(chalk.gray('用法:'));
  console.log('  clawpack profile list              列出所有配置');
  console.log('  clawpack profile add <昵称> <gist-id> [描述]  添加新配置');
  console.log('  clawpack profile remove <昵称>     删除配置');
  console.log('  clawpack profile use <昵称>        切换到指定配置');
  console.log('  clawpack profile show <昵称>       查看配置详情');
  console.log('');
  console.log(chalk.gray('示例:'));
  console.log('  clawpack profile add work-mac abc123 "公司 MacBook"');
  console.log('  clawpack profile add home-pc def456 "家用电脑"');
  console.log('  clawpack profile use work-mac');
  console.log('  clawpack backup --profile work-mac');
}

async function listCommand(): Promise<void> {
  const config = await getConfig();
  const profiles = listProfiles(config);
  
  if (profiles.length === 0) {
    console.log(chalk.yellow('⚠️  暂无配置'));
    console.log(chalk.gray('   使用 "clawpack profile add" 添加配置'));
    return;
  }
  
  console.log(chalk.blue(`📋 共有 ${profiles.length} 个配置:\n`));
  
  for (const { name, profile, isActive } of profiles) {
    const activeMarker = isActive ? chalk.green(' ★ 当前使用') : '';
    console.log(chalk.cyan(`${isActive ? '▶' : ' '} ${name}${activeMarker}`));
    console.log(chalk.gray(`   Gist ID: ${profile.gistId}`));
    if (profile.description) {
      console.log(chalk.gray(`   描述: ${profile.description}`));
    }
    if (profile.lastBackup) {
      console.log(chalk.gray(`   上次备份: ${new Date(profile.lastBackup).toLocaleString()}`));
    }
    console.log('');
  }
  
  console.log(chalk.gray('提示:'));
  console.log(chalk.gray('  • 使用 "clawpack profile use <昵称>" 切换默认配置'));
  console.log(chalk.gray('  • 使用 "clawpack backup --profile <昵称>" 推送到指定配置'));
}

async function addCommand(name: string, gistId: string, description?: string): Promise<void> {
  const config = await getConfig();
  
  // Validate gistId format (should be hex string)
  if (!/^[a-f0-9]{32}$/.test(gistId)) {
    console.log(chalk.red('❌ 无效的 Gist ID 格式'));
    console.log(chalk.gray('   Gist ID 应该是 32 位十六进制字符串'));
    process.exit(1);
  }
  
  // Check if profile already exists
  if (config.profiles?.[name]) {
    console.log(chalk.yellow(`⚠️  配置 "${name}" 已存在，将覆盖`));
  }
  
  await addProfile(config, name, gistId, description);
  
  console.log(chalk.green(`✅ 配置 "${name}" 添加成功！`));
  console.log(chalk.gray(`   Gist ID: ${gistId}`));
  if (description) {
    console.log(chalk.gray(`   描述: ${description}`));
  }
  
  // If this is the first profile, set it as active
  if (!config.activeProfile) {
    await setActiveProfile(config, name);
    console.log(chalk.cyan(`\n💡 已自动设为默认配置`));
  }
  
  console.log(chalk.gray(`\n使用:`));
  console.log(chalk.gray(`  clawpack profile use ${name}     切换到此配置`));
  console.log(chalk.gray(`  clawpack backup --profile ${name}  推送到此配置`));
  console.log(chalk.gray(`  clawpack restore ${name}          从此配置恢复`));
}

async function removeCommand(name: string): Promise<void> {
  const config = await getConfig();
  
  const success = await removeProfile(config, name);
  
  if (success) {
    console.log(chalk.green(`✅ 配置 "${name}" 已删除`));
  } else {
    console.log(chalk.red(`❌ 配置 "${name}" 不存在`));
    process.exit(1);
  }
}

async function useCommand(name: string): Promise<void> {
  const config = await getConfig();
  
  const success = await setActiveProfile(config, name);
  
  if (success) {
    const profile = getProfile(config, name);
    console.log(chalk.green(`✅ 已切换到配置 "${name}"`));
    console.log(chalk.gray(`   Gist ID: ${profile?.gistId}`));
    console.log(chalk.gray(`\n后续操作将使用此配置:`));
    console.log(chalk.gray(`  clawpack backup     推送到 ${name}`));
    console.log(chalk.gray(`  clawpack restore    从 ${name} 恢复`));
  } else {
    console.log(chalk.red(`❌ 配置 "${name}" 不存在`));
    console.log(chalk.gray('   使用 "clawpack profile list" 查看所有配置'));
    process.exit(1);
  }
}

async function showCommand(name: string): Promise<void> {
  const config = await getConfig();
  const profile = getProfile(config, name);
  
  if (!profile) {
    console.log(chalk.red(`❌ 配置 "${name}" 不存在`));
    process.exit(1);
  }
  
  const isActive = config.activeProfile === name;
  
  console.log(chalk.blue(`📋 配置详情: ${name}${isActive ? chalk.green(' (当前使用)') : ''}`));
  console.log('');
  console.log(chalk.gray(`Gist ID:    ${profile.gistId}`));
  console.log(chalk.gray(`描述:       ${profile.description || '无'}`));
  console.log(chalk.gray(`上次备份:   ${profile.lastBackup ? new Date(profile.lastBackup).toLocaleString() : '从未'}`));
  console.log('');
  console.log(chalk.gray('GitHub 链接:'));
  console.log(chalk.cyan(`  https://gist.github.com/${profile.gistId}`));
}
