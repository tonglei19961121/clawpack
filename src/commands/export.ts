import chalk from 'chalk';
import { writeFile } from 'fs/promises';
import { scanLocalSkills, type SkillsManifest } from '../config.js';

export async function exportCommand(options: { output?: string }): Promise<void> {
  const outputFile = options.output || 'clawpack.json';
  
  console.log(chalk.blue('📦 Scanning local skills...'));
  const skills = await scanLocalSkills();
  
  const manifest: SkillsManifest = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    platform: 'openclaw',
    skills,
  };
  
  await writeFile(outputFile, JSON.stringify(manifest, null, 2));
  
  console.log(chalk.green(`✓ Exported ${skills.length} skill(s) to ${outputFile}`));
}
