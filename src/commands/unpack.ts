import chalk from 'chalk';
import { createReadStream } from 'fs';
import { readFile, writeFile, mkdir, readdir, cp, rm } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { extract } from 'tar';
interface PackManifest {
  version: string;
  createdAt: string;
  platform: string;
  clawpackVersion: string;
  contents: {
    config: boolean;
    skills: string[];
    workspaceFiles: string[];
  };
}

export async function unpackCommand(inputFile: string): Promise<void> {
  if (!inputFile) {
    console.log(chalk.red('❌ 请指定要解压的文件'));
    console.log(chalk.gray('   例如：clawpack unpack clawpack-backup-123.zip'));
    process.exit(1);
  }
  
  if (!inputFile.endsWith('.zip') && !inputFile.endsWith('.tar.gz')) {
    console.log(chalk.red('❌ 不支持的文件格式'));
    console.log(chalk.gray('   支持的格式：.zip, .tar.gz'));
    process.exit(1);
  }
  
  console.log(chalk.blue(`📦 正在解压 ${inputFile}...\n`));
  
  const tempDir = join(homedir(), '.clawpack-temp', Date.now().toString());
  await mkdir(tempDir, { recursive: true });
  
  try {
    // Extract archive
    console.log(chalk.cyan('📁 解压归档...'));
    
    if (inputFile.endsWith('.zip')) {
      // For zip files, we'd need to use a different library
      // For now, let's use system unzip
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync(`unzip -q "${inputFile}" -d "${tempDir}"`);
    } else {
      await extract({
        file: inputFile,
        cwd: tempDir,
      });
    }
    
    // Read manifest
    console.log(chalk.cyan('📋 读取清单...'));
    const manifestContent = await readFile(join(tempDir, 'manifest.json'), 'utf-8');
    const manifest: PackManifest = JSON.parse(manifestContent);
    
    console.log(chalk.green(`✓ 发现备份：${manifest.createdAt}`));
    console.log(chalk.gray(`   包含：${manifest.contents.skills.length} 个技能`));
    console.log(chalk.gray(`   文件：${manifest.contents.workspaceFiles.length} 个`));
    
    // Confirm
    console.log(chalk.yellow('\n⚠️  这将覆盖你当前的 OpenClaw 配置！'));
    console.log(chalk.gray('   建议在执行前备份当前配置'));
    
    // Restore
    const openclawDir = join(homedir(), '.openclaw');
    const workspaceDir = join(openclawDir, 'workspace');
    const extensionsDir = join(openclawDir, 'extensions');
    
    // Restore config
    if (manifest.contents.config) {
      console.log(chalk.cyan('\n🔧 恢复配置...'));
      const configPath = join(tempDir, 'config', 'openclaw.json');
      try {
        await readFile(configPath);
        await mkdir(openclawDir, { recursive: true });
        await cp(configPath, join(openclawDir, 'openclaw.json'), { force: true });
        console.log(chalk.green('✓ 配置已恢复'));
      } catch {
        console.log(chalk.yellow('⚠ 配置恢复失败'));
      }
    }
    
    // Restore skills
    if (manifest.contents.skills.length > 0) {
      console.log(chalk.cyan('\n📦 恢复技能...'));
      await mkdir(extensionsDir, { recursive: true });
      
      for (const skillName of manifest.contents.skills) {
        const skillSource = join(tempDir, 'skills', skillName);
        const skillTarget = join(extensionsDir, skillName);
        
        try {
          await readFile(skillSource);
          await cp(skillSource, skillTarget, { recursive: true, force: true });
          console.log(chalk.gray(`  ✓ ${skillName}`));
        } catch {
          console.log(chalk.yellow(`  ⚠ ${skillName} (跳过)`));
        }
      }
    }
    
    // Restore workspace files
    if (manifest.contents.workspaceFiles.length > 0) {
      console.log(chalk.cyan('\n📁 恢复工作区文件...'));
      await mkdir(workspaceDir, { recursive: true });
      
      for (const file of manifest.contents.workspaceFiles) {
        const fileSource = join(tempDir, 'workspace', file);
        const fileTarget = join(workspaceDir, file);
        
        try {
          await cp(fileSource, fileTarget, { force: true });
          console.log(chalk.gray(`  ✓ ${file}`));
        } catch {
          console.log(chalk.yellow(`  ⚠ ${file} (跳过)`));
        }
      }
    }
    
    console.log(chalk.green('\n✓ 恢复完成！'));
    console.log(chalk.yellow('\n💡 提示：'));
    console.log(chalk.cyan('   openclaw gateway restart    # 重启以生效'));
    
  } finally {
    // Cleanup temp dir
    await rm(tempDir, { recursive: true, force: true });
  }
}
