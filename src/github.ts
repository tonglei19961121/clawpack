import { Octokit } from 'octokit';
import type { SkillsManifest } from './config.js';

export async function createGist(token: string, manifest: SkillsManifest): Promise<string> {
  const octokit = new Octokit({ auth: token });
  
  const response = await octokit.rest.gists.create({
    description: `OpenClaw skills backup - ${new Date().toISOString()}`,
    public: false,
    files: {
      'clawpack.json': {
        content: JSON.stringify(manifest, null, 2),
      },
    },
  });
  
  return response.data.id!;
}

export async function updateGist(token: string, gistId: string, manifest: SkillsManifest): Promise<void> {
  const octokit = new Octokit({ auth: token });
  
  await octokit.rest.gists.update({
    gist_id: gistId,
    files: {
      'clawpack.json': {
        content: JSON.stringify(manifest, null, 2),
      },
    },
  });
}

export async function getGist(token: string, gistId: string): Promise<SkillsManifest> {
  const octokit = new Octokit({ auth: token });
  
  const response = await octokit.rest.gists.get({
    gist_id: gistId,
  });
  
  const file = response.data.files?.['clawpack.json'];
  if (!file?.content) {
    throw new Error('Invalid gist: clawpack.json not found');
  }
  
  return JSON.parse(file.content);
}

export async function pushToRepo(
  token: string,
  repo: string,
  manifest: SkillsManifest
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  const [owner, repoName] = repo.split('/');
  
  const content = Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64');
  const path = 'clawpack.json';
  const message = `Update skills - ${new Date().toISOString()}`;
  
  // Try to get existing file SHA
  let sha: string | undefined;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo: repoName,
      path,
    });
    if ('sha' in data) {
      sha = data.sha;
    }
  } catch {
    // File doesn't exist yet
  }
  
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path,
    message,
    content,
    sha,
  });
}

export async function getFromRepo(token: string, repo: string): Promise<SkillsManifest> {
  const octokit = new Octokit({ auth: token });
  const [owner, repoName] = repo.split('/');
  
  const response = await octokit.rest.repos.getContent({
    owner,
    repo: repoName,
    path: 'clawpack.json',
  });
  
  if (!('content' in response.data)) {
    throw new Error('Invalid response from GitHub');
  }
  
  const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
  return JSON.parse(content);
}
