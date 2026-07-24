# SVN

## Overview

SVN（Subversion）版本控制规范，涵盖仓库结构、分支策略、提交约定、合并规则、权限管理、锁定机制和迁移方案。适用于金融、政务、军工等仍使用 SVN 的遗留企业项目。

SVN 采用集中式模型：所有操作依赖中央服务器，而非本地完整副本。这与 Git 的分布式模型有本质区别——理解这一点是正确使用 SVN 的前提。

### SVN vs Git 概念对照表

| SVN | Git | 说明 |
|-----|-----|------|
| `trunk` | `main` / `master` | 主线开发目录 |
| `branches/<name>` | `branch` | 开发或发布分支 |
| `tags/<name>` | `tag` | 版本快照（只读） |
| `svn:ignore` | `.gitignore` | 忽略文件模式 |
| `svn propset` | `git config` | 属性设置 |
| `svn merge` | `git merge` | 合并变更 |
| `svn switch` | `git checkout` | 切换分支 |
| `svn update` | `git pull` | 拉取远程变更 |
| `svn commit` | `git commit` + `push` | 提交到远程 |
| `svn log` | `git log` | 查看历史 |
| `svn diff` | `git diff` | 查看差异 |
| `svn revert` | `git checkout -- .` | 撤销工作区修改 |
| `svn:externals` | `git submodule` | 外部依赖引用 |
| `svn:needs-lock` | 无直接对应 | 二进制文件锁定 |
| `authz` | `CODEOWNERS` | 路径级权限控制 |
| `pre-commit hook` | `commitlint` | 提交前校验 |
| `post-commit hook` | `CI webhook` | 提交后触发 |
| `svnsync` | `git mirror` | 仓库镜像备份 |
| `svnadmin dump` | `git bundle` | 仓库导出 |
| `svn hotcopy` | `git clone --mirror` | 热拷贝备份 |

---

## Rules

### R01 — 仓库结构规范

**MUST** — 仓库必须遵循标准布局 `trunk/branches/tags`：

```
<repo-root>/
├── trunk/           ← 主线开发
│   └── src/
├── branches/        ← 分支
│   ├── feature/xxx-user-login/
│   ├── bugfix/xxx-null-pointer/
│   └── release/2.1.0/
└── tags/            ← 标签（只读）
    ├── v1.0.0/
    ├── v2.1.0/
    └── v2.1.0-rc.1/
```

✅ Correct:

```bash
# 创建标准布局
svn mkdir -m "Create standard layout" \
  https://svn.example.com/repo/trunk \
  https://svn.example.com/repo/branches \
  https://svn.example.com/repo/tags

# 从 trunk 检出
svn checkout https://svn.example.com/repo/trunk project
```

❌ Wrong:

```bash
# 将所有代码放在根目录，无 trunk/branches/tags 分离
https://svn.example.com/repo/
  ├── src/
  ├── user-login-feature/
  └── v1.0/
```

#### 业务分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能分支 | `branches/feature/<ticket>-<desc>` | `branches/feature/JIRA-1234-user-login` |
| 缺陷修复 | `branches/bugfix/<ticket>-<desc>` | `branches/bugfix/JIRA-1235-null-pointer` |
| 紧急修复 | `branches/hotfix/<ticket>-<desc>` | `branches/hotfix/JIRA-1236-payment-fail` |
| 发布分支 | `branches/release/<version>` | `branches/release/2.1.0` |

#### Tag 命名

✅ Correct:

```
tags/v1.0.0
tags/v2.1.3
tags/v3.0.0-rc.1
tags/v3.0.0-beta.2
```

❌ Wrong:

```
tags/1.0
tags/release-1
tags/2024-01-15
```

**Tag 不可变原则：** Tag 创建后禁止修改。如需修正，应删除旧 Tag 并重新创建。

---

### R02 — 分支策略

**MUST** — 使用基于 trunk 的分支策略，团队统一选择一种：

#### 推荐策略（适配 SVN 集中式模型）

