# Clawpack

一键备份和恢复你的 OpenClaw 完整配置到 GitHub。

[English README](./README.en.md)

## ✨ 特性

- 🚀 **一键备份** - 将技能配置备份到 GitHub Gist
- 🔄 **秒级恢复** - 新设备一键同步所有配置
- 🤖 **自动检测** - 自动识别 GitHub CLI 登录状态
- 📱 **跨设备同步** - 工作电脑、家用电脑配置保持一致
- 🔧 **完整配置** - 不仅备份技能，还包括代理、通道、工作区文件等

## 🔐 GitHub 授权

clawpack 需要 GitHub 账号来存储备份。支持以下三种授权方式（按优先级自动检测）：

### 方式 1：环境变量（推荐）

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

创建 Token：
1. 访问 https://github.com/settings/tokens/new
2. 勾选 `gist` 权限（必需）
3. 生成并复制 token

### 方式 2：GitHub CLI

```bash
gh auth login
```

按提示完成授权，clawpack 会自动检测。

### 方式 3：查看当前授权状态

```bash
clawpack status
```

输出示例：
```
📊 clawpack 状态检查

🔐 GitHub 授权状态
   状态: ✅ 已授权
   来源: GITHUB_TOKEN 环境变量
   Token: ghp_DkHNfptK...

⚙️ 配置状态
   默认备份: 3f11d420e3b5a00a6aaeb316ea430201
```

## 📦 安装

```bash
npm install -g clawpack
```

## 🚀 快速开始

### 1. 初始化配置

```bash
clawpack init
```

clawpack 会自动检测：
- ✅ GitHub CLI 登录状态
- ✅ 环境变量中的 Token
- ✅ 现有 OpenClaw 技能

### 2. 备份（技能模式）

```bash
# 仅备份技能
clawpack push

# 或
clawpack backup
```

### 3. 完整配置备份

```bash
# 备份完整配置（推荐）
clawpack backup --full

# 包含工作区文件（SOUL.md, AGENTS.md 等）
clawpack backup --full --workspace

# 推送到仓库
clawpack backup --full --repo yourname/openclaw-config
```

### 4. 恢复（新设备）

```bash
# 自动检测之前的备份
clawpack pull              # 仅恢复技能
clawpack restore --full    # 恢复完整配置

# 或指定 Gist ID
clawpack restore 3f11d420e3b5a00a6aaeb316ea430201 --full
```

## 📋 命令参考

### 基础命令

| 命令 | 说明 |
|------|------|
| `clawpack init` | 初始化配置，检测 GitHub 和技能 |
| `clawpack list` | 列出已安装的 OpenClaw 技能 |

### 备份命令

| 命令 | 说明 |
|------|------|
| `clawpack push` | 备份技能到 GitHub Gist |
| `clawpack backup` | 同上 |
| `clawpack backup --full` | 完整配置备份（技能+配置） |
| `clawpack backup --workspace` | 包含工作区文件 |
| `clawpack backup --sensitive` | 包含敏感信息（密钥等） |
| `clawpack backup --repo user/repo` | 推送到 GitHub 仓库 |

### 恢复命令

| 命令 | 说明 |
|------|------|
| `clawpack pull` | 从上次备份恢复技能 |
| `clawpack pull <gist-id>` | 从指定 Gist 恢复技能 |
| `clawpack restore --full` | 恢复完整配置 |
| `clawpack restore --workspace` | 恢复工作区文件 |
| `clawpack restore --skip-channels` | 跳过通道配置 |

### 导入/导出

| 命令 | 说明 |
|------|------|
| `clawpack export` | 导出到本地 JSON 文件 |
| `clawpack import <file>` | 从本地 JSON 文件导入 |

## 🔧 备份内容

### 技能备份
- ✅ 已安装的技能列表
- ✅ 技能来源（npm/GitHub/本地）
- ✅ 版本信息

### 完整配置备份 (--full)
- ✅ 代理配置（模型设置、并发等）
- ✅ 通道配置（飞书、Discord 等，不含密钥）
- ✅ 插件配置
- ✅ 命令设置
- ✅ 钩子配置
- ✅ 工作区文件（SOUL.md, AGENTS.md, USER.md, TOOLS.md）

## 💡 使用场景

### 场景 1：新电脑快速配置
```bash
# 新电脑
npm install -g clawpack
clawpack init
clawpack restore --full
openclaw gateway restart
```

### 场景 2：多设备同步
```bash
# 电脑 A 修改后
clawpack backup --full

# 电脑 B 同步
clawpack restore --full
```

### 场景 3：配置分享
```bash
# 备份到仓库（方便分享）
clawpack backup --full --repo yourname/openclaw-config

# 他人使用
clawpack restore yourname/openclaw-config --full
```

## 🔐 安全说明

- **Gist 是私有的** - 默认创建私有 Gist，只有你可见
- **敏感信息** - 默认排除 appSecret、token 等敏感字段
- **如需包含敏感信息** - 使用 `--sensitive` 选项（谨慎使用）

## 🗺️ 路线图

- [x] 自动 GitHub Token 检测
- [x] 一键恢复（记住上次 Gist）
- [x] 完整配置备份
- [x] 工作区文件同步
- [ ] 敏感信息加密存储
- [ ] 配置版本历史
- [ ] 支持 Cursor MCP
- [ ] 支持 Claude Code

## 📄 许可证

MIT

---

**Made with ❤️ for the OpenClaw community**
