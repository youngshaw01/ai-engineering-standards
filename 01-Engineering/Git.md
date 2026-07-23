# Git

## Overview

Git 版本控制规范，涵盖分支策略、提交约定、合并规则和常用操作。适用于所有使用 Git 的项目。

---

## Rules

### R01 — 分支命名

**MUST** — 分支名称必须遵循以下格式：

```
<type>/<ticket-id>-<short-description>
```

| Type | 用途 | 示例 |
|------|------|------|
| `feature` | 新功能 | `feature/JIRA-1234-user-login` |
| `bugfix` | 缺陷修复 | `bugfix/JIRA-1235-null-pointer` |
| `hotfix` | 紧急修复（生产） | `hotfix/JIRA-1236-payment-fail` |
| `release` | 发布分支 | `release/2.1.0` |
| `chore` | 杂项（构建、依赖） | `chore/JIRA-1237-upgrade-deps` |
| `docs` | 文档 | `docs/JIRA-1238-api-guide` |

✅ Correct:

```
feature/JIRA-1234-user-login
hotfix/JIRA-1236-payment-fail
release/2.1.0
```

❌ Wrong:

```
my-branch
fix-bug
1234
feature/user_login_final_v2
```

---

### R02 — 分支策略

**MUST** — 使用 Git Flow 或 GitHub Flow，团队统一选择一种：

#### Git Flow（推荐用于有明确发布周期的项目）

```
main          ← 生产代码，只接受 merge
├── develop   ← 开发主线
│   ├── feature/xxx
│   └── feature/yyy
├── release/1.0.0
└── hotfix/xxx
```

#### GitHub Flow（推荐用于持续部署的项目）

```
main          ← 始终可部署
├── feature/xxx
└── feature/yyy
```

**选择原则：**

| 场景 | 推荐 |
|------|------|
| 有版本号、定期发布 | Git Flow |
| 持续部署、SaaS 产品 | GitHub Flow |
| 开源项目 | GitHub Flow |

---

### R03 — Commit Message 格式

**MUST** — 遵循 Conventional Commits 规范：

```
<type>(<scope>): <subject>

[body]

[footer]
```

#### Type

| Type | 含义 | 是否影响版本 |
|------|------|-------------|
| `feat` | 新功能 | Minor |
| `fix` | 缺陷修复 | Patch |
| `docs` | 文档变更 | 无 |
| `style` | 格式调整（不影响逻辑） | 无 |
| `refactor` | 重构（非新功能、非修复） | 无 |
| `perf` | 性能优化 | Patch |
| `test` | 测试相关 | 无 |
| `chore` | 构建/工具/依赖 | 无 |
| `ci` | CI/CD 配置 | 无 |
| `revert` | 回滚提交 | 取决于回滚内容 |
| `build` | 构建系统或外部依赖 | Patch |

#### Scope（可选）

模块名或影响范围，例如：

- `auth` — 认证模块
- `api` — API 层
- `ui` — 界面
- `db` — 数据库

#### Subject

- 使用祈使句（"add" 而非 "added"）
- 首字母小写
- 不加句号
- 不超过 72 个字符

✅ Correct:

```
feat(auth): add JWT refresh token support
fix(api): handle null response from payment gateway
docs(readme): update installation guide
refactor(db): extract connection pool to separate module
chore(deps): upgrade Spring Boot to 3.2.0
```

❌ Wrong:

```
added login feature
Fixed bug
update
feat: Added new feature.
feat(auth): This commit adds a new feature that allows users to log in using their email address and password, with support for OAuth2 and SAML.
```

---

### R04 — Commit 粒度

**SHOULD** — 每个提交应是一个完整的逻辑变更：

- 一个提交做一件事
- 提交后代码应可编译、可运行
- 不提交编译失败的代码
- 不提交未使用的代码

✅ Correct:

```
feat(auth): add login endpoint
feat(auth): add JWT token generation
test(auth): add login endpoint tests
```

❌ Wrong:

```
feat: add login, fix bug, update deps
WIP
fix stuff
```

---

### R05 — Merge 规则

**MUST** — 合并规则如下：

| 场景 | 方式 | 理由 |
|------|------|------|
| feature → develop / main | **Squash Merge** | 保持主线历史干净 |
| hotfix → main | **Merge Commit** | 保留紧急修复记录 |
| release → main | **Merge Commit** | 保留发布记录 |
| develop → feature（同步） | **Rebase** | 避免不必要的合并提交 |

**禁止在 main / develop 上直接 commit。**

---

### R06 — .gitignore 规范

**MUST** — 项目根目录必须包含 `.gitignore`，至少排除：

```gitignore
# Build output
target/
build/
dist/
out/

# IDE
.idea/
.vscode/
*.iml
*.swp

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log

# Dependencies（按语言选择）
node_modules/
vendor/
__pycache__/

# Secrets
*.pem
*.key
*.jks
```

---

### R07 — 敏感信息

**MUST NOT** — 禁止提交以下内容到 Git：

- AccessKey / SecretKey / Token
- 密码 / 私钥 / 证书
- 数据库连接串
- `.env` 文件（含真实值）
- 内网 IP / 域名

**如果不慎提交：**

