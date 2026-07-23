# GitHub

## Overview

GitHub 工程规范，涵盖 PR 工作流、Issue 管理、GitHub Actions CI/CD、分支保护、Release 管理、Project Board、CODEOWNERS、README 规范、Secrets 管理和开源项目规范。适用于所有使用 GitHub 进行协作的项目。

---

## Rules

### R01 — PR 工作流

**MUST** — PR 工作流必须根据项目类型选择 Fork 或 Branch 模式，并使用标准 PR 模板。

#### Fork vs Branch

| 模式 | 适用场景 | 工作方式 |
|------|---------|---------|
| Fork | 开源项目 / 外部贡献者 | Fork → Clone → Branch → Push → PR |
| Branch | 团队内部项目 | Clone → Branch → Push → PR |

#### Fork 模式流程

```
Fork 仓库
    ↓
Clone Fork 到本地
    ↓
创建功能分支
    ↓
开发并提交
    ↓
Push 到 Fork
    ↓
向上游仓库创建 PR
    ↓
Review → Approve → Merge
```

#### Branch 模式流程

```
Clone 仓库
    ↓
从 develop/main 创建功能分支
    ↓
开发并提交
    ↓
Push 到远程
    ↓
创建 PR
    ↓
Review → Approve → Merge
```

#### PR 模板

项目必须在 `.github/PULL_REQUEST_TEMPLATE.md` 中定义 PR 模板：

✅ Correct:

```markdown
## 变更内容
<!-- 简要描述本次变更 -->

## 变更类型
- [ ] feat: 新功能
- [ ] fix: 缺陷修复
- [ ] refactor: 重构
- [ ] docs: 文档
- [ ] chore: 构建/工具

## 影响范围
<!-- 影响哪些模块 / API / 数据库 -->

## 测试方式
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试通过

## 关联 Issue
Closes #

## 自检清单
- [ ] 代码可编译、可运行
- [ ] 无调试代码
- [ ] 无敏感信息
- [ ] 符合编码规范
```

❌ Wrong:

```markdown
更新了一些代码
```

#### Review 流程

```
开发者提交 PR
    ↓
自动分配 Reviewer（CODEOWNERS）
    ↓
CI 自动检查（lint / test / build）
    ↓
CI 通过 → 人工 Review
CI 失败 → 开发者修复后重新提交
    ↓
Reviewer 提出意见
    ↓
开发者修改并回复评论
    ↓
Approve
    ↓
Squash Merge / Merge Commit
```

**CI 未通过的 PR，禁止人工 Review。**

---

### R02 — Issue 模板与标签

**MUST** — 项目必须配置 Issue 模板和标签体系，确保 Issue 信息完整、分类清晰。

#### Issue 模板

项目必须在 `.github/ISSUE_TEMPLATE/` 目录下配置以下模板：

| 模板文件 | 用途 |
|---------|------|
| `bug_report.yml` | Bug 报告 |
| `feature_request.yml` | 功能请求 |
| `question.yml` | 问题咨询（可选） |
| `config.yml` | 模板配置 |

#### Bug Report 模板

✅ Correct:

```yaml
name: Bug Report
description: 报告一个缺陷
labels: ["bug", "triage"]
body:
  - type: textarea
    id: description
    attributes:
      label: 问题描述
      description: 清晰描述遇到的问题
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: 复现步骤
      description: 如何复现该问题
      placeholder: |
        1. 打开页面 XXX
        2. 点击按钮 YYY
        3. 出现错误 ZZZ
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: 期望行为
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: 实际行为
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: 版本号
      placeholder: v1.2.3
    validations:
      required: true
  - type: textarea
    id: env
    attributes:
      label: 环境信息
      description: 操作系统、浏览器、运行时版本等
  - type: textarea
    id: logs
    attributes:
      label: 日志 / 截图
      description: 粘贴相关日志或截图
```

❌ Wrong:

```yaml
name: Bug
body:
  - type: textarea
    attributes:
      label: 描述
```

#### 标签体系

项目必须配置以下标签分类：

