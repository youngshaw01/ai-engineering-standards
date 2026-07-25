# Bootstrap Harness Template

> 最小化 .harness 模板，所有项目接入 `ai-engineering-standards` 的起点。
>
> 接入时间：约 5 分钟。

---

## 使用方法

```bash
# 1. 复制本目录所有内容到项目根目录的 .harness/
cp -r templates/harness/bootstrap/. /path/to/your-project/.harness/

# 2. 编辑 AGENTS.md，填写项目信息
# 3. 在 rules/ 下添加项目特定规则
# 4. 开始开发
```

---

## 结构

```
.harness/
├── AGENTS.md                      ← AI 入口（必须编辑）
├── rules/
│   └── README.md                  ← 规则占位（待补充）
└── workspace/
    ├── current/
    │   └── README.md              ← 当前任务说明
    └── history/
        └── README.md              ← 归档说明
```

---

## 升级路径

- **Standard**：使用 `templates/harness/standard/`
- **Enterprise**：参考 `11-AI-DevTools/Harness-Bootstrap.md` 的 Enterprise 章节

详见 [Harness-Bootstrap.md](../../../11-AI-DevTools/Harness-Bootstrap.md)。
