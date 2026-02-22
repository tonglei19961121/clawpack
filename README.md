# 🦞 Clawpack

<p align="center">
  <b>像搬家一样轻松迁移你的 AI 工具配置</b><br>
  本地打包 · 云端同步 · 昵称管理 · 一键恢复
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/clawpack">
    <img src="https://img.shields.io/npm/v/clawpack.svg" alt="npm version">
  </a>
  <a href="https://github.com/tonglei1996/clawpack/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/clawpack.svg" alt="license">
  </a>
  <a href="https://www.npmjs.com/package/clawpack">
    <img src="https://img.shields.io/npm/dt/clawpack.svg" alt="downloads">
  </a>
</p>

---

## 🎬 30 秒看懂

```bash
# 场景 1：换电脑？打包带走！
$ clawpack pack
📦 clawpack-backup-1234567890.zip (85KB)
# 微信发给新电脑，解压即用

# 场景 2：3 台电脑同步？用昵称！
$ clawpack backup --full
📝 为此配置起个昵称：laptop
✅ 已保存！以后用 "clawpack restore laptop"
```

**核心亮点：告别难记的 Gist ID，用 "laptop" "work-mac" 这样的昵称管理多设备配置**

---

## ✨ 为什么选择 Clawpack？

| 痛点 | 传统方案 | Clawpack |
|------|---------|----------|
| 换电脑重装 | 手动装技能、配环境 | `pack` → 微信传输 → `unpack` |
| 多设备同步 | 记住 Gist ID: `abc123def456...` | 昵称: `laptop`, `work-mac` |
| 配置丢失 | 无法恢复 | 自动云端备份 |
| 团队协作 | 各自摸索 | 共享配置一键同步 |

---

## 🚀 Quick Start（2 分钟上手）

### 方式一：本地打包（推荐新手，无需 GitHub）

```bash
# 安装
npm install -g clawpack

# 打包当前配置
clawpack pack
# 📦 生成：clawpack-backup-1234567890.zip

# 传输到新设备（U盘/微信/邮件）

# 新设备上解压
clawpack unpack clawpack-backup-1234567890.zip
openclaw gateway restart

# ✅ 完成！配置完全一致
```

### 方式二：云端同步（多设备用户）

```bash
# 1. 设置 GitHub Token（只需一次）
export GITHUB_TOKEN=ghp_your_token_here

# 2. 备份并创建昵称
clawpack backup --full
📝 为此配置起个昵称：work-mac
✅ 已保存为 "work-mac"！

# 3. 在其他设备恢复
clawpack restore work-mac
# 搞定！
```

---

## 📋 功能一览

### 🔥 核心功能

- **📦 本地打包** - `pack`/`unpack`，无需账号，U 盘带走
- **🏷️ 昵称系统** - 用 `laptop` 代替 `abc123def456...`
- **☁️ 云端同步** - GitHub Gist 自动备份
- **🔄 一键恢复** - 新设备秒变熟悉环境

### 🛠️ 所有命令

```bash
# 本地操作（无需 GitHub）
clawpack pack [文件名]          # 打包配置
clawpack unpack <文件名>        # 解压恢复

# 云端操作（多设备同步）
clawpack backup [--full]        # 备份到 GitHub
clawpack restore [昵称]         # 从 GitHub 恢复

# 多配置管理（昵称系统）
clawpack profile list           # 列出所有配置
clawpack profile add <昵称> <gist-id> [描述]
clawpack profile use <昵称>     # 切换默认配置
clawpack profile remove <昵称>  # 删除配置

# 其他
clawpack init                   # 初始化
clawpack status                 # 查看状态
clawpack list                   # 列出技能
```

---

## 💡 典型场景

### 场景 1：换电脑迁移（本地打包）
```bash
# 旧电脑
$ clawpack pack
📦 clawpack-backup-20240223.zip

# 微信传输到新电脑

# 新电脑
$ clawpack unpack clawpack-backup-20240223.zip
✅ 恢复完成！
```

### 场景 2：公司+家用+笔记本 3 设备同步
```bash
# 公司电脑
$ clawpack backup --full
📝 昵称：work-mac

# 家用电脑
$ clawpack restore work-mac --full
✅ 同步完成！

# 笔记本
$ clawpack restore work-mac --full
✅ 同样同步！
```

### 场景 3：团队共享配置
```bash
# 组长导出配置
$ clawpack backup --full --repo your-team/openclaw-config

# 组员一键同步
$ clawpack restore your-team/openclaw-config --full
```

---

## 🔧 安装

### 要求
- Node.js >= 18
- macOS / Linux / Windows

### 安装
```bash
npm install -g clawpack
```

### 验证
```bash
clawpack --version
```

---

## 📖 文档

- [详细使用指南](https://github.com/tonglei1996/clawpack#readme)
- [常见问题](#faq)
- [更新日志](./CHANGELOG.md)

---

## 🤝 贡献

欢迎 Issue 和 PR！

```bash
git clone https://github.com/tonglei1996/clawpack.git
cd clawpack
npm install
npm run build
```

---

## 📄 许可证

MIT © [tonglei1996](https://github.com/tonglei1996)

---

<p align="center">
  如果觉得好用，请点个 ⭐ Star 支持一下！
</p>
