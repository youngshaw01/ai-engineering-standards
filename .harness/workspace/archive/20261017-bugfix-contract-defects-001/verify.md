# Verify — bugfix-contract-defects-001

> 归档前必备。未验证不得声称通过；未执行的检查不得列入。

## 构建

| 命令 | 结果 | 证据（日志/输出位置） |
| --- | --- | --- |
| `node src/validate.mjs` | PASS | `ok: true, findings: []`（2026-10-17 本会话终端输出） |
| `node src/validate.mjs --project . --strict` | PASS | `ok: true, errorCount: 0, warningCount: 0` |
| `node src/validate.mjs --project . --strict`（归档后终验） | PASS | 同上；归档命名 `20261017-` 前缀合规 |

## 测试

| 范围 | 命令 | 结果 | 证据 |
| --- | --- | --- | --- |
| 全量 | `node --test "tests/*.test.mjs"` | 68 / 68 pass | `tests 68, pass 68, fail 0`（duration 3.2s） |

## 人工核查

- [x] 验收标准逐条核对（见 `proposal.md`）：
  - [x] migration-guide §2.1 含 v1 wiki 资产处置指引，画像以 workspace 调度遗产为判定口径
  - [x] adoption-contract §4.1 给出 AI（`-F <UTF-8 文件> --encoding UTF-8`）/ 人工（`--encoding gbk`）两条正确命令，并记载 r16389/r16390 两种实测损坏模式
  - [x] 复盘文档 §1/§3-2/§4-通用 已更新，不再包含"-F 不带 --encoding"的证伪方案
  - [x] validate 双模式 PASS
  - [x] 68/68 全绿

## 结论

通过