| 分类 | 标签 | 颜色 | 说明 |
|------|------|------|------|
| 类型 | `bug` | `#d73a4a` | 缺陷 |
| 类型 | `feature` | `#0075ca` | 新功能 |
| 类型 | `enhancement` | `#a2eeef` | 增强 |
| 类型 | `documentation` | `#0075ca` | 文档 |
| 类型 | `question` | `#d876e3` | 问题 |
| 优先级 | `priority: critical` | `#b60205` | 紧急 |
| 优先级 | `priority: high` | `#e99695` | 高 |
| 优先级 | `priority: medium` | `#fbca04` | 中 |
| 优先级 | `priority: low` | `#0e8a16` | 低 |
| 状态 | `status: triage` | `#fbca04` | 待分类 |
| 状态 | `status: in-progress` | `#1d76db` | 进行中 |
| 状态 | `status: blocked` | `#b60205` | 阻塞 |
| 状态 | `status: wontfix` | `#ffffff` | 不修复 |
| 范围 | `scope: api` | `#c5def5` | API 模块 |
| 范围 | `scope: ui` | `#c5def5` | UI 模块 |
| 范围 | `scope: infra` | `#c5def5` | 基础设施 |

**标签命名必须使用 `<category>: <value>` 格式，避免歧义。**

---

### R03 — GitHub Actions CI/CD

**MUST** — 项目必须使用 GitHub Actions 实现 CI/CD，Workflow 结构清晰、触发条件合理、Job/Step 设计规范。

#### Workflow 文件结构

```
.github/
└── workflows/
    ├── ci.yml          ← 持续集成（lint / test / build）
    ├── cd.yml          ← 持续部署（deploy）
    ├── release.yml     ← 自动发布
    └── pr-check.yml    ← PR 检查
```

#### 触发条件

✅ Correct:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

❌ Wrong:

```yaml
on: [push, pull_request]
```

**触发条件必须限定分支，避免不必要的 Workflow 运行。**

#### CI Workflow 示例

✅ Correct:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

permissions:
  contents: read

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-report-node-${{ matrix.node-version }}
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
```

❌ Wrong:

```yaml
name: CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run lint && npm test && npm run build
```

#### Job/Step 设计原则

| 原则 | 说明 |
|------|------|
| Job 拆分 | lint / test / build 拆分为独立 Job，可并行执行 |
| 依赖声明 | 使用 `needs` 声明 Job 依赖关系 |
| 最小权限 | 使用 `permissions` 限制 GITHUB_TOKEN 权限 |
| 缓存利用 | 使用 `cache` 缓存依赖，加速构建 |
| 矩阵测试 | 使用 `matrix` 覆盖多版本 / 多平台 |
| 失败产物 | 测试失败时上传报告 artifact |
| Action 版本 | 使用 `@v4` 等主版本号，禁止使用 `@master` |
| 环境隔离 | deploy Job 使用 `environment` 保护 |

---

### R04 — 分支保护规则

**MUST** — main 和 develop 分支必须配置保护规则，防止未审核代码合入。

#### main 分支保护规则

| 规则 | 设置 | 说明 |
|------|------|------|
| Require a pull request before merging | ✅ 开启 | 禁止直接 push |
| Required approving reviews | 1 ~ 2 人 | 核心模块要求 2 人 |
| Dismiss stale reviews on new commits | ✅ 开启 | 新提交后清除旧 Approve |
| Require review from Code Owners | ✅ 开启 | CODEOWNERS 必须审查 |
| Require status checks to pass | ✅ 开启 | CI 必须通过 |
| Require branches to be up to date | ✅ 开启 | 合并前必须与目标分支同步 |
| Require signed commits | ⚡ 可选 | 安全要求高的项目开启 |
| Do not allow force pushes | ✅ 开启 | 禁止 force push |
| Do not allow deletions | ✅ 开启 | 禁止删除分支 |

#### Status Check 要求

✅ Correct:

```
Required status checks:
  - lint
  - test
  - build
