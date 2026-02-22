# Clawpack

一键备份和恢复你的 OpenClaw 配置。

## ✨ 特性

- 📦 **本地打包** - 无需 GitHub，直接打包成 zip 文件，U 盘/微信传输
- ☁️ **基于 GitHub 的多配置管理** - 用昵称（如 `work-mac`）代替难记的 Gist ID，云端同步多设备
- 🔧 **完整配置** - 技能、代理设置、工作区文件一网打尽

## 📦 安装

```bash
npm install -g clawpack
```

## 🚀 Quick Start

### 方式一：本地打包（无需 GitHub，最简单）

适合快速备份、没有 GitHub 账号、或不想联网的用户。

```bash
# 1. 打包当前配置
clawpack pack

# 输出：clawpack-backup-1234567890.zip（约 50-500KB）

# 2. 传输文件到新设备（U盘 / 微信 / 邮件 / 云盘）

# 3. 在新设备上解压恢复
clawpack unpack clawpack-backup-1234567890.zip

# 4. 重启 OpenClaw 生效
openclaw gateway restart
```

**优缺点：**
- ✅ 无需任何账号
- ✅ 无需联网
- ✅ 文件自己掌控
- ⚠️ 需要手动传输文件

---

### 方式二：基于 GitHub 的多配置管理（多设备同步）

适合有多台电脑需要自动同步的用户。

#### 第 1 步：创建 GitHub Token

1. 访问 https://github.com/settings/tokens/new
2. **Note** 填写：`clawpack backup`
3. 勾选 `gist` 权限（创建 Gist 必需）
4. 点击 **Generate token**
5. **复制生成的 Token**（以 `ghp_` 开头）

#### 第 2 步：本地授权

**方式 A：环境变量（推荐）**

```bash
# 设置 Token（添加到 ~/.zshrc 可永久生效）
export GITHUB_TOKEN=ghp_你的_token_这里

# 验证
clawpack status
# 应显示：GitHub 授权状态 ✓ 已授权
```

**方式 B：GitHub CLI**

```bash
# 安装 GitHub CLI
brew install gh

# 登录
gh auth login
# 按提示完成浏览器授权

# 验证
clawpack status
```

#### 第 3 步：添加多配置

```bash
# 查看当前配置
clawpack profile list

# 添加你的设备（用昵称代替难记的 Gist ID）
clawpack profile add work-mac abc123 "公司 MacBook Pro"
clawpack profile add home-pc def456 "家用台式机"
clawpack profile add laptop ghi789 "笔记本"

# 查看所有配置
clawpack profile list
# 输出：
# ▶ work-mac ★ 当前使用
#   Gist ID: abc123
#   描述: 公司 MacBook Pro
#
#   home-pc
#   Gist ID: def456
#   描述: 家用台式机
```

#### 第 4 步：备份与恢复

```bash
# 备份到指定配置
clawpack backup --full --profile work-mac

# 在其他设备恢复（使用昵称，不用记 Gist ID）
clawpack restore work-mac --full

# 或切换到某个配置作为默认
clawpack profile use home-pc
clawpack restore  # 从默认配置恢复
```

**优缺点：**
- ✅ 自动云端同步
- ✅ 多台设备无缝切换
- ✅ 用昵称代替难记的 ID
- ⚠️ 需要 GitHub 账号
- ⚠️ 需要网络连接

---

## 📋 命令参考

### 本地打包（无需 GitHub）

| 命令 | 说明 |
|------|------|
| `clawpack pack` | 打包配置为 zip 文件 |
| `clawpack pack my.zip` | 指定输出文件名 |
| `clawpack unpack my.zip` | 从 zip 文件恢复配置 |

### 基于 GitHub 的多配置管理

| 命令 | 说明 |
|------|------|
| `clawpack profile list` | 列出所有配置 |
| `clawpack profile add <昵称> <gist-id> [描述]` | 添加新配置 |
| `clawpack profile remove <昵称>` | 删除配置 |
| `clawpack profile use <昵称>` | 切换到指定配置 |
| `clawpack backup` | 备份技能到 GitHub |
| `clawpack backup --full` | 完整配置备份 |
| `clawpack backup --profile <昵称>` | 推送到指定配置 |
| `clawpack restore` | 从默认配置恢复 |
| `clawpack restore <昵称>` | 从指定配置恢复 |

### 其他命令

| 命令 | 说明 |
|------|------|
| `clawpack init` | 初始化配置 |
| `clawpack status` | 查看授权状态 |
| `clawpack list` | 列出已安装技能 |

---

## 💡 使用场景

### 场景 1：单机快速备份（本地打包）

```bash
# 电脑 A
clawpack pack                    # 打包
# 传输文件到电脑 B

# 电脑 B
clawpack unpack backup.zip       # 恢复
openclaw gateway restart         # 重启生效
```

### 场景 2：多设备自动同步（GitHub + 多配置）

```bash
# 公司电脑
clawpack profile add work abc123 "公司电脑"
clawpack backup --full --profile work

# 家用电脑
clawpack profile add home def456 "家用电脑"
clawpack restore work --full     # 同步公司配置

# 笔记本
clawpack profile add laptop ghi789 "笔记本"
clawpack restore work --full     # 同样同步公司配置
```

### 场景 3：新设备快速配置

```bash
# 新电脑
npm install -g clawpack
clawpack init
export GITHUB_TOKEN=你的_token
clawpack restore work-mac --full
openclaw gateway restart
```

---

## 🔐 GitHub Token 权限说明

创建 Token 时只需要勾选：
- ✅ `gist` - 创建和管理 Gist（必需）

不需要其他权限，clawpack 不会访问你的代码仓库。

---

## 🔧 备份内容

- ✅ 已安装的技能
- ✅ 代理配置（模型设置等）
- ✅ 通道配置（飞书、Discord 等，不含密钥）
- ✅ 工作区文件（SOUL.md, AGENTS.md 等）

---

## 📄 许可证

MIT
