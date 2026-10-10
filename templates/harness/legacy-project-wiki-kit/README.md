# 遗留项目 AI Wiki 工作包

> 可执行的工作规程与模板，**不是**已分析完成的项目 Wiki。
> 真正的业务文档必须由有仓库访问权限的 Agent 根据实际源码生成。

---

## 包含内容

| 路径 | 用途 |
|------|------|
| `AGENTS.md` | 全局规则：证据标准、修改边界、安全约束 |
| `.harness/prompts/` | 阶段 0–6 Prompt + `07-finalize.md`（交付收尾）+ `COORDINATOR.md` |
| `.harness/workflow/` | 操作手册、质量门槛、交接协议、验证清单、状态模板 |
| `.harness/wiki/` | Wiki 索引、`_manifest.yaml`、`_pending` / `_audit` 模板 |

主流程为**阶段 0→6**；`07-finalize.md` 为阶段 6 后的交付收尾，不占独立阶段编号。协调 Agent 控制阶段推进；每个业务域独立分析；每阶段有明确输入、输出和验收门槛。（工作包共 20 个文件。）

**封版状态**：可进入验证阶段，尚未封版。见 `.harness/workflow/validation-checklist.md`。

---

## 接入旧项目

1. 将本目录中的 `AGENTS.md` 和 `.harness/` **复制到目标仓库根目录**。
   - 若目标已有同名文件，**先合并规则，不要直接覆盖**。
   - `.harness/workflow/STATUS.template.md` → `.harness/workflow/STATUS.md`
   - `.harness/wiki/*.template.md` → 去掉 `.template` 后缀（如 `README.md`、`_pending.md`、`_audit.md`）
   - `.harness/wiki/_manifest.template.yaml` → `.harness/wiki/_manifest.yaml`
   - 复制后按 `workflow/README.md`「路径与链接规则」自检 2–3 条 wiki 互链与源码链接
2. 使用能够访问本地仓库、读取源码和创建/修改文件的 Agent；需要仓库写权限，**不需要**生产环境权限。
3. 将 `.harness/prompts/COORDINATOR.md` 交给 Agent，要求从**阶段 0** 开始执行。
   - **不要**让它直接跳到阶段 3 或一次性生成全部文档。
4. 每个阶段验收通过后再继续。支持子 Agent 的平台可并行分析不同业务域；不支持的则逐域串行。
5. 完成后检查 `.harness/wiki/_audit.md` 和 `git diff`，确认源码没有被修改、文档证据可追溯，再决定是否提交到 Git。

---

## 推荐首次执行节奏

先用本流程完成一次**全局 Recon + 业务能力地图**（阶段 0–2），确认入口盘点可靠后，再逐域深入（阶段 3+）。这样最容易发现流程本身的问题，也能避免一开始就把大量未经验证的内容写进 Wiki。

---

## 与 Harness 体系的关系

| 管理层 | 统一管理的内容 |
|--------|----------------|
| 全局规则 | `AGENTS.md`：证据标准、修改边界、安全约束 |
| 流程管理 | `.harness/workflow/`：阶段状态、质量门槛、任务交接、失败恢复 |
| 项目知识 | `.harness/wiki/`：业务域、调用链、数据关系、状态机、跨域流程 |
| 质量控制 | `_pending.md`、`_audit.md`：未决问题、独立审计、修正记录 |
| 后续 AI 开发 | 先读相关业务域和源码证据，再制定修改计划、实现和测试 |

Workflow Skill 概览见 `templates/harness/standard/skills/workflow/legacy-project-wiki/SKILL.md`。

---

## 打包分发

从本仓库根目录打包：

```bash
cd templates/harness
zip -r legacy-project-ai-wiki-kit.zip legacy-project-ai-wiki-kit/
```
