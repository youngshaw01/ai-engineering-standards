# Pytest

## Overview

Pytest 测试规范，涵盖测试发现与命名、Fixture 设计、参数化、Mock / Monkeypatch、异步测试、覆盖率配置、插件选型和 CI 集成。适用于基于 Python 3.9+ 的项目。

---

## Rules

### R01 — 测试发现与命名

**MUST** — 遵循 Pytest 默认发现规则：

| 规则 | 说明 |
|------|------|
| 测试文件 | `test_*.py` 或 `*_test.py` |
| 测试类 | `Test*`（无 `__init__`） |
| 测试函数 | `test_*` |
| 测试目录 | `tests/` |

**目录结构：**

```
project/
├── src/my_package/
│   ├── __init__.py
│   ├── calculator.py
│   └── user_service.py
└── tests/
    ├── conftest.py
    ├── unit/
    │   ├── test_calculator.py
    │   └── test_user_service.py
    ├── integration/
    │   └── test_user_repository.py
    └── e2e/
        └── test_api.py
```

✅ Correct:

```python
# tests/unit/test_calculator.py

def test_add_two_numbers():
    assert add(2, 3) == 5

def test_add_negative_numbers():
    assert add(-1, -2) == -3

class TestCalculator:
    def test_multiply(self):
        assert multiply(2, 3) == 6
```

❌ Wrong:

```python
# tests/unit/calculator_tests.py    # 文件名不以 test_ 开头

def addition_test():                 # 函数名不以 test_ 开头
    assert add(2, 3) == 5

class CalculatorTest:                # 类名不以 Test 开头
    def multiply_check(self):        # 方法名不以 test_ 开头
        assert multiply(2, 3) == 6
```

---

### R02 — Fixture 设计

**MUST** — 合理使用 Fixture 作用域和 conftest.py：

**作用域选择：**

| Scope | 生命周期 | 适用场景 |
|-------|---------|---------|
| `function` | 每个测试函数 | 数据库事务回滚、临时文件 |
| `class` | 每个测试类 | 共享测试数据 |
| `module` | 每个测试文件 | 模块级初始化 |
| `session` | 整个测试会话 | 数据库连接、HTTP Client |

✅ Correct:

```python
# tests/conftest.py

import pytest
from myapp.db import get_engine
from myapp.app import create_app

@pytest.fixture(scope="session")
def engine():
    engine = get_engine("sqlite:///test.db")
    yield engine
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    transaction.rollback()
    connection.close()

@pytest.fixture
def app():
    app = create_app(testing=True)
    yield app

@pytest.fixture
def client(app):
    return app.test_client()
```

**conftest.py 层级：**

```
tests/
├── conftest.py              # 全局 Fixture（session scope）
├── unit/
│   ├── conftest.py          # 单元测试 Fixture
│   └── test_user.py
└── integration/
    ├── conftest.py          # 集成测试 Fixture
    └── test_api.py
```

❌ Wrong:

```python
# 在测试文件中定义 session scope Fixture
# tests/unit/test_user.py

@pytest.fixture(scope="session")
def db_session():              # 应放在 conftest.py 中
    ...
```

---

### R03 — 参数化测试

**MUST** — 多组输入使用 `@pytest.mark.parametrize`，禁止重复测试函数：

✅ Correct:

```python
@pytest.mark.parametrize("input_a, input_b, expected", [
    (1, 2, 3),
    (-1, -2, -3),
    (0, 0, 0),
    (100, 200, 300),
])
def test_add(input_a, input_b, expected):
    assert add(input_a, input_b) == expected
```

❌ Wrong:

```python
def test_add_positive():
    assert add(1, 2) == 3

def test_add_negative():
    assert add(-1, -2) == -3

def test_add_zero():
    assert add(0, 0) == 0

def test_add_large():
    assert add(100, 200) == 300
```

**参数化 ID 命名：**

✅ Correct:

```python
@pytest.mark.parametrize("status, expected_code", [
    ("active", 200),
    ("inactive", 404),
], ids=["active_user", "inactive_user"])
def test_get_user_by_status(status, expected_code):
    ...
```

---

### R04 — Mock 与 Monkeypatch

**MUST** — 外部依赖必须 Mock，禁止在单元测试中调用真实外部服务：

**monkeypatch 替换环境变量和属性：**

✅ Correct:

```python
def test_get_database_url(monkeypatch):
    monkeypatch.setenv("DB_HOST", "localhost")
    monkeypatch.setenv("DB_PORT", "5432")
    url = get_database_url()
    assert "localhost:5432" in url
```

**unittest.mock 替换函数调用：**

✅ Correct:

```python
from unittest.mock import patch, MagicMock

def test_send_email():
    with patch("myapp.service.email.send_smtp") as mock_send:
        mock_send.return_value = True
        result = send_welcome_email("user@example.com")
        assert result is True
        mock_send.assert_called_once_with("user@example.com")
```

**Mock 使用原则：**