```
trunk                    ← 主线开发，始终保持可编译状态
├── branches/feature/xxx ← 功能开发
├── branches/bugfix/xxx  ← 缺陷修复
├── branches/hotfix/xxx  ← 紧急修复（从 trunk 或 tag 创建）
└── branches/release/x.x.x ← 发布分支（从 trunk 创建）
```

#### 何时创建分支

| 场景 | 是否创建分支 | 理由 |
|------|------------|------|
| 日常开发（小改动） | ❌ 直接在 trunk | 避免分支过多导致合并复杂 |
| 功能开发（跨多天） | ✅ feature branch | 隔离未完成功能，不影响主线 |
| 缺陷修复 | ✅ bugfix branch | 独立验证，避免污染 trunk |
| 紧急生产修复 | ✅ hotfix branch | 从生产 tag 创建，快速修复 |
| 发布准备 | ✅ release branch | 冻结功能，仅允许 bugfix |
| 文档更新 | ❌ 直接在 trunk | 影响范围小，无需分支 |

#### 分支生命周期

```bash
# 1. 创建功能分支
svn copy https://svn.example.com/repo/trunk \
  https://svn.example.com/repo/branches/feature/JIRA-1234-user-login \
  -m "Create feature branch for user login"

# 2. 在分支上开发
svn switch https://svn.example.com/repo/branches/feature/JIRA-1234-user-login
# ... 修改代码 ...
svn commit -m "feat(auth): add login endpoint"

# 3. 合并回 trunk
svn switch https://svn.example.com/repo/trunk
svn merge --reintegrate https://svn.example.com/repo/branches/feature/JIRA-1234-user-login
svn commit -m "Merge feature/JIRA-1234-user-login back to trunk"

# 4. 删除已合并的分支
svn delete https://svn.example.com/repo/branches/feature/JIRA-1234-user-login \
  -m "Remove merged feature branch"
```

❌ Wrong:

```bash
# 在 trunk 上直接开发大功能，不创建分支
# 导致 trunk 长期处于不稳定状态

# 创建分支但从不删除，积累大量僵尸分支
```

---

### R03 — 提交规范

**MUST** — Commit Message 遵循 Conventional Commits 适配格式：

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

#### 原子提交

**SHOULD** — 每个提交应是一个完整的逻辑变更：

- 一个提交做一件事
- 提交后代码应可编译、可运行
- 不提交编译失败的代码
- 不提交未使用的代码

✅ Correct:

```bash
svn commit -m "feat(auth): add login endpoint"
svn commit -m "feat(auth): add JWT token generation"
svn commit -m "test(auth): add login endpoint tests"
```

❌ Wrong:

```bash
svn commit -m "update"
svn commit -m "fix bug and add feature"
svn commit -m "WIP"
```

#### 禁止提交的内容

**MUST NOT** — 禁止提交以下内容：

| 类别 | 示例 | 原因 |
|------|------|------|
| 编译产物 | `target/`, `build/`, `dist/` | 体积膨胀，与源码冲突 |
| IDE 配置 | `.idea/`, `*.iml`, `.vscode/` | 因人而异，不应入库 |
| 环境变量 | `.env`, `.env.local` | 含敏感信息 |
| 日志文件 | `*.log` | 持续增长，无意义 |
| 临时文件 | `*.tmp`, `*.bak`, `~$*` | 无用文件 |
| 密钥证书 | `*.pem`, `*.key`, `*.jks` | 安全风险 |

#### 中文 Commit Message 乱码解决方案

**MUST** — SVN 服务器端若使用 GBK 编码（国内企业常见），中文 commit message 会出现乱码。提交时必须指定 `--encoding gbk`。

**根因：** SVN 服务器端 `svnserve.conf` 或历史版本仓库使用 GBK 编码处理非 ASCII 字符，UTF-8 终端输入的中文 commit message 传到 GBK 仓库就会出现乱码。

**基础方案：每次提交强制指定仓库编码**

```bash
# Linux / macOS
svn commit -m "feat(auth): 新增登录接口" --encoding gbk

# Windows PowerShell
svn commit -m "feat(auth): 新增登录接口" --encoding gbk
```

**PowerShell 终端额外配置（解决控制台编码问题）：**