```

❌ Wrong:

```
Required status checks: (none)
```

#### 分支保护配置建议

| 分支 | Approve 数 | Status Check | Force Push | 删除 |
|------|-----------|-------------|-----------|------|
| `main` | 2 | ✅ | ❌ | ❌ |
| `develop` | 1 | ✅ | ❌ | ❌ |
| `release/*` | 2 | ✅ | ❌ | ❌ |
| `feature/*` | 0 | ⚡ 可选 | ⚡ 可选 | ⚡ 可选 |

**核心原则：越接近生产环境的分支，保护规则越严格。**

---

### R05 — Release 管理

**MUST** — Release 必须遵循 Semantic Versioning，自动生成 Changelog，使用 GitHub Release 发布。

#### Semantic Versioning

```
v<major>.<minor>.<patch>[-<prerelease>][+<build>]
```

| 变更类型 | 版本号变化 | 示例 |
|----------|-----------|------|
| Bug 修复（向后兼容） | Patch +1 | v1.0.0 → v1.0.1 |
| 新功能（向后兼容） | Minor +1 | v1.0.0 → v1.1.0 |
| 破坏性变更 | Major +1 | v1.0.0 → v2.0.0 |
| 预发布 | 添加 prerelease | v2.0.0-rc.1 |

#### Changelog 管理

✅ Correct:

```markdown
# Changelog

## [2.1.0] - 2025-07-18

### Added
- feat(auth): add OAuth2 login support (#101)
- feat(api): add pagination for user list endpoint (#105)

### Fixed
- fix(payment): handle null response from gateway (#103)
- fix(ui): correct button alignment on mobile (#107)

### Changed
- refactor(db): optimize query performance for dashboard (#110)

### Deprecated
- api/v1/user endpoint will be removed in v3.0.0

### Breaking
- api/v1/auth return structure changed (#112)
```

❌ Wrong:

```markdown
# Changelog

## v2.1.0
- 修了一些 bug
- 加了一些功能
```

#### GitHub Release 自动化

✅ Correct:

```yaml
name: Release

on:
  push:
    tags: ['v*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Generate Changelog
        run: npx conventional-changelog-cli -p angular -i CHANGELOG.md
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          body_path: CHANGELOG.md
          draft: false
          prerelease: ${{ contains(github.ref, '-rc.') || contains(github.ref, '-beta.') }}
```

❌ Wrong:

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - run: echo "releasing..."
```

#### Release 流程

```
完成功能开发
    ↓
更新 CHANGELOG.md
    ↓
提交版本变更
    ↓
创建 Tag（v2.1.0）
    ↓
推送 Tag → 触发 Release Workflow
    ↓
自动构建 + 创建 GitHub Release
    ↓
发布 Draft → 审核 → Publish
```

---

### R06 — Project Board

**SHOULD** — 项目应使用 GitHub Projects 管理看板，配置自动化规则和里程碑。

#### 看板列设计

| 列名 | 含义 | WIP 限制 |
|------|------|---------|
| Backlog | 待规划 | 无 |
| Todo | 已规划，待开发 | 无 |
| In Progress | 开发中 | ≤5 |
| In Review | 审查中 | ≤3 |
| Done | 已完成 | 无 |

#### 自动化规则

✅ Correct:

```
当 Issue 被创建 → 自动添加到 Backlog
当 PR 被创建 → 自动移动到 In Review
当 PR 被合并 → 自动关闭关联 Issue → 移动到 Done
当 PR 被标记为 draft → 自动移动到 In Progress
```

❌ Wrong:

```
无自动化，手动拖拽管理
```

#### 里程碑管理

| 字段 | 要求 |
|------|------|
| 标题 | 版本号或迭代名（如 `v2.1.0` 或 `Sprint 24`） |
| 截止日期 | 必须设置 |
| 描述 | 包含本迭代目标和范围 |
| Issue | 所有 Issue 必须关联里程碑 |

✅ Correct:

```
里程碑: v2.1.0
截止日期: 2025-08-01
描述: 用户认证模块重构 + 支付流程优化
关联 Issue: #101, #103, #105, #107
进度: 3/4 完成
```

❌ Wrong:

```
里程碑: 下个版本
截止日期: (未设置)
描述: (空)
```

#### 看板视图建议

| 视图 | 用途 |
|------|------|
| Board | 日常任务流转 |
| Table | 批量编辑和筛选 |
| Roadmap | 里程碑时间线 |

---

### R07 — CODEOWNERS

**MUST** — 项目必须配置 CODEOWNERS 文件，定义代码所有权和自动 Review 分配。

#### 文件位置

```
.github/CODEOWNERS
```

或根目录 `CODEOWNERS`（优先级低于 `.github/`）。

#### CODEOWNERS 语法

✅ Correct:

```codeowners
# 全局默认 Owner
* @team-lead

# 按目录分配
/src/auth/ @auth-team @security-lead
/src/api/ @api-team
/src/ui/ @frontend-team
/src/infra/ @devops-team

# 按文件类型分配
*.sql @db-team
*.tf @devops-team
Dockerfile @devops-team
docker-compose*.yml @devops-team

# 关键配置文件
.github/workflows/ @devops-team
package.json @tech-lead
pom.xml @tech-lead

# 安全相关
/src/auth/jwt/ @security-lead @auth-team
/src/payment/ @payment-team @security-lead
*.pem @security-lead
*.key @security-lead
```

❌ Wrong:

```codeowners
* @everyone
/src/ @all-devs
```

#### CODEOWNERS 规则

| 规则 | 说明 |
|------|------|
| 最小权限 | 每个 Owner 只负责自己领域的代码 |
| 团队 vs 个人 | 优先使用 Team（`@org/team`），避免单点依赖 |
| 多 Owner | 关键模块指定多个 Owner，确保至少一人 Review |
| 安全模块 | 安全相关代码必须包含安全负责人 |
| 定期审查 | 每季度审查 CODEOWNERS，移除已离职人员 |
| 行末优先 | 多条规则匹配时，最后一条生效 |

#### 配合分支保护

CODEOWNERS 必须与分支保护规则配合使用：

```
Settings → Branches → Branch protection rules
  → Require review from Code Owners ✅
```

**开启后，CODEOWNERS 中列出的 Owner 必须批准 PR 才能合并。**

---

### R08 — README 规范

**MUST** —项目根目录必须包含 README.md，内容完整、结构清晰。

#### README 结构

✅ Correct:

```markdown
# Project Name

> 一句话描述项目

## Overview

项目详细介绍，解决什么问题，核心特性。

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 15

### Installation

```bash
git clone https://github.com/org/project.git
cd project
npm ci
cp .env.example .env
npm run dev
```

### Configuration

| 环境变量 | 必填 | 默认值 | 说明 |
|---------|------|-------|------|
| `DATABASE_URL` | 是 | - | 数据库连接串 |
| `PORT` | 否 | 3000 | 服务端口 |
| `LOG_LEVEL` | 否 | info | 日志级别 |

## Usage

基本使用示例和 API 说明。

## Development

### Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建 |
| `npm run lint` | 代码检查 |
| `npm test` | 运行测试 |

### Project Structure

```
src/
├── auth/       ← 认证模块
├── api/        ← API 层
├── db/         ← 数据库
└── utils/      ← 工具函数
```

## Contributing

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## License

本项目基于 [MIT License](LICENSE) 开源。
```

❌ Wrong:

```markdown
# my-project

TODO: write readme
```

#### README 必须包含的内容

| 章节 | 必须 | 说明 |
|------|------|------|
| 项目名称 + 描述 | ✅ | 一句话说明项目是什么 |
| Overview | ✅ | 项目详细介绍 |
| Installation | ✅ | 安装步骤，可复制粘贴 |
| Configuration | ✅ | 环境变量和配置说明 |
| Usage | ✅ | 基本使用示例 |
| Development | ⚡ 推荐 | 开发相关命令和结构 |
| Contributing | ⚡ 推荐 | 指向 CONTRIBUTING.md |
| License | ✅ | 指向 LICENSE 文件 |

#### README 禁止事项

- 禁止包含敏感信息（密码、Token、内网地址）
- 禁止包含过时信息（版本号、链接失效）
- 禁止使用 TODO 占位
- 禁止截图包含真实数据

---

### R09 — Secrets 管理

**MUST** — 项目必须安全管理 GitHub Secrets 和环境变量，禁止在代码中硬编码任何敏感信息。

#### GitHub Secrets 配置

| 级别 | 路径 | 适用场景 |
|------|------|---------|
| Repository | Settings → Secrets and variables → Actions | 单仓库使用 |
| Environment | Settings → Environments → [env] → Secrets | 按环境隔离（prod / staging） |
| Organization | Organization → Settings → Secrets | 跨仓库共享 |

#### Secrets 命名规范

✅ Correct:

```
# 格式：<SCOPE>_<RESOURCE>_<ATTRIBUTE>
DB_HOST
DB_PASSWORD
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DOCKER_REGISTRY_TOKEN
SLACK_WEBHOOK_URL
```

❌ Wrong:

```
secret1
my_password
key
token
PROD_DB_PASSWORD_IN_PLAIN_TEXT
```

#### Workflow 中使用 Secrets

✅ Correct:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: ./deploy.sh
```

❌ Wrong:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: |
          export DB_HOST="10.0.1.100"
          export DB_PASSWORD="p@ssw0rd123"
          ./deploy.sh
```

#### Environment 保护规则

| 规则 | Production | Staging |
|------|-----------|---------|
| Required reviewers | ✅ 2 人 | ⚡ 1 人 |
| Wait timer | 5 分钟 | 无 |
| Deployment branch | `main` only | `main` + `develop` |

#### 安全实践

| 实践 | 说明 |
|------|------|
| 最小权限 | 只配置 Workflow 实际需要的 Secrets |
| 环境隔离 | Production 和 Staging 使用不同 Secrets |
| 定期轮换 | 每 90 天轮换一次 Secrets |
| 审计日志 | 定期检查 Secrets 访问记录 |
| 禁止日志泄露 | Workflow 中不打印 Secrets 值 |
| 禁止 Fork PR 读取 | `pull_request` 事件不暴露 Secrets |

#### Variables vs Secrets

| 类型 | 用途 | 是否加密 | 示例 |
|------|------|---------|------|
| Variables | 非敏感配置 | 否 | `NODE_ENV`、`REGISTRY_URL` |
| Secrets | 敏感信息 | 是 | `DB_PASSWORD`、`AWS_SECRET_ACCESS_KEY` |

**非敏感配置使用 Variables，敏感信息使用 Secrets。不要把所有配置都放进 Secrets。**

---

### R10 — 开源项目规范

**SHOULD** — 开源项目必须包含 LICENSE、CONTRIBUTING 和 Code of Conduct，确保项目合规和社区友好。

#### LICENSE

项目必须包含 `LICENSE` 文件。选择 License 时参考：

| License | 特点 | 适用场景 |
|---------|------|---------|
| MIT | 最宽松，允许商用、修改、分发 | 工具库、SDK |
| Apache 2.0 | 宽松 + 专利授权 | 企业级开源项目 |
| GPL 3.0 | 衍生作品必须开源 | 希望生态开源 |
| AGPL 3.0 | 网络服务也必须开源 | SaaS 核心组件 |
| BSD 3-Clause | 类似 MIT，禁止使用项目名背书 | 学术项目 |

✅ Correct:

```
项目根目录包含 LICENSE 文件
README.md 中声明 License 类型
package.json / pom.xml 中声明 License
```

❌ Wrong:

```
无 LICENSE 文件
README 中写 "All rights reserved"
代码中随意复制他人 GPL 代码但使用 MIT License
```

#### CONTRIBUTING.md

项目应包含 `.github/CONTRIBUTING.md`：

✅ Correct:

```markdown
# Contributing to Project Name

感谢你对本项目的贡献！请阅读以下指南。

## 如何贡献

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/your-feature`）
3. 提交变更（遵循 Conventional Commits）
4. 推送到 Fork（`git push origin feature/your-feature`）
5. 创建 Pull Request

## 开发环境搭建

参考 README.md 的 Development 章节。

## 代码规范

- 遵循项目的 ESLint / Checkstyle 配置
- Commit Message 遵循 Conventional Commits
- PR 粒度 ≤400 行

## 提交 Issue

- Bug 报告使用 Bug Report 模板
- 功能请求使用 Feature Request 模板
- 搜索已有 Issue，避免重复

## Review 流程

- CI 必须通过
- 至少 1 人 Approve
- 所有 MUST 评论已解决

## License

提交代码即表示你同意以项目 License 发布。
```

❌ Wrong:

```markdown
# Contributing

欢迎贡献！
```

#### Code of Conduct

项目应包含 `CODE_OF_CONDUCT.md`，推荐使用 [Contributor Covenant](https://www.contributor-covenant.org/)：

✅ Correct:

```
项目根目录包含 CODE_OF_CONDUCT.md
采用 Contributor Covenant v2.1
README.md 中添加链接
```

❌ Wrong:

```
无 Code of Conduct
自行编写不规范的准则
```

#### 开源项目 Checklist

| 项目 | 必须 | 说明 |
|------|------|------|
| LICENSE | ✅ | 开源协议 |
| README.md | ✅ | 项目说明 |
| CONTRIBUTING.md | ✅ | 贡献指南 |
| CODE_OF_CONDUCT.md | ✅ | 行为准则 |
| .github/ISSUE_TEMPLATE/ | ✅ | Issue 模板 |
| .github/PULL_REQUEST_TEMPLATE.md | ✅ | PR 模板 |
| .github/CODEOWNERS | ⚡ 推荐 | 代码所有权 |
| SECURITY.md | ⚡ 推荐 | 安全策略 |  |
| CHANGELOG.md | ⚡ 推荐 | 变更日志 |

#### SECURITY.md

安全相关的项目应包含 `SECURITY.md`：

✅ Correct:

```markdown
# Security Policy

## Reporting a Vulnerability

请勿通过公开 Issue 报告安全漏洞。

请发送邮件至 security@example.com，包含：
- 漏洞描述
- 复现步骤
- 影响范围

我们将在 48 小时内响应，90 天内修复。

## Supported Versions

| 版本 | 是否支持 |
|------|---------|
| 2.x | ✅ |
| 1.x | ⚡ 仅安全修复 |
| < 1.0 | ❌ |
```

❌ Wrong:

```markdown
# Security

发现漏洞请提 Issue
```

---

## Checklist

- [ ] PR 工作流根据项目类型选择 Fork 或 Branch 模式
- [ ] 配置 PR 模板（.github/PULL_REQUEST_TEMPLATE.md）
- [ ] CI 未通过的 PR 禁止人工 Review
- [ ] 配置 Issue 模板（Bug Report / Feature Request）
- [ ] 建立标签体系（类型 / 优先级 / 状态 / 范围）
- [ ] GitHub Actions Workflow 结构清晰（ci / cd / release）
- [ ] 触发条件限定分支，避免不必要的运行
- [ ] Job 拆分合理，使用 needs 声明依赖
- [ ] Workflow 使用最小权限（permissions）
- [ ] main 和 develop 分支开启保护规则
- [ ] Required Review 和 Status Check 已配置
- [ ] Release 遵循 Semantic Versioning
- [ ] 自动生成 Changelog
- [ ] 使用 GitHub Release 发布
- [ ] 配置 Project Board 看板和自动化规则
- [ ] 里程碑设置截止日期和描述
- [ ] 配置 CODEOWNERS 文件
- [ ] CODEOWNERS 与分支保护规则配合使用
- [ ] README 包含必要章节（描述 / 安装 / 配置 / 使用）
- [ ] Secrets 使用 Environment 级别隔离
- [ ] 禁止在代码和 Workflow 中硬编码敏感信息
- [ ] 开源项目包含 LICENSE / CONTRIBUTING / Code of Conduct
- [ ] 安全项目包含 SECURITY.md