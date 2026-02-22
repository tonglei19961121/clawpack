import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir, readdir, access, cp, rm } from 'fs/promises';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import type { Skill } from './config.js';
import { scanLocalSkills } from './config.js';

// ...

// ... existing interfaces ...

export interface OpenClawConfig {
  meta?: any;
  wizard?: any;
  auth?: any;
  agents?: {
    defaults?: {
      model?: any;
      models?: any;
      workspace?: string;
      compaction?: any;
      maxConcurrent?: number;
      subagents?: any;
      [key: string]: any;
    };
  };
  messages?: any;
  commands?: any;
  hooks?: any;
  channels?: Record<string, any>;
  gateway?: any;
  plugins?: {
    allow?: string[];
    entries?: Record<string, any>;
  };
}

export interface FullBackupManifest {
  version: string;
  exportedAt: string;
  platform: string;
  type: 'full' | 'skills-only';
  config: {
    agents?: OpenClawConfig['agents'];
    messages?: OpenClawConfig['messages'];
    commands?: OpenClawConfig['commands'];
    hooks?: OpenClawConfig['hooks'];
    channels?: OpenClawConfig['channels'];
    gateway?: Partial<OpenClawConfig['gateway']>;
    plugins?: OpenClawConfig['plugins'];
  };
  skills: Skill[];
  encryptedFields?: string[];
}

// Sensitive fields that should be encrypted
const SENSITIVE_FIELDS = [
  'appSecret',
  'token',
  'apiKey',
  'secret',
  'password',
  'privateKey',
];

export function getOpenClawConfigPath(): string {
  return join(homedir(), '.openclaw', 'openclaw.json');
}

export async function readOpenClawConfig(): Promise<OpenClawConfig | null> {
  try {
    const data = await readFile(getOpenClawConfigPath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function writeOpenClawConfig(config: OpenClawConfig): Promise<void> {
  const configPath = getOpenClawConfigPath();
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Extract sensitive values from config and replace with placeholders
 */
function extractSensitiveData(obj: any, path: string = '', encrypted: Map<string, string> = new Map()): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if this field name suggests it's sensitive
    const fieldName = path.split('.').pop() || '';
    if (SENSITIVE_FIELDS.some(f => fieldName.toLowerCase().includes(f.toLowerCase()))) {
      const encryptedValue = `__ENCRYPTED_${randomBytes(8).toString('hex')}__`;
      encrypted.set(path, obj);
      return encryptedValue;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, i) => extractSensitiveData(item, `${path}[${i}]`, encrypted));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = extractSensitiveData(value, path ? `${path}.${key}` : key, encrypted);
    }
    return result;
  }
  
  return obj;
}

/**
 * Restore sensitive values to config
 */
function restoreSensitiveData(obj: any, encrypted: Map<string, string>, path: string = ''): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string' && obj.startsWith('__ENCRYPTED_')) {
    return encrypted.get(path) || obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, i) => restoreSensitiveData(item, encrypted, `${path}[${i}]`));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = restoreSensitiveData(value, encrypted, path ? `${path}.${key}` : key);
    }
    return result;
  }
  
  return obj;
}

/**
 * Create a full backup of OpenClaw configuration
 */
export async function createFullBackup(includeSensitive: boolean = false): Promise<FullBackupManifest> {
  const config = await readOpenClawConfig();
  const skills = await scanLocalSkills();
  
  if (!config) {
    throw new Error('OpenClaw config not found');
  }
  
  const manifest: FullBackupManifest = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    platform: 'openclaw',
    type: 'full',
    config: {
      agents: config.agents ? {
        defaults: {
          model: config.agents.defaults?.model,
          models: config.agents.defaults?.models,
          workspace: config.agents.defaults?.workspace,
          compaction: config.agents.defaults?.compaction,
          maxConcurrent: config.agents.defaults?.maxConcurrent,
          subagents: config.agents.defaults?.subagents,
        }
      } : undefined,
      messages: config.messages,
      commands: config.commands,
      hooks: config.hooks,
      channels: config.channels,
      gateway: config.gateway ? {
        port: config.gateway.port,
        mode: config.gateway.mode,
        bind: config.gateway.bind,
        tailscale: config.gateway.tailscale,
        nodes: config.gateway.nodes,
        // Exclude auth.token as it's sensitive
      } : undefined,
      plugins: config.plugins,
    },
    skills,
  };
  
  // Handle sensitive data
  if (!includeSensitive) {
    // Remove sensitive fields entirely
    if (manifest.config.channels) {
      for (const channel of Object.values(manifest.config.channels)) {
        delete channel.appSecret;
        delete channel.encryptKey;
        delete channel.verificationToken;
      }
    }
  }
  
  return manifest;
}

/**
 * Restore OpenClaw configuration from backup
 */
export async function restoreFullBackup(
  manifest: FullBackupManifest,
  options: {
    merge?: boolean;
    skipChannels?: boolean;
    skipAgents?: boolean;
  } = {}
): Promise<void> {
  const currentConfig = await readOpenClawConfig() || {};
  
  if (options.merge) {
    // Merge with existing config
    if (!options.skipAgents && manifest.config.agents) {
      currentConfig.agents = {
        ...currentConfig.agents,
        ...manifest.config.agents,
      };
    }
    
    if (!options.skipChannels && manifest.config.channels) {
      currentConfig.channels = {
        ...currentConfig.channels,
        ...manifest.config.channels,
      };
    }
    
    if (manifest.config.messages) {
      currentConfig.messages = { ...currentConfig.messages, ...manifest.config.messages };
    }
    
    if (manifest.config.commands) {
      currentConfig.commands = { ...currentConfig.commands, ...manifest.config.commands };
    }
    
    if (manifest.config.hooks) {
      currentConfig.hooks = { ...currentConfig.hooks, ...manifest.config.hooks };
    }
    
    if (manifest.config.plugins) {
      currentConfig.plugins = {
        allow: [...new Set([...(currentConfig.plugins?.allow || []), ...(manifest.config.plugins.allow || [])])],
        entries: { ...currentConfig.plugins?.entries, ...manifest.config.plugins.entries },
      };
    }
  } else {
    // Replace config (but keep sensitive data)
    if (options.skipAgents) delete manifest.config.agents;
    if (options.skipChannels) delete manifest.config.channels;
    
    Object.assign(currentConfig, manifest.config);
  }
  
  await writeOpenClawConfig(currentConfig);
}

/**
 * Backup workspace files (AGENTS.md, SOUL.md, etc.)
 */
export async function backupWorkspaceFiles(): Promise<Record<string, string>> {
  const workspaceDir = join(homedir(), '.openclaw', 'workspace');
  const files: Record<string, string> = {};
  
  const filesToBackup = [
    'AGENTS.md',
    'SOUL.md',
    'USER.md',
    'IDENTITY.md',
    'TOOLS.md',
    'HEARTBEAT.md',
  ];
  
  for (const filename of filesToBackup) {
    try {
      const content = await readFile(join(workspaceDir, filename), 'utf-8');
      files[filename] = content;
    } catch {
      // File doesn't exist, skip
    }
  }
  
  return files;
}

/**
 * Restore workspace files
 */
export async function restoreWorkspaceFiles(files: Record<string, string>): Promise<void> {
  const workspaceDir = join(homedir(), '.openclaw', 'workspace');
  await mkdir(workspaceDir, { recursive: true });
  
  for (const [filename, content] of Object.entries(files)) {
    await writeFile(join(workspaceDir, filename), content);
  }
}

// ... existing functions from config.ts ...