```powershell
# 方式 1：切换控制台代码页到 GBK（936）
chcp 936

# PowerShell 5.1：设置控制台输出编码为 GBK
$OutputEncoding = [System.Text.Encoding]::GetEncoding(936)
[Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding(936)

# PowerShell 7+：推荐使用 UTF-8
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

**多行 / 复杂 commit message 方案（推荐）：**

由于 PowerShell 对中文引号、换行符号敏感，推荐用临时文件 + `-F` 参数：

```powershell
$msg = @"
feat(audit): 注册 audit:api 权限

- 修改内容: 新增 audit:api (0806) 和 audit:api:query (080601) 权限
- Issue 编号: #AUDIT-2026-0723
- 是否影响数据库: 是
"@

# 写到临时文件，避免命令行转义问题
$tmp = New-TemporaryFile
[System.IO.File]::WriteAllText($tmp.FullName, $msg, [System.Text.Encoding]::UTF8)

svn commit -F $tmp.FullName --encoding gbk
Remove-Item $tmp
```

**完整提交命令模板：**

```powershell
svn commit `
    -m "feat(audit): 注册 audit:api 权限

- 修改内容: 新增 audit:api (0806) 和 audit:api:query (080601) 权限
- Issue 编号: #AUDIT-2026-0723
- 是否影响数据库: 是" `
    --encoding gbk
```

✅ Correct:

```bash
# 指定 --encoding gbk，中文不乱码
svn commit -m "fix(device): 修复设备离线状态不更新问题" --encoding gbk
```

❌ Wrong:

```bash
# 不指定 encoding，中文 commit message 乱码
svn commit -m "fix(device): 修复设备离线状态不更新问题"

# 用英文规避问题（治标不治本，不利于团队协作）
svn commit -m "fix(device): fix device offline status not updated"
```

**常见乱码场景与处理：**

| 场景 | 原因 | 解决 |
|------|------|------|
| commit message 乱码 | 未指定 `--encoding gbk` | 提交时加 `--encoding gbk` |
| 文件名中文乱码 | 工作区编码与服务器不一致 | 统一使用 UTF-8 文件编码 |
| PowerShell 输入中文乱码 | 控制台代码页非 936 | `chcp 936` |
| TortoiseSVN 乱码 | 客户端编码设置错误 | 设置 → 常规 → UTF-8 |
| 已提交的乱码 message | 历史已固化 | `svn propset --revprop svn:log` 修改历史 message |

**修正历史乱码 message：**

```bash
# 修改指定版本的 commit message（需要服务器开启 pre-revprop-change hook）
svn propset --revprop -r 1234 svn:log "fix(device): 修复设备离线状态不更新问题" https://svn.example.com/repo
```

---

### R04 — 合并与冲突

**MUST** — 合并操作必须遵循以下规则：

#### 合并范围

| 方向 | 方式 | 说明 |
|------|------|------|
| feature → trunk | `--reintegrate` | 功能完成后合回主线 |
| bugfix → trunk | `--record-only` + 正向合并 | 先记录反向合并，再正向合并 |
| hotfix → trunk + release | 分别合并 | 紧急修复需同时合入主线和发布分支 |
| release → trunk | 正向合并 | 发布分支回合到主线 |

#### 合并流程

```bash
# 1. 更新工作副本到最新
svn update

# 2. 执行合并（reintegrate 模式）
svn merge --reintegrate https://svn.example.com/repo/branches/feature/JIRA-1234-user-login

# 3. 检查冲突
svn status | grep '^C'

# 4. 解决冲突（手动编辑冲突文件）
# ... 解决冲突 ...

# 5. 标记冲突已解决
svn resolved path/to/conflicted-file

# 6. 提交合并结果
svn commit -m "Merge feature/JIRA-1234-user-login back to trunk (r1234)"
```

#### 冲突处理流程

```
发现冲突
    ↓
svn status 查看冲突文件列表
    ↓
手动编辑冲突文件（搜索 <<<<====>>>> 标记）
    ↓
确认保留正确版本
    ↓
svn resolved <file>
    ↓
svn update 验证无遗漏冲突
    ↓
