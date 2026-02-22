import chalk from 'chalk';
import { createWriteStream } from 'fs';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import archiver from 'archiver';
import { scanLocalSkills } from '../config.js';

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

export async function packCommand(outputFile?: string): Promise<void> {
  const output = outputFile || `clawpack-backup-${Date.now()}.zip`;
  
  console.log(chalk.blue('📦 正在打包 OpenClaw 配置...\n'));
  
  // Scan what we have
  const skills = await scanLocalSkills();
  const openclawDir = join(homedir(), '.openclaw');
  const workspaceDir = join(openclawDir, 'workspace');
  
  console.log(chalk.cyan('🔍 扫描内容：'));
  
  // Check main config
  let hasConfig = false;
  try {
    await stat(join(openclawDir, 'openclaw.json'));
    hasConfig = true;
    console.log(chalk.gray('  ✓ 主配置文件'));
  } catch {
    console.log(chalk.yellow('  ⚠ 未找到主配置文件'));
  }
  
  // Check skills
  console.log(chalk.gray(`  ✓ ${skills.length} 个技能`));
  
  // Check workspace files
  const workspaceFiles: string[] = [];
  try {
    const files = await readdir(workspaceDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        workspaceFiles.push(file);
      }
    }
    console.log(chalk.gray(`  ✓ ${workspaceFiles.length} 个工作区文件`));
  } catch {
    console.log(chalk.gray('  ℹ 无工作区文件'));
  }
  
  // Create archive
  console.log(chalk.cyan('\n📁 创建归档...'));
  
  const outputStream = createWriteStream(output);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(outputStream);
  
  // Add manifest
  const manifest: PackManifest = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    platform: 'openclaw',
    clawpackVersion: '1.2.3',
    contents: {
      config: hasConfig,
      skills: skills.map(s => s.name),
      workspaceFiles,
    },
  };
  
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  
  // Add main config
  if (hasConfig) {
    archive.file(join(openclawDir, 'openclaw.json'), { name: 'config/openclaw.json' });
  }
  
  // Add skills (extensions)
  const extensionsDir = join(openclawDir, 'extensions');
  for (const skill of skills) {
    const skillDir = join(extensionsDir, skill.name);
    try {
      await stat(skillDir);
      archive.directory(skillDir, `skills/${skill.name}`);
    } catch {
      // Skill not in extensions dir (might be built-in)
    }
  }
  
  // Add workspace files
  for (const file of workspaceFiles) {
    archive.file(join(workspaceDir, file), { name: `workspace/${file}` });
  }
  
  await archive.finalize();
  
  // Wait for stream to finish
  await new Promise<void>((resolve, reject) => {
    outputStream.on('close', () => resolve());
    outputStream.on('error', reject);
  });
  
  // Get file size
  const stats = await stat(output);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(chalk.green(`\n✓ 打包完成！`));
  console.log(chalk.cyan(`📄 文件：${output}`));
  console.log(chalk.gray(`   大小：${sizeMB} MB`));
  console.log(chalk.gray(`   内容：${skills.length} 个技能 + ${workspaceFiles.length} 个文件`));
  
  console.log(chalk.yellow('\n💡 如何使用：'));
  console.log(chalk.gray('   1. 将文件复制到新设备'));
  console.log(chalk.gray(`   2. 运行：clawpack unpack ${output}`));
  console.log(chalk.gray('   3. 完成！无需 GitHub 账号'));
}
