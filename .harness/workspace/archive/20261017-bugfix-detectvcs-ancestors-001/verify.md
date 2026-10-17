# Verify — bugfix-detectvcs-ancestors-001

> 归档前必备。未验证不得声称通过；未执行的检查不得列入。

## 构建

| 命令 | 结果 | 证据（日志/输出位置） |
| --- | --- | --- |
| `node src/validate.mjs` | PASS | `ok: true, findings: []` |
| `node src/validate.mjs --project . --strict` | PASS | `errorCount: 0, warningCount: 0` |

## 测试

| 范围 | 命令 | 结果 | 证据 |
| --- | --- | --- | --- |
| 全量（含 5 个新增 detectVcs 用例） | `node --test "tests/*.test.mjs"` | 73 / 73 pass | `tests 73, pass 73, fail 0` |

新增用例覆盖：嵌套 SVN WC 根 → svn · 嵌套 git 仓库根 → git · 根双标记 AMBIGUOUS_VCS（不回归）· 根标记优先于祖先（不回归）· 无标记默认 git（不回归）。

## 人工核查

- [x] 验收标准逐条核对（见 `proposal.md`）：
  - [x] 嵌套两层（祖先 `.svn`）返回 svn
  - [x] 双标记 AMBIGUOUS_VCS 不回归
  - [x] 默认 git 不回归（本机 TEMP 祖先链已探测无标记）
  - [x] validate 双模式 PASS、73/73 全绿

## 结论

通过
