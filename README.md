# Clawpack

一键备份和恢复你的 OpenClaw 技能配置到 GitHub。

[English README](./README.en.md)

## ✨ 特性

- 🚀 **一键备份** - 将技能配置备份到 GitHub Gist
- 🔄 **秒级恢复** - 新设备一键同步所有技能
- 🤖 **自动检测** - 自动识别 GitHub CLI 登录状态
- 📱 **跨设备同步** - 工作电脑、家用电脑配置保持一致

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

### 2. 备份技能

```bash
clawpack push
```

首次会创建 Gist，后续会自动更新同一 Gist。

### 3. 恢复技能（新设备）

```bash
# 自动检测之前的备份
clawpack pull

# 或指定 Gist ID
clawpack pull your_gist_id_here
```

## 📋 命令参考

| 命令 | 说明 |
|------|------|
| `clawpack init` | 初始化配置，检测 GitHub 和技能 |
| `clawpack list` | 列出已安装的 OpenClaw 技能 |
| `clawpack push` | 备份到 GitHub Gist |
| `clawpack push --repo user/repo` | 备份到 GitHub 仓库 |
| `clawpack pull` | 从上次备份恢复（自动检测） |
| `clawpack pull <gist-id>` | 从指定 Gist 恢复 |
| `clawpack export` | 导出到本地 JSON 文件 |
| `clawpack import <file>` | 从本地 JSON 文件导入 |

## 🔧 工作原理

1. **扫描** - 读取 `~/.openclaw/` 配置和 extensions 目录
2. **打包** - 生成包含技能清单的 JSON 文件
3. **上传** - 存储到私有 GitHub Gist
4. **恢复** - 下载清单并自动安装缺失的技能

## 🗺️ 路线图

- [x] 自动 GitHub Token 检测
- [x] 一键恢复（记住上次 Gist）
- [ ] 技能配置加密
- [ ] 支持 Cursor MCP
- [ ] 支持 Claude Code
- [ ] 技能分享市场

## 📄 许可证

MIT

---

**Made with ❤️ for the OpenClaw community**
