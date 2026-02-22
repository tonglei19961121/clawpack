# Clawpack

一键备份和恢复你的 OpenClaw 配置。

## ✨ 特性

- 📦 **本地打包** - 无需 GitHub，直接打包成 zip 文件
- 🏷️ **多配置管理** - 用昵称（如 `work-mac`）代替难记的 Gist ID
- ☁️ **GitHub 备份** - 云端同步，跨设备恢复
- 🔧 **完整配置** - 技能、代理设置、工作区文件一网打尽

## 📦 安装

```bash
npm install -g clawpack
```

## 🚀 Quick Start

### 方式一：本地打包（推荐，无需 GitHub）

适合快速备份或没有 GitHub 账号的用户。

```bash
# 1. 打包当前配置
clawpack pack

# 输出：clawpack-backup-1234567890.zip

# 2. 将 zip 文件复制到新设备（U盘/微信/邮件）

# 3. 在新设备上解压恢复
clawpack unpack clawpack-backup-1234567890.zip

# 4. 重启 OpenClaw
openclaw gateway restart
```

### 方式二：多配置管理（推荐有多台设备的用户）

用昵称管理多个设备配置，告别难记的 Gist ID。

```bash
# 1. 初始化
clawpack init

# 2. 添加你的设备配置
clawpack profile add work-mac abc123 "公司 MacBook"
clawpack profile add home-pc def456 "家用电脑"
clawpack profile add laptop ghi789 "笔记本"

# 3. 查看所有配置
clawpack profile list
# 输出：
# ▶ work-mac ★ 当前使用
#   Gist ID: abc123
#   描述: 公司 MacBook
#
#   home-pc
#   Gist ID: def456
#   描述: 家用电脑

# 4. 备份到指定配置
clawpack backup --profile work-mac

# 5. 在其他设备恢复
clawpack restore work-mac
```

## 📋 命令参考

### 本地打包（无需 GitHub）

| 命令 | 说明 |
|------|------|
| `clawpack pack` | 打包配置为 zip 文件 |
| `clawpack pack my.zip` | 指定输出文件名 |
| `clawpack unpack my.zip` | 从 zip 文件恢复配置 |

### 多配置管理

| 命令 | 说明 |
|------|------|
| `clawpack profile list` | 列出所有配置 |
| `clawpack profile add <昵称> <gist-id> [描述]` | 添加新配置 |
| `clawpack profile remove <昵称>` | 删除配置 |
| `clawpack profile use <昵称>` | 切换到指定配置 |
| `clawpack profile show <昵称>` | 查看配置详情 |

### GitHub 云端备份

| 命令 | 说明 |
|------|------|
| `clawpack backup` | 备份技能到 GitHub Gist |
| `clawpack backup --full` | 完整配置备份（推荐） |
| `clawpack backup --profile <昵称>` | 推送到指定配置 |
| `clawpack restore` | 从默认配置恢复 |
| `clawpack restore <昵称>` | 从指定配置恢复 |

### 其他命令

| 命令 | 说明 |
|------|------|
| `clawpack init` | 初始化配置 |
| `clawpack status` | 查看授权状态 |
| `clawpack list` | 列出已安装技能 |

## 💡 使用场景

### 场景 1：单机快速备份
```bash
clawpack pack                    # 打包
# ... 传输文件 ...
clawpack unpack backup.zip       # 恢复
```

### 场景 2：多设备同步
```bash
# 电脑 A（公司）
clawpack profile add work abc123 "公司电脑"
clawpack backup --profile work

# 电脑 B（家用）
clawpack profile add home def456 "家用电脑"
clawpack restore work            # 同步公司配置
```

### 场景 3：新设备快速配置
```bash
# 新电脑
npm install -g clawpack
clawpack init
clawpack restore work-mac --full
openclaw gateway restart
```

## 🔐 GitHub 授权（仅云端备份需要）

如果你需要使用 GitHub 云端备份功能：

```bash
# 方式 1：环境变量
export GITHUB_TOKEN=ghp_your_token_here

# 方式 2：GitHub CLI
gh auth login

# 创建 Token：https://github.com/settings/tokens
# 勾选 `gist` 权限
```

## 🔧 备份内容

- ✅ 已安装的技能
- ✅ 代理配置（模型设置等）
- ✅ 通道配置（飞书、Discord 等）
- ✅ 工作区文件（SOUL.md, AGENTS.md 等）

## 📄 许可证

MIT
