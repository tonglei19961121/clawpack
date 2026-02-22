# 整体优化方案 v2.0

## 🎯 优化目标
让 clawpack 从"能用"变成"好用"，降低新用户门槛，提升老用户效率。

---

## Phase 1: 用户体验优化 ✅ 执行中

### 1.1 交互式 Wizard 引导
**问题：** 新用户不知道第一步该做什么
**方案：** 
```bash
$ clawpack init
🚀 欢迎使用 clawpack！

检测到你是首次使用，让我来帮你设置：

1️⃣ GitHub Token 配置
   发现你已登录 GitHub CLI ✓
   已自动配置 Token

2️⃣ 扫描现有技能
   找到 3 个技能：
   - feishu (飞书集成)
   - github (GitHub 工具)
   - weather (天气查询)

3️⃣ 创建首个备份
   是否现在备份到 GitHub Gist? [Y/n]: 
   ✓ 备份成功！Gist ID: abc123

💡 常用命令：
   clawpack list     # 查看技能
   clawpack push     # 备份更新
   clawpack pull     # 恢复技能
```

### 1.2 Token 自动检测机制
**当前：** 必须手动设置 GITHUB_TOKEN 环境变量
**优化：**
- 自动检测 `gh auth token`（GitHub CLI）
- 自动检测 `GITHUB_TOKEN` / `GH_TOKEN`
- 检测不到时才提示用户手动设置

### 1.3 智能提示系统
**当前：** 用户不知道下一步该做什么
**优化：** 每个命令完成后给出上下文建议

---

## Phase 2: 功能增强

### 2.1 一键恢复（记住上次 Gist）
**场景：** 用户换了新电脑，只记得 `clawpack pull`，不记得 Gist ID
**方案：**
```bash
$ clawpack pull
发现你之前创建的 Gist: abc123 (创建于 2026-02-22)
是否从这个 Gist 恢复？ [Y/n]: 
✓ 已恢复 3 个技能
```

### 2.2 变更预览（diff 功能）
**场景：** push 前想知道会覆盖什么
**方案：**
```bash
$ clawpack push --dry-run
📊 即将上传到 GitHub：

新增技能：
  + weather (npm:@openclaw/weather)

移除技能：
  - old-skill (不再使用)

变更技能：
  ~ feishu (v1.0.0 → v1.2.0)

确认上传？ [y/N]: 
```

### 2.3 选择性恢复
**场景：** 不想恢复所有技能，只选需要的
**方案：**
```bash
$ clawpack pull abc123 --interactive
从 Gist 发现 5 个技能：
  [✓] feishu      - 飞书集成
  [✓] github      - GitHub 工具
  [ ] weather     - 天气查询 (跳过)
  [✓] notion      - Notion 集成
  [ ] old-plugin  - 旧插件 (跳过)

确认安装选中的 3 个技能？ [Y/n]:
```

---

## Phase 3: 可靠性提升

### 3.1 网络重试机制
**问题：** GitHub API 偶尔超时
**方案：** 自动重试 3 次，指数退避

### 3.2 配置验证
**问题：** 导出后不知道 JSON 是否正确
**方案：**
```bash
$ clawpack export --validate
✓ JSON 格式正确
✓ 所有技能源可访问
⚠ 发现 1 个警告：weather 技能未安装本地
```

### 3.3 回滚机制
**问题：** pull 后想恢复到之前的状态
**方案：** 自动创建本地备份，支持 `clawpack restore`

---

## 执行计划

| 优先级 | 功能 | 预计时间 | 影响 |
|--------|------|----------|------|
| P0 | Token 自动检测 | 30min | 新用户体验 |
| P0 | Wizard 引导 | 1h | 新用户体验 |
| P1 | 一键恢复 | 30min | 日常使用 |
| P1 | 智能提示 | 30min | 整体体验 |
| P2 | 变更预览 | 1h | 安全操作 |
| P2 | 网络重试 | 30min | 稳定性 |
| P3 | 选择性恢复 | 1h | 灵活性 |

---

## 设计决策

### 为什么先做用户体验？
1. **降低门槛** > **增加功能** - 让现有功能更易用
2. **留存率** - 新用户不会因为配置繁琐而放弃
3. **口碑** - 流畅的初体验带来推荐

### 保持克制的原则
- 不添加 Web UI（保持 CLI 本质）
- 不添加数据库（保持无服务器架构）
- 不添加复杂的权限系统（保持简单）

---

*创建时间：2026-02-22*
*下次审查：v1.1.0 发布后*
