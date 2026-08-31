# Standard Harness Template

> 标准 .harness 模板，适用于 80% 的企业项目。
>
> 接入时间：约 30 分钟。

---

## 使用方法

```bash
# 1. 复制本目录所有内容到项目根目录的 .harness/
cp -r templates/harness/standard/. /path/to/your-project/.harness/

# 2. 编辑 AGENTS.md，填写项目信息
# 3. 编辑 harness.yaml，配置项目参数
# 4. 在 rules/ 下添加项目特定规则
# 5. 在 knowledge/ 下补充项目知识（架构、业务流程、数据模型）
# 6. 根据项目实际结构调整 context/layers.yaml 和 config/paths.yaml
# 7. 开始开发
```

---

## 结构

```
.harness/
├── AGENTS.md                      ← AI 入口（必须编辑）
├── harness.yaml                   ← 治理配置（必须编辑）
├── rules/
│   └── README.md                  ← 规则占位（待补充）
├── knowledge/
│   └── README.md                  ← 知识索引（待补充）
├── skills/
│   └── skills.yaml                ← Skill 注册表（可选）
├── workspace/
│   ├── current/
│   │   └── README.md
│   └── history/
│       └── README.md
├── context/
│   └── layers.yaml                ← 上下文分层加载策略
└── config/
    └── paths.yaml                 ← 项目路径常量
```

---

## 与 Bootstrap 的差异

| 新增内容 | 用途 |
|---------|------|
| `harness.yaml` | 治理配置（maturity、workspace、context 策略） |
| `knowledge/` | 项目知识库（架构、业务流程、数据模型） |
| `skills/skills.yaml` | Skill 注册表（可选，详见 Skill-Governance.md） |
| `context/layers.yaml` | 上下文分层加载（L1 常驻 / L2 阶段 / L3 按需） |
| `config/paths.yaml` | 项目路径常量 |

---

## 升级路径

- **Enterprise**：参考 `11-AI-DevTools/Harness-Bootstrap.md` 的 Enterprise 章节
  - 增加 `agents/`（多 Agent 协作）
  - 增加 `mcp/`（MCP Server 集成）
  - 增加 `governance/`（治理策略）
  - 增加 `audit/`（审计记录）
  - 增加 `public/`（可复用资源）

详见 [Harness-Bootstrap.md](../../../11-AI-DevTools/Harness-Bootstrap.md)。
