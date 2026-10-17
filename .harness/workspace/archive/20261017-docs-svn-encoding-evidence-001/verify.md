# Verify — docs-svn-encoding-evidence-001

> 归档前必备。未验证不得声称通过；未执行的检查不得列入。

## 构建

| 命令 | 结果 | 证据（日志/输出位置） |
| --- | --- | --- |
| `node src/validate.mjs` | PASS | `ok: true, findings: []` |
| `node src/validate.mjs --project . --strict` | PASS | `errorCount: 0, warningCount: 0` |

## 测试

| 范围 | 命令 | 结果 | 证据 |
| --- | --- | --- | --- |
| 全量 | `node --test "tests/*.test.mjs"` | 73 / 73 pass | `pass 73, fail 0` |

## 人工核查

- [x] 验收标准逐条核对（见 `proposal.md`）：
  - [x] §4.1 新增「验证通过记录」（ITS r16392/r16393 + PayNow r16394/r16395，`--xml` 字节级核验、22 paths 批量、move 混合场景），既有规则表述（命令表、损坏模式、propset 修复）零改动
  - [x] ITS 复盘 §4-2、PayNow 复盘 §7-1 状态闭环（标注 change-id）
  - [x] validate 双模式 PASS、73/73 全绿

## 结论

通过
