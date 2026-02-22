# 发布指南

## 1. 发布到 NPM

```bash
cd ~/Projects/clawpack

# 登录 npm（如果没有登录过）
npm adduser

# 或者使用 npm login
npm login

# 发布
npm publish
```

## 2. 创建 GitHub 仓库

### 选项 A：使用 GitHub CLI
```bash
# 安装 gh 如果没有安装
brew install gh

# 登录
gh auth login

# 创建仓库并推送
cd ~/Projects/clawpack
gh repo create clawpack --public --source=. --remote=origin --push
```

### 选项 B：手动创建
1. 访问 https://github.com/new
2. 仓库名：`clawpack`
3. 设置为 Public
4. 不要初始化 README（已有）
5. 创建后执行：

```bash
cd ~/Projects/clawpack
git remote add origin https://github.com/tonglei1996/clawpack.git
git branch -M main
git push -u origin main
```

## 3. 安装测试

发布后，可以通过以下方式安装：

```bash
# 从 npm 安装
npm install -g clawpack

# 测试
clawpack --help
clawpack init
clawpack list
```

## 功能特性

- ✅ 扫描本地 OpenClaw 技能
- ✅ 导出到 JSON 文件
- ✅ 上传到 GitHub Gist
- ✅ 上传到 GitHub 仓库
- ✅ 从 Gist/仓库下载技能
- ✅ 自动安装下载的技能
- ✅ 支持 npm 包和本地扩展

## 已知限制

1. 技能扫描基于 OpenClaw 配置结构，如果 OpenClaw 未来更改配置格式，可能需要更新
2. 某些技能可能需要额外配置，自动安装后可能需要手动调整