svn commit
```

#### 避免树冲突（Tree Conflict）

树冲突是 SVN 特有的问题，发生在重命名/移动/删除文件时：

✅ Correct:

```bash
# 使用 svn move 而非手动 rm + add
svn move src/old-name.java src/new-name.java

# 删除文件使用 svn delete
svn delete src/deprecated.java

# 大规模重命名用 svn rename
svn rename src/ModuleA src/ModuleB
```

❌ Wrong:

```bash
# 手动删除文件后添加同名文件，触发树冲突
rm src/old-name.java
# ... 创建新文件 ...
svn add src/old-name.java  # 树冲突！

# 混合使用 svn delete 和系统 rm
svn delete src/file.java
rm src/file.java  # 重复操作
```

#### 双向合并追踪

对于需要持续同步的分支（如 release 分支），必须使用 `--record-only` 记录反向合并：

```bash
# 当 trunk 有 bugfix 需要同步到 release 分支时
svn switch https://svn.example.com/repo/branches/release/2.1.0

# 先记录反向合并（告诉 SVN 这个变更已经合过了）
svn merge --record-only https://svn.example.com/repo/trunk

# 然后正向合并实际变更
svn merge https://svn.example.com/repo/trunk

# 提交
svn commit -m "Sync bugfix from trunk to release/2.1.0"
```

---

### R05 — 权限与安全

**MUST** — 仓库必须配置路径级权限控制，防止未授权访问。

#### authz 配置

SVN 使用 `authz` 文件实现目录级权限控制：

✅ Correct:

```ini
# /etc/svn/authz.conf

[groups]
dev-team = zhangsan,lisi,wangwu
senior-dev = zhangsan,lisi
release-team = wangwu,zhaoliu
security-team = admin,zhangsan

[repo:/]
* = r          # 所有人可读
@dev-team = rw  # 开发团队可读写

[repo:/trunk]
@senior-dev = rw     # 资深开发可写 trunk
@dev-team = r         # 普通开发只读 trunk

[repo:/branches]
@dev-team = rw         # 开发团队可读写分支

[repo:/tags]
* = r                  # 所有人只读 tags

[repo:/secret]
@security-team = rw    # 仅安全团队可访问
```

❌ Wrong:

```ini
# 权限过于宽松
[repo:/]
* = rw   # 所有人可读写整个仓库

# 或过于严格
[repo:/]
* =      # 无人可读
```

#### Hooks 配置

**SHOULD** — 使用 pre-commit hook 校验提交信息：

```bash
#!/bin/sh
# /path/to/repo/hooks/pre-commit

COMMIT_MSG=$(cat "$1")

# 校验 Commit Message 格式
if ! echo "$COMMIT_MSG" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|chore|ci|revert)\((.+)\): .+'; then
  echo "ERROR: Commit message must follow Conventional Commits format."
  echo "Example: feat(auth): add login endpoint"
  exit 1
fi

# 检查是否有敏感信息
if svn status | grep -qE '\.(env|pem|key)$'; then
  echo "ERROR: Sensitive files detected in changes."
  exit 1
fi
```

#### 敏感信息禁止提交

**MUST NOT** — 任何输出不得包含：

- AccessKey / SecretKey / Token
- 密码 / 私钥 / 证书
- 数据库连接串
- 内网 IP / 域名
- 手机号 / 邮箱 / 身份证号

如果不慎提交，立即轮换凭据并清理历史。

---

### R06 — 忽略规则

**MUST** — 使用 `svn:ignore` 属性管理忽略文件，避免无关文件进入版本库。

#### svn:ignore 设置

```bash
# 为目录设置忽略模式
svn propset svn:ignore "target build dist out" .

# 查看当前忽略属性
svn propget svn:ignore .
```

#### 常见忽略模式

| 语言/框架 | 忽略模式 |
|----------|---------|
| Java | `target/ build/ *.class *.jar *.war` |
| Node.js | `node_modules/ dist/ build/` |
| Python | `__pycache__/ *.pyc .egg-info/ dist/ build/` |
| Go | `vendor/ bin/` |
| 通用 | `.DS_Store Thumbs.db *.log *.tmp *.bak ~$*` |
| IDE | `.idea/ .vscode/ *.iml *.swp` |
| 环境 | `.env .env.local .env.*.local` |
| 密钥 | `*.pem *.key *.jks *.p12` |

✅ Correct:

```bash
# 设置多个忽略模式（空格分隔）
svn propset svn:ignore "target build dist *.class *.jar" src/