1. 立即轮换泄露的凭据
2. 使用 `git filter-branch` 或 `git filter-repo` 清理历史
3. 通知团队成员

---

### R08 — Tag 规范

**MUST** — 版本标签遵循 Semantic Versioning：

```
v<major>.<minor>.<patch>[-<prerelease>]
```

✅ Correct:

```
v1.0.0
v2.1.3
v3.0.0-rc.1
v3.0.0-beta.2
```

❌ Wrong:

```
1.0
v1
release-1
2024-01-15
```

**Tag 命名规则：**

| 变更类型 | 版本号变化 | 示例 |
|----------|-----------|------|
| Bug 修复 | Patch +1 | v1.0.0 → v1.0.1 |
| 新功能（向后兼容） | Minor +1 | v1.0.0 → v1.1.0 |
| 破坏性变更 | Major +1 | v1.0.0 → v2.0.0 |

---

### R09 — Rebase 规则

**MUST** — 遵守以下规则：

- **可以 rebase**：自己的 feature 分支（未合并到共享分支）
- **禁止 rebase**：已推送到远程的共享分支（develop / main / release）
- **禁止 rebase**：已合并的分支

```
# 安全：在自己的 feature 分支上 rebase
git checkout feature/JIRA-1234-login
git rebase develop

# 危险：禁止对已推送的共享分支执行
git rebase develop  # 如果 develop 已被其他人基于它开发
```

---

### R10 — Stash 规范

**SHOULD** — 使用 stash 临时保存未提交的变更：

```bash
# 保存并添加描述
git stash push -m "JIRA-1234-wip-login-form"

# 查看所有 stash
git stash list

# 恢复并删除
git stash pop

# 恢复但保留
git stash apply
```

**禁止用 stash 替代正常的提交流程。** stash 仅用于临时切换分支。

---

### R11 — Binary 文件

**SHOULD NOT** — 避免提交大文件到 Git：

- 图片超过 100KB → 使用 Git LFS 或 CDN
- 视频文件 → 使用外部存储
- 数据库文件 → 禁止提交
- 构建产物 → 禁止提交

如需管理大文件，使用 Git LFS：

```bash
git lfs install
git lfs track "*.psd"
git lfs track "*.zip"
```

---

### R12 — Commitlint 配置

**SHOULD** — 项目应配置 Commitlint 自动校验提交信息：

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", [
      "feat", "fix", "docs", "style", "refactor",
      "perf", "test", "chore", "ci", "revert", "build"
    ]],
    "subject-max-length": [2, "always", 72],
    "subject-case": [0]
  }
}
```

配合 Husky 在 `commit-msg` 钩子中自动校验：

```bash
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

---

### R13 — 分支保护

**MUST** — main 和 develop 分支必须开启保护：

- 禁止直接 push
- 必须通过 PR / MR
- 至少 1 人 Approve
- CI 必须通过
- 禁止 force push

---

### R14 — 提交前自检

**MUST** — 每次提交前检查：

```bash
# 查看将要提交的内容
git diff --cached

# 检查是否有敏感信息
git diff --cached | grep -iE '(password|secret|token|key)'

# 检查是否有调试代码
git diff --cached | grep -iE '(console\.log|System\.out|print\(|debugger|breakpoint)'
```

---

## Common Workflows

### 功能开发

```bash
# 创建分支
git checkout -b feature/JIRA-1234-user-login develop

# 开发（多次小提交）
git add src/login/
git commit -m "feat(auth): add login endpoint"

# 同步主分支
git rebase develop

# 推送
git push origin feature/JIRA-1234-user-login

# 创建 PR → Squash Merge 到 develop
```

### 紧急修复

```bash
# 从 main 创建
git checkout -b hotfix/JIRA-1236-payment-fail main

# 修复
git commit -m "fix(payment): handle null response from gateway"

# 合并到 main
git checkout main
git merge --no-ff hotfix/JIRA-1236-payment-fail
git tag -a v1.0.1 -m "fix: payment gateway null response"

# 同时合并到 develop
git checkout develop
git merge --no-ff hotfix/JIRA-1236-payment-fail
```

### 发布

```bash
# 创建发布分支
git checkout -b release/2.1.0 develop

# 修复发布问题（仅 bugfix 和文档）
git commit -m "fix(api): correct response format for v2 API"

# 合并到 main
git checkout main
git merge --no-ff release/2.1.0
git tag -a v2.1.0 -m "release: version 2.1.0"

# 回合到 develop
git checkout develop
git merge --no-ff release/2.1.0
```

---

## Checklist

- [ ] 分支命名遵循 `<type>/<ticket-id>-<short-description>` 格式
- [ ] 团队统一使用 Git Flow 或 GitHub Flow
- [ ] Commit Message 遵循 Conventional Commits
- [ ] 每个提交是一个完整的逻辑变更
- [ ] 合并策略正确（feature → Squash，hotfix → Merge Commit）
- [ ] .gitignore 配置完整
- [ ] 无敏感信息提交
- [ ] Tag 遵循 Semantic Versioning
- [ ] 不对共享分支执行 rebase
- [ ] main / develop 开启分支保护
- [ ] 已配置 Commitlint + Husky
- [ ] 提交前已自检
