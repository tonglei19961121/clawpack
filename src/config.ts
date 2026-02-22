import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir, readdir, access } from 'fs/promises';

export interface Profile {
  gistId: string;
  description?: string;
  lastBackup?: string;
}

export interface ClawpackConfig {
  githubToken?: string;
  defaultGistId?: string; // 兼容旧版本
  profiles?: Record<string, Profile>;
  activeProfile?: string;
}

export interface Skill {
  name: string;
  source: string;
  version?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export interface SkillsManifest {
  version: string;
  exportedAt: string;
  platform: string;
  skills: Skill[];
}

const CLAWPACK_DIR = join(homedir(), '.config', 'clawpack');
const CONFIG_FILE = join(CLAWPACK_DIR, 'config.json');

export async function getConfig(): Promise<ClawpackConfig> {
  let config: ClawpackConfig = {};
  
  // Read from config file
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    config = JSON.parse(data);
    
    // Migration: convert old defaultGistId to profiles
    if (config.defaultGistId && !config.profiles) {
      config.profiles = {
        default: {
          gistId: config.defaultGistId,
          description: 'Default backup',
          lastBackup: new Date().toISOString()
        }
      };
      config.activeProfile = 'default';
    }
  } catch {
    // Config file doesn't exist or is invalid
  }
  
  // Environment variable takes priority
  const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (envToken) {
    config.githubToken = envToken;
  }
  
  return config;
}