# 使用 global-ignores 全局生效（svnserve.conf）
svn propset svn:global-ignores "*.log *.tmp .DS_Store"
```

❌ Wrong:

```bash
# 忽略模式过于宽泛
svn propset svn:ignore "*" .  # 忽略所有文件！

# 忽略后又手动添加
svn add target/some-important.jar  # 违反忽略规则
```

#### svn:ignore vs global-ignores

| 特性 | `svn:ignore`（局部） | `global-ignores`（全局） |
|------|---------------------|----------------------|
| 作用范围 | 单个目录 | 所有仓库 |
| 配置位置 | 版本库属性 | `svnserve.conf` 或 `config` 目录 |
| 优先级 | 高 | 低 |
| 适用场景 | 项目特定忽略 | 全平台通用忽略 |

**建议：** 将 `*.log`、`*.tmp`、`.DS_Store` 等放入 `global-ignores`；将 `target/`、`node_modules/` 等项目特定模式放入 `svn:ignore`。

---

### R07 — 锁定与二进制文件

**MUST** — 对二进制文件使用 `svn:needs-lock` 属性，防止不可合并冲突。

#### 为什么需要锁定

SVN 无法像文本文件一样自动合并二进制文件。两个用户同时修改同一二进制文件会导致覆盖丢失。

#### 锁定配置

✅ Correct:

```bash
# 为二进制文件设置 needs-lock 属性
svn propset svn:needs-lock "*" design/logo.png
svn propset svn:needs-lock "*" docs/architecture.pdf
svn propset svn:needs-lock "*" assets/icon.ico

# 提交属性变更
svn commit -m "Add svn:needs-lock to binary files"
```

❌ Wrong:

```bash
# 不设置锁定，多人同时修改二进制文件
# 导致后提交者覆盖前提交者的修改
```

#### 锁定工作流程

```bash
# 1. 获取锁
svn lock design/logo.png -m "Updating logo for v2.1"

# 2. 编辑文件
# ... 使用图像编辑器修改 logo.png ...

# 3. 提交并释放锁
svn commit design/logo.png -m "Update logo for v2.1 release"
# 提交后锁自动释放

# 强制释放锁（其他用户持有时）
svn unlock --force design/logo.png
```

#### 二进制文件处理清单

| 文件类型 | 处理方式 | 原因 |
|---------|---------|------|
| 图片（PNG/JPG/SVG） | `svn:needs-lock` | 无法自动合并 |
| PDF/Word/Excel | `svn:needs-lock` | 无法自动合并 |
| 视频/音频 | 外部存储 + 链接 | 体积过大 |
| 字体文件 | `svn:needs-lock` | 二进制，体积小 |
| 编译产物 | 忽略（svn:ignore） | 不应入库 |
| 数据库文件 | 禁止提交 | 体积大，含敏感数据 |

---

### R08 — 迁移与共存

**SHOULD** — 从 SVN 迁移到 Git 或双仓库共存时，遵循以下策略。

#### SVN → Git 迁移策略

| 步骤 | 命令 | 说明 |
|------|------|------|
| 1. 安装 git-svn | `apt install git-svn` | Git 内置 SVN 桥接工具 |
| 2. 克隆 SVN 仓库 | `git svn clone <url>` | 获取完整历史 |
| 3. 映射分支 | 配置 `.git/config` | trunk→main, branches→remotes |
| 4. 转换 Tag | `git tag` 手动创建 | SVN tag 不是 Git tag |
| 5. 清理 | `git gc` | 压缩历史 |

```bash
# 完整迁移示例
git svn clone \
  -s \
  --prefix=svn/ \
  https://svn.example.com/repo \
  repo-git

cd repo-git

# 将 trunk 映射为 main
git branch -m trunk main