| 原则 | 说明 |
|------|------|
| Mock 边界 | 只 Mock 外部依赖，不 Mock 被测模块内部方法 |
| Mock 位置 | `patch("module.path.function")`，使用调用方路径 |
| 验证调用 | 使用 `assert_called_once_with` 验证参数 |
| 清理状态 | 使用 `with` 语句或 Fixture 自动清理 |

❌ Wrong:

```python
# Mock 被测模块自身方法 — 测试无意义
def test_calculate():
    with patch("myapp.calculator.add") as mock_add:
        mock_add.return_value = 5
        result = calculate(2, 3)  # calculate 内部调用 add，被 Mock 后测试无意义
```

---

### R05 — 异步测试

**MUST** — 异步代码使用 `pytest-asyncio` 测试：

```bash
pip install pytest-asyncio
```

✅ Correct:

```python
import pytest

@pytest.mark.asyncio
async def test_async_fetch_user():
    user = await fetch_user(1)
    assert user.name == "Alice"

@pytest.mark.asyncio
async def test_async_concurrent_requests():
    results = await asyncio.gather(
        fetch_user(1),
        fetch_user(2),
    )
    assert len(results) == 2
```

**异步 Fixture：**

✅ Correct:

```python
@pytest.fixture
async def db_pool():
    pool = await create_pool("postgresql://localhost/test")
    yield pool
    await pool.close()

@pytest.mark.asyncio
async def test_query(db_pool):
    result = await db_pool.fetch("SELECT 1")
    assert result[0][0] == 1
```

**配置：**

```ini
# pytest.ini 或 pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

---

### R06 — 覆盖率配置

**MUST** — 使用 pytest-cov 配置覆盖率：

```bash
pip install pytest-cov
```

**运行覆盖率：**

```bash
# 终端输出
pytest --cov=my_package --cov-report=term-missing

# HTML 报告
pytest --cov=my_package --cov-report=html

# XML 报告（CI 集成）
pytest --cov=my_package --cov-report=xml
```

**pyproject.toml 配置：**

```toml
[tool.pytest.ini_options]
addopts = "--cov=my_package --cov-report=term-missing"

[tool.coverage.run]
source = ["my_package"]
omit = [
    "*/tests/*",
    "*/migrations/*",
    "*/__init__.py",
]

[tool.coverage.report]
fail_under = 80
exclude_lines = [
    "pragma: no cover",
    "if __name__ == .__main__.:",
    "raise NotImplementedError",
    "pass",
]
```

**覆盖率要求：**

| 模块 | 最低覆盖率 |
|------|-----------|
| 核心业务逻辑 | 80% |
| API 层 | 70% |
| 工具类 | 90% |
| 整体 | 80% |

---

### R07 — 插件选型

**SHOULD** — 根据项目需求选择插件：

| 插件 | 用途 | 必要性 |
|------|------|--------|
| `pytest-cov` | 覆盖率 | 必须 |
| `pytest-asyncio` | 异步测试 | 按需 |
| `pytest-mock` | Mock 封装 | 推荐 |
| `pytest-xdist` | 并行执行 | 推荐 |
| `pytest-randomly` | 随机顺序 | 推荐 |
| `pytest-timeout` | 超时控制 | 推荐 |
| `pytest-freezegun` | 时间 Mock | 按需 |
| `pytest-postgresql` | PostgreSQL Fixture | 按需 |
| `pytest-django` | Django 集成 | 按需 |

**并行执行：**

```bash
# 自动检测 CPU 核心数
pytest -n auto

# 指定进程数
pytest -n 4
```

**超时控制：**

```bash
# 单个测试超时 5 秒
pytest --timeout=5
```

✅ Correct:

```toml
[tool.pytest.ini_options]
addopts = "-n auto --timeout=10"
```

---

### R08 — CI 集成

**MUST** — Pytest 必须集成到 CI 流水线：

**GitHub Actions：**

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      - name: Install dependencies
        run: |
          pip install -e ".[dev]"
      - name: Run tests
        runtests
        run: |
          pytest --cov=my_package --cov-report=xml --junitxml=test-results.xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

**CI 检查项：**

| 检查项 | 命令 |
|--------|------|
| 单元测试 | `pytest tests/unit/` |
| 集成测试 | `pytest tests/integration/` |
| 覆盖率 | `pytest --cov --cov-fail-under=80` |
| Lint | `ruff check .` |
| 类型检查 | `mypy my_package/` |

✅ Correct:

```yaml
- name: Run tests
  run: pytest --cov=my_package --cov-fail-under=80 --junitxml=test-results.xml
```

❌ Wrong:

```yaml
# CI 中不检查覆盖率
- name: Run tests
  run: pytest
```

---

## Checklist

- [ ] 测试文件和函数命名遵循 `test_*` 约定
- [ ] Fixture 作用域合理，共享 Fixture 放在 conftest.py
- [ ] 多组输入使用 `@pytest.mark.parametrize`
- [ ] 外部依赖使用 Mock / Monkeypatch，不调用真实服务
- [ ] 异步代码使用 `pytest-asyncio`
- [ ] 覆盖率 ≥ 80%，CI 中强制检查
- [ ] 插件按需选择，并行执行和超时控制已配置
- [ ] CI 流水线集成 Pytest + 覆盖率 + Lint
