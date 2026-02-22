# Clawpack

Backup and share your OpenClaw skills via GitHub.

## Installation

```bash
npm install -g clawpack
```

## Quick Start

### 1. Initialize

```bash
clawpack init
```

### 2. Set up GitHub Token

Create a personal access token at https://github.com/settings/tokens

```bash
export GITHUB_TOKEN=your_token_here
```

### 3. Backup your skills

```bash
# Push to a GitHub Gist (private by default)
clawpack push

# Or push to a repository
clawpack push --repo yourname/my-skills
```

### 4. Restore on another machine

```bash
# From Gist
clawpack pull gist_id_here

# From repository
clawpack pull --repo yourname/my-skills
```

## Commands

| Command | Description |
|---------|-------------|
| `clawpack init` | Initialize configuration |
| `clawpack list` | List installed OpenClaw skills |
| `clawpack push` | Upload skills to GitHub |
| `clawpack pull <id>` | Download skills from GitHub |
| `clawpack export` | Export to local JSON file |
| `clawpack import <file>` | Import from local JSON file |

## How it works

Clawpack scans your `~/.openclaw/extensions/` directory and creates a manifest of your installed skills. This manifest is stored in a GitHub Gist (private) or a GitHub repository.

The manifest includes:
- Skill name
- Installation source (npm, GitHub, etc.)
- Version
- Configuration (optional)

## Roadmap

- [ ] Automatic skill installation on pull
- [ ] Cross-platform support (Cursor, Claude Code, etc.)
- [ ] Skill discovery/sharing marketplace
- [ ] Encrypted storage for sensitive configs

## License

MIT