# 将 SVN tags 转为 Git tags
for tag in $(git tag -l); do
  git tag -d $tag
done

# 重新创建有意义的 tag
git tag v1.0.0 svn/tags/v1.0.0
git tag v2.1.0 svn/tags/v2.1.0
```

#### git-svn 桥接注意事项

✅ Correct:

```bash
# 定期从 SVN 拉取最新变更
git svn fetch

# 在 Git 分支上开发后，提交回 SVN
git svn dcommit

# 先 rebase 再 dcommit，保持线性历史
git svn rebase
git svn dcommit
```

❌ Wrong:

```bash
# 在 git-svn 克隆的仓库中使用 Git 合并
# 导致 SVN 端出现奇怪的合并提交
git merge feature-branch

# 对已推送到 SVN 的历史执行 rebase
# 破坏 SVN 版本号连续性
git rebase -i origin/main
```

#### 双仓库同步注意事项

| 注意事项 | 说明 |
|---------|------|
| 单向为主 | 优先以 Git 为主仓库，SVN 作为只读参考 |
| 避免双向同步 | 双向同步容易产生冲突和重复提交 |
| Tag 手动映射 | SVN tag 和 Git tag 不会自动同步 |
| 分支名映射 | 建立 SVN branch ↔ Git branch 映射表 |
| 权限同步 | SVN authz 和 Git 权限需单独维护 |

---

### R09 — 备份与恢复

**MUST** — SVN 仓库必须定期备份，确保数据安全。

#### 备份策略

| 方式 | 命令 | 适用场景 | 优点 | 缺点 |
|------|------|---------|------|------|
| svnsync | `svnsync sync` | 异地容灾 | 实时同步，支持增量 | 配置复杂 |
| svn hotcopy | `svnadmin hotcopy` | 日常备份 | 速度快，可直接使用 | 需停服或加锁 |
| svnadmin dump | `svnadmin dump` | 迁移归档 | 格式通用，可压缩 | 恢复慢 |
| 文件系统快照 | OS 层面 | 最快备份 | 几乎零停机 | 依赖存储系统 |

#### svnsync 备份

```bash
# 1. 初始化镜像仓库
svnsync initialize \
  https://svn-backup.example.com/repo \
  https://svn.example.com/repo \
  --non-interactive

# 2. 同步（日常执行）
svnsync sync https://svn-backup.example.com/repo

# 3. 设置定时任务（crontab）
# 每小时增量同步
0 * * * * svnsync sync https://svn-backup.example.com/repo >> /var/log/svnsync.log 2>&1
```

#### svn hotcopy 备份

```bash
# 创建热拷贝（不中断服务）
svnadmin hotcopy \
  /var/svn/repo \
  /backup/svn-repo-$(date +%Y%m%d) \
  --clean-logs

# 清理旧备份（保留最近 7 天）
find /backup -name "svn-repo-*" -mtime +7 -exec rm -rf {} \;
```

#### 灾难恢复流程

```
检测故障
    ↓
评估损坏范围（元数据 or 数据文件）
    ↓
选择恢复方式：
  · 轻微损坏 → svnadmin recover
  · 严重损坏 → 从 backup 恢复
    ↓
恢复镜像仓库（如使用 svnsync）
    ↓
验证完整性：
  · svnlook youngest
  · svn ls <repo-url>
  · 抽查关键文件版本
    ↓
通知团队恢复完成
    ↓
记录事故报告
```

#### 备份验证

**MUST** — 每次备份后必须验证：

```bash
# 验证备份仓库可正常访问
svn ls https://svn-backup.example.com/repo/trunk

# 对比版本号
echo "主仓库最新版本："
svnlook youngest /var/svn/repo
echo "备份仓库最新版本："
svnlook youngest /backup/svn-repo-latest

# 抽样检查文件内容
svn cat https://svn-backup.example.com/repo/trunk/src/Main.java | head -20
```

---

### R10 — 常见陷阱

**MUST** — 避免以下 SVN 常见陷阱。

#### svn:externals 风险

`svn:externals` 可以引用外部仓库，但存在风险：

✅ Correct:

```bash
# 使用固定 revision 锁定外部依赖
svn propset svn:externals "libs https://svn.example.com/libs/common@1234 libs" .