export async function saveConfig(config: ClawpackConfig): Promise<void> {
  await mkdir(CLAWPACK_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Profile management
export async function addProfile(
  config: ClawpackConfig, 
  name: string, 
  gistId: string, 
  description?: string
): Promise<void> {
  if (!config.profiles) {
    config.profiles = {};
  }
  
  config.profiles[name] = {
    gistId,
    description: description || `Backup profile: ${name}`,
    lastBackup: new Date().toISOString()
  };
  
  await saveConfig(config);
}

export async function removeProfile(config: ClawpackConfig, name: string): Promise<boolean> {
  if (!config.profiles || !config.profiles[name]) {
    return false;
  }
  
  delete config.profiles[name];
  
  // If we removed the active profile, clear it
  if (config.activeProfile === name) {
    config.activeProfile = undefined;
  }
  
  await saveConfig(config);
  return true;
}

export async function setActiveProfile(config: ClawpackConfig, name: string): Promise<boolean> {
  if (!config.profiles || !config.profiles[name]) {
    return false;
  }
  
  config.activeProfile = name;
  await saveConfig(config);
  return true;
}

export function getProfile(config: ClawpackConfig, name?: string): Profile | null {
  if (!config.profiles) {
    return null;
  }
  
  const profileName = name || config.activeProfile;
  if (!profileName) {
    return null;
  }
  
  return config.profiles[profileName] || null;
}

export function getActiveGistId(config: ClawpackConfig): string | undefined {
  const profile = getProfile(config);
  return profile?.gistId || config.defaultGistId;
}

export function listProfiles(config: ClawpackConfig): Array<{name: string; profile: Profile; isActive: boolean}> {
  if (!config.profiles) {
    return [];
  }
  
  return Object.entries(config.profiles).map(([name, profile]) => ({
    name,
    profile,
    isActive: name === config.activeProfile
  }));
}

export function getOpenClawDir(): string {
  return join(homedir(), '.openclaw');
}

export function getOpenClawConfigPath(): string {
  return join(getOpenClawDir(), 'openclaw.json');
}

export async function readOpenClawConfig(): Promise<any> {
  try {
    const data = await readFile(getOpenClawConfigPath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function scanLocalSkills(): Promise<Skill[]> {
  const skills: Skill[] = [];
  const seen = new Set<string>();
  
  // 1. Scan from openclaw.json plugins.entries
  const config = await readOpenClawConfig();
  if (config?.plugins?.entries) {
    for (const [name, entry] of Object.entries(config.plugins.entries)) {
      if (name === 'accounts') continue; // Skip accounts field
      
      const skillEntry = entry as any;
      if (skillEntry?.enabled !== false) {
        const skill: Skill = {
          name,
          source: guessSkillSource(name),
          enabled: true,
        };
        
        // Check if it's a local extension
        if (skillEntry.loadPath) {
          skill.source = 'local';
        }
        
        if (!seen.has(name)) {
          skills.push(skill);
          seen.add(name);
        }
      }
    }
  }
  
  // 2. Scan extensions directory
  const extensionsDir = join(getOpenClawDir(), 'extensions');
  try {
    const entries = await readdir(extensionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const name = entry.name;
        if (!seen.has(name)) {
          // Try to read package.json for more info
          let source = 'local';
          let version: string | undefined;
          
          try {
            const pkgPath = join(extensionsDir, name, 'package.json');
            const pkgData = await readFile(pkgPath, 'utf-8');
            const pkg = JSON.parse(pkgData);
            version = pkg.version;
            
            // Check openclaw metadata for install source
            if (pkg.openclaw?.install?.npmSpec) {
              source = pkg.openclaw.install.npmSpec;
            } else if (pkg.name?.startsWith('@openclaw/')) {
              source = `npm:${pkg.name}`;
            }
          } catch {
            // No package.json or invalid
          }
          
          skills.push({
            name,
            source,
            version,
            enabled: true,
          });
          seen.add(name);
        }
      }
    }
  } catch {
    // Extensions directory doesn't exist
  }
  
  // 3. Check plugins.allow for trusted plugins that might not be installed yet
  if (config?.plugins?.allow) {
    for (const name of config.plugins.allow) {
      if (!seen.has(name)) {
        skills.push({
          name,
          source: guessSkillSource(name),
          enabled: true,
        });
        seen.add(name);
      }
    }
  }
  
  return skills;
}

function guessSkillSource(name: string): string {
  // Map known skills to their npm packages
  const knownPackages: Record<string, string> = {
    'feishu': 'npm:@openclaw/feishu',
    'github': 'npm:@openclaw/github',
    'discord': 'npm:@openclaw/discord',
    'telegram': 'npm:@openclaw/telegram',
    'slack': 'npm:@openclaw/slack',
    'whatsapp': 'npm:@openclaw/whatsapp',
    'line': 'npm:@openclaw/line',
    'signal': 'npm:@openclaw/signal',
  };
  
  return knownPackages[name] || `npm:@openclaw/${name}`;
}

export async function isSkillInstalled(name: string): Promise<boolean> {
  // Check 1: extensions directory exists
  const extensionsDir = join(getOpenClawDir(), 'extensions', name);
  try {
    await access(extensionsDir);
    return true;
  } catch {
    // Directory doesn't exist, continue checking
  }
  
  // Check 2: plugin is enabled in config
  const config = await readOpenClawConfig();
  if (config?.plugins?.entries?.[name]?.enabled !== false) {
    return true;
  }
  
  return false;
}

export async function installSkill(name: string, source?: string): Promise<void> {
  // Check if already installed
  if (await isSkillInstalled(name)) {
    throw new Error(`Skill '${name}' is already installed`);
  }
  
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  // Determine install source
  let installSpec = source || guessSkillSource(name);
  
  // Extract npm package from source
  if (installSpec.startsWith('npm:')) {
    installSpec = installSpec.slice(4);
  } else if (installSpec === 'local') {
    throw new Error(`Cannot install local skill '${name}' automatically`);
  }
  
  // Try to install via openclaw CLI
  try {
    const { stdout, stderr } = await execAsync(`openclaw plugins install ${installSpec}`, {
      timeout: 120000,
    });
    
    if (stderr && !stderr.includes('already exists')) {
      console.warn('Warning during install:', stderr);
    }
  } catch (error: any) {
    // If openclaw command fails, try manual npm install to extensions
    if (error.message?.includes('command not found') || error.code === 'ENOENT') {
      console.warn('openclaw CLI not available, falling back to manual install');
      await manualInstallSkill(name, installSpec);
    } else {
      throw error;
    }
  }
}

async function manualInstallSkill(name: string, installSpec: string): Promise<void> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  const extensionsDir = join(getOpenClawDir(), 'extensions');
  await mkdir(extensionsDir, { recursive: true });
  
  const targetDir = join(extensionsDir, name);
  
  // Check if already exists
  try {
    await access(targetDir);
    console.log(`Skill '${name}' already installed`);
    return;
  } catch {
    // Directory doesn't exist, proceed with install
  }
  
  // Create temp directory for npm pack
  const { mkdtemp } = await import('fs/promises');
  const { tmpdir } = await import('os');
  const tempDir = await mkdtemp(join(tmpdir(), 'clawpack-'));
  
  try {
    // Download and extract package
    await execAsync(`npm pack ${installSpec} --pack-destination ${tempDir}`, { cwd: tempDir });
    
    const files = await readdir(tempDir);
    const tarball = files.find(f => f.endsWith('.tgz'));
    
    if (!tarball) {
      throw new Error(`Failed to download package: ${installSpec}`);
    }
    
    // Extract to extensions directory
    await mkdir(targetDir, { recursive: true });
    await execAsync(`tar -xzf ${join(tempDir, tarball)} -C ${targetDir} --strip-components=1`);
    
    // Install dependencies
    await execAsync('npm install --production', { cwd: targetDir });
    
    // Enable in config
    await enableSkillInConfig(name);
    
  } finally {
    // Cleanup temp directory
    await execAsync(`rm -rf ${tempDir}`);
  }
}

async function enableSkillInConfig(name: string): Promise<void> {
  const configPath = getOpenClawConfigPath();
  
  try {
    let config: any = {};
    try {
      const data = await readFile(configPath, 'utf-8');
      config = JSON.parse(data);
    } catch {
      // Config doesn't exist or is invalid
    }
    
    // Ensure plugins structure exists
    if (!config.plugins) {
      config.plugins = {};
    }
    if (!config.plugins.entries) {
      config.plugins.entries = {};
    }
    if (!config.plugins.allow) {
      config.plugins.allow = [];
    }
    
    // Add to entries
    config.plugins.entries[name] = { enabled: true };
    
    // Add to allow list if not present
    if (!config.plugins.allow.includes(name)) {
      config.plugins.allow.push(name);
    }
    
    await writeFile(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.warn('Failed to update OpenClaw config:', error);
  }
}
