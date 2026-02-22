# 项目演进记录

记录 clawpack 的迭代历程、优化思路和未来规划。

## 📅 版本历史

### v1.0.0 (2026-02-22)
**初始版本发布**

#### 已实现功能
- ✅ CLI 框架（Commander.js）
- ✅ 6 个核心命令：init、list、export、import、push、pull
- ✅ 技能扫描（OpenClaw 配置 + extensions 目录）
- ✅ GitHub Gist 上传/下载
- ✅ GitHub 仓库支持
- ✅ 自动安装技能（跳过已安装）
- ✅ 环境变量支持（GITHUB_TOKEN）

#### 关键决策
1. **使用 GitHub 作为后端**
   - 原因：无需自建服务，用户已有 GitHub 账号
   - 替代方案：自建 API + 数据库（太重）

2. **优先使用 Gist 而非仓库**
   - 原因：Gist 更简单，适合存储单一配置文件
   - 后续支持仓库以提供更灵活的版本控制

3. **支持环境变量优先于配置文件**
   - 原因：CI/CD 场景更友好，也符合 12-factor 原则

---

## 🧠 优化思路

### 1. 技能扫描优化

**当前问题：**
- 扫描逻辑依赖 OpenClaw 内部配置结构
- 如果 OpenClaw 更新配置格式，需要同步修改

**优化方案：**
```typescript
// 未来：使用 OpenClaw CLI 获取技能列表
const skills = await exec('openclaw plugins list --json');
```

**优先级：** 中
**阻塞：** 需要 OpenClaw CLI 支持对应命令

---

### 2. 增量同步

**当前问题：**
- push 总是创建新 Gist 或覆盖整个文件
- 无法查看历史变更

**优化方案：**
- 使用 GitHub 仓库替代 Gist
- 每次 push 创建一个新 commit
- 支持 `clawpack history` 查看变更历史

**优先级：** 低
**原因：** Gist 对于个人备份已足够

---

### 3. 技能配置加密

**当前问题：**
- 技能配置可能包含敏感信息（API key 等）
- 当前明文存储在 Gist 中

**优化方案：**
```typescript
// 标记敏感字段
interface Skill {
  name: string;
  source: string;
  config?: Record<string, unknown>;
  sensitiveFields?: string[]; // 需要加密的字段
}

// 使用用户密码或 GitHub token 加密敏感字段
```

**优先级：** 高
**安全考虑：** 用户可能在技能配置中存储敏感信息

---

### 4. 跨平台支持

**当前支持：**
- ✅ OpenClaw

**计划支持：**
- Cursor MCP 配置
- Claude Code 插件
- Aider 配置
- VS Code 扩展列表

**实现思路：**
```typescript
interface PlatformAdapter {
  name: string;
  scan(): Promise<Skill[]>;
  install(skill: Skill): Promise<void>;
}

const adapters = {
  openclaw: new OpenClawAdapter(),
  cursor: new CursorAdapter(),
  claude: new ClaudeCodeAdapter(),
};
```

**优先级：** 中
**价值：** 扩大用户群体，实现真正的"技能同步"

---

### 5. 技能市场

**想法：**
- 发现社区分享的技能组合
- 一键安装热门技能套装

**实现方式：**
- 维护一个 awesome-clawpack 列表
- 或创建简单的技能发现网站

**优先级：** 低
**原因：** 先完善核心功能，再考虑社区功能

---

### 6. 更好的错误处理

**当前问题：**
- 部分错误信息不够友好
- 缺少详细的调试模式

**优化：**
```bash
# 添加调试模式
clawpack push --verbose
clawpack pull <id> --debug
```

**优先级：** 中

---

## 📝 待办清单

### 高优先级
- [ ] 敏感字段加密支持
- [ ] 完善测试覆盖
- [ ] 处理 npm 包名冲突（如果 clawpack 已被占用）

### 中优先级
- [ ] Cursor MCP 支持
- [ ] 增量同步/历史版本
- [ ] 技能配置验证
- [ ] 自动更新检查

### 低优先级
- [ ] 技能发现市场
- [ ] Web UI 管理界面
- [ ] 团队协作功能（共享技能组）

---

## 💡 设计原则

1. **简单优先**：保持 CLI 简单，避免过度工程化
2. **透明可信**：代码开源，数据存在用户自己的 GitHub
3. **渐进增强**：先解决核心问题，再逐步添加功能
4. **向后兼容**：配置文件格式支持版本号，便于未来升级

---

## 🤔 开放问题

1. **技能版本锁定**：是否应该记录并恢复特定版本？
   - 当前：总是安装最新版
   - 考虑：添加版本锁定功能

2. **多设备同步冲突**：如果在两台设备上同时修改技能？
   - 当前：最后一次 push 覆盖
   - 考虑：添加冲突检测和合并

3. **私有技能**：如何处理未发布到 npm 的私有技能？
   - 当前：仅记录为 "local"，无法自动安装
   - 考虑：支持 Git URL 安装

---

## 📊 用户反馈收集

（待发布后收集）

- 最常用的命令是什么？
- 哪些功能不够清晰？
- 希望支持哪些平台？

---

*最后更新：2026-02-22*