# 或使用固定 tag
svn propset svn:externals "libs https://svn.example.com/libs/common/tags/v1.0.0 libs" .
```

❌ Wrong:

```bash
# 使用浮动 revision（HEAD），外部变更会导致内部构建失败
svn propset svn:externals "libs https://svn.example.com/libs/common libs" .

# 循环引用
svn propset svn:externals "utils https://svn.example.com/repo/trunk/utils" .
# 如果 repo/trunk 又 externals 了 repo/trunk，形成死循环
```

#### 大文件处理

✅ Correct:

```bash
# 大文件使用外部存储，仓库中只存引用
svn propset svn:externals "assets https://artifacts.example.com/svn/project-assets" .

# 或使用 LFS（如已迁移到 Git）
```

❌ Wrong:

```bash
# 直接提交大文件到 SVN
svn add video/training.mp4  # 500MB+

# 导致仓库膨胀，检出时间剧增
```

#### 删除后重建

✅ Correct:

```bash
# 使用 svn delete 而非系统 rm
svn delete src/OldModule.java
svn commit -m "Remove OldModule"

# 如果需要恢复，使用 svn merge 回退
svn merge -r CURRENT:PREV src/OldModule.java
```

❌ Wrong:

```bash
# 使用系统 rm 删除，SVN 不知道文件已被删
rm src/OldModule.java
svn status  # 显示 U（Unversioned），不是 D（Deleted）

# 删除后又添加同名新文件，触发树冲突
rm src/OldModule.java
touch src/OldModule.java
svn add src/OldModule.java  # Tree conflict!
```

#### switch 误用

✅ Correct:

```bash
# 切换分支前先 update
svn update
svn switch https://svn.example.com/repo/branches/feature/JIRA-1234-user-login
```

❌ Wrong:

```bash
# 在有未提交修改时 switch
svn switch https://svn.example.com/repo/branches/feature/xxx
# 可能导致修改丢失或冲突

# switch 到不存在的路径
svn switch https://svn.example.com/repo/branches/nonexistent
```

#### cleanup 死锁

SVN 的 `cleanup` 操作可能因网络问题或并发操作死锁：

✅ Correct:

```bash
# 遇到 cleanup 卡住时，等待一段时间后重试
sleep 30
svn cleanup /path/to/working-copy

# 如果多次重试失败，删除工作副本重新检出
rm -rf /path/to/working-copy
svn checkout https://svn.example.com/repo/trunk /path/to/working-copy
```

❌ Wrong:

```bash
# 在 cleanup 过程中强制中断（Ctrl+C）
# 可能导致工作副本状态损坏

# 并发执行 cleanup
svn cleanup /path/to/wc &
svn cleanup /path/to/wc &  # 竞争导致死锁
```

---

## Checklist

- [ ] 仓库遵循 `trunk/branches/tags` 标准布局
- [ ] 分支命名遵循 `<type>/<ticket>-<desc>` 格式
- [ ] Tag 命名遵循 Semantic Versioning（`vX.Y.Z`）
- [ ] 功能开发超过 1 天必须创建分支
- [ ] Commit Message 遵循 Conventional Commits 格式
- [ ] 每个提交是一个完整的逻辑变更
- [ ] 不提交编译产物、IDE 配置、环境变量
- [ ] 合并前先 update，合并后检查冲突
- [ ] 使用 `svn move` / `svn delete` 避免树冲突
- [ ] 长期分支使用 `--record-only` 记录反向合并
- [ ] 配置 authz 路径级权限控制
- [ ] 配置 pre-commit hook 校验提交信息
- [ ] 二进制文件设置 `svn:needs-lock` 属性
- [ ] 合理配置 `svn:ignore` 和 `global-ignores`
- [ ] 定期备份（至少每日一次）
- [ ] 备份后验证完整性
- [ ] svn:externals 使用固定 revision 或 tag
- [ ] 不提交大文件到仓库
- [ ] 删除文件使用 `svn delete` 而非系统 rm
- [ ] cleanup 卡住时不强制中断，重试或重新检出
