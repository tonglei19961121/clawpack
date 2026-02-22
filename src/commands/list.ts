import chalk from 'chalk';
import { scanLocalSkills } from '../config.js';

export async function listCommand(): Promise<void> {
  console.log(chalk.blue('🔍 Scanning local OpenClaw skills...\n'));
  
  const skills = await scanLocalSkills();
  
  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found'));
    console.log(chalk.gray('Skills should be installed in ~/.openclaw/extensions/'));
    return;
  }
  
  console.log(chalk.green(`Found ${skills.length} skill(s):\n`));
  
  // Group by source type
  const npmSkills = skills.filter(s => s.source.startsWith('npm:'));
  const localSkills = skills.filter(s => s.source === 'local');
  const otherSkills = skills.filter(s => !s.source.startsWith('npm:') && s.source !== 'local');
  
  if (npmSkills.length > 0) {
    console.log(chalk.cyan('📦 NPM Packages:'));
    for (const skill of npmSkills) {
      const version = skill.version ? chalk.gray(`@${skill.version}`) : '';
      console.log(chalk.white(`  • ${skill.name}${version}`));
      console.log(chalk.gray(`    ${skill.source}`));
    }
    console.log();
  }
  
  if (localSkills.length > 0) {
    console.log(chalk.cyan('📁 Local Extensions:'));
    for (const skill of localSkills) {
      console.log(chalk.white(`  • ${skill.name}`));
    }
    console.log();
  }
  
  if (otherSkills.length > 0) {
    console.log(chalk.cyan('🔌 Other:'));
    for (const skill of otherSkills) {
      console.log(chalk.white(`  • ${skill.name}`));
      console.log(chalk.gray(`    ${skill.source}`));
    }
    console.log();
  }
}
