---
name: harness-vcs
description: 在 Harness 项目中执行版本控制提交时使用——先读 .harness/project.yaml 的 vcs 字段，按 git 或 svn 分派对应提交协议。当用户要求提交变更、撰写提交信息、处理 SVN 两段式提交或中文乱码/E155040/E200009 时触发。不适用于没有 .harness/project.yaml 的项目。
---

# harness-vcs：提交协议（按 vcs 分派）

## 前置
读 `.harness/project.yaml` 的 `vcs` 字段（`git` | `svn`），据此进入对应分支。

## git 分支
- 提交信息用 Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:`。
- **禁止** `git add -A` / `git add .`；必须按文件名添加。
- 用户明确指令的常规提交（commit / push / tag）直接执行，不再二次确认；AI **主动提议**的提交需先确认。
- 高危操作（`push --force` / `reset --hard` / `rebase` / `branch -D` / 删除分支）需明确确认后才执行。

## svn 分支
- 两段式提交：第一段提交主体改动 + 归档目录；第二段回填 `tasks.md` / `verify.md` 中的版本号并提交。
- 中文提交信息必须 `-F <UTF-8 文件> --encoding UTF-8`（无 locale 环境省略 `--encoding` 会按 Latin-1 误读，导致日志双重编码损坏）。
- 提交后用 `svn log --xml -r <rev>` 对中文日志做字节级校验，确认无损。
- 整树 move 必须与子路径改动放在同一提交事务（否则 E200009 路径不存在错误）。
- 混合版本工作副本批量 move 触发 E155040：先 `svn status -v` 确认无本地改动，再对目标路径局部 update，**禁止**整工作副本 update。

## 权威来源（唯一 SSOT，禁止复制正文）
- `contract/adoption-contract.md` §4.1（SVN 提交编码约定与 r16389/r16390 损坏实证）
- `docs/superpowers/retros/2026-10-17-paynow-migration-retro.md`（E155040 混合版本处置协议与 E200009 move 一致性批次教训）

## 失败回退
- `svn log --xml` 校验发现日志乱码 → 停止后续提交并报告（客户端不可自行修复，需 SVN 管理员启用 `pre-revprop-change` hook）。
