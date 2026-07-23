# Python 3

## Overview

Python 3 工程规范，涵盖版本兼容、类型注解、代码风格、数据模型、异步编程、异常处理、包管理、日志、测试、性能优化、安全及项目结构。适用于 Python 3.10+ 项目。

---

## Rules

### R01 — 版本与兼容性

**MUST** — 项目必须声明最低支持的 Python 版本，并在 `pyproject.toml` 中明确：

```toml
[project]
requires-python = ">=3.10"
```

**MUST** — 使用 Python 3.10+ 特性前，确认团队所有成员理解其语义：

| 特性 | 引入版本 | 说明 |
|------|---------|------|
| `match/case` | 3.10 | 结构化模式匹配 |
| `X \| Y` 联合类型 | 3.10 | 替代 `Union[X, Y]` |
| `X | None` 可选类型 | 3.10 | 替代 `Optional[X]` |
| Walrus Operator `:=` | 3.8 | 赋值表达式 |
| Type Alias `type X = ...` | 3.10 | 类型别名语法 |
| `ExceptionGroup` | 3.11 | 异常组 |
| `tomllib` | 3.11 | 内置 TOML 解析 |

✅ Correct:

```python
# Python 3.10+ 联合类型语法
def process(value: int | str) -> None:
    pass

# match/case 结构化匹配
def handle_status(code: int) -> str:
    match code:
        200:
            return "OK"
        404:
            return "Not Found"
        _:
            return "Unknown"
```

❌ Wrong:

```python
# 混用旧式 Union 语法（3.10+ 项目应统一）
from typing import Union
def process(value: Union[int, str]) -> None:
    pass

# match/case 缺少 case 导致 SyntaxError
match code:
    200:
        return "OK"
```

**SHOULD** — 渐进式采用新特性，对已有代码不做强制重构。

---

### R02 — 类型注解

**MUST** — 所有公共函数和类必须有完整的类型注解：

✅ Correct:

```python
from __future__ import annotations

from typing import Sequence


def format_user(name: str, age: int, tags: Sequence[str] | None = None) -> dict[str, object]:
    """格式化用户信息。"""
    payload: dict[str, object] = {"name": name, "age": age}
    if tags is not None:
        payload["tags"] = tags
    return payload
```

❌ Wrong:

```python
# 缺少返回类型注解
def format_user(name: str, age: int):
    return {"name": name, "age": age}

# 缺少参数类型注解
def format_user(name, age: int) -> dict:
    return {"name": name, "age": age}
```

**MUST** — 使用 `from __future__ import annotations` 启用延迟注解求值，避免循环引用：

```python
from __future__ import annotations

# 此时 Employee 尚未定义，但可以正常使用
class Team:
    members: list[Employee]  # 不会触发 NameError
```

**SHOULD** — 优先使用 `typing` 模块的标准泛型，而非内置容器的原始形式：

| 推荐写法 | 不推荐写法 |
|----------|-----------|
| `list[int]` | `List[int]` |
| `dict[str, int]` | `Dict[str, int]` |
| `tuple[str, int]` | `Tuple[str, int]` |
| `int \| None` | `Optional[int]` |
| `int \| str` | `Union[int, str]` |

**SHOULD** — 复杂类型使用 `type` 别名提高可读性：

```python
type UserID = int
type Email = str
type UserRole = "admin" | "editor" | "viewer"


def get_user(user_id: UserID) -> dict[str, object] | None:
    ...
```

**MUST** — 在项目中配置 mypy 并保持零错误：

```ini
; pyproject.toml [tool.mypy]
strict = true
warn_unused_ignores = true
disallow_untyped_defs = true
check_untyped_defs = true
```

---

### R03 — 代码风格

**MUST** — 遵循 PEP 8 并通过自动化工具强制执行：

```toml
[tool.black]
line-length = 99
target-version = ["py310"]

[tool.isort]
profile = "black"
line_length = 99
force_single_line = false
known_first_party = ["myapp"]

[tool.ruff]
line-length = 99
select = ["E", "F", "W", "I", "N", "UP", "B", "C4", "SIM"]
```

**MUST** — 命名规范：

| 类别 | 规范 | 示例 |
|------|------|------|
| 模块 / 包 | snake_case | `user_service.py` |
| 类 | PascalCase | `UserService` |
| 函数 / 方法 | snake_case | `get_user_by_id` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 私有属性 | 单下划线前缀 | `_internal_cache` |
| 名称修饰 | 双下划线前缀 | `__private_method` |

**MUST** — 行长度限制为 99 字符（Black 默认 88，项目可适当放宽）：

✅ Correct:

```python
# 长参数列表换行
def create_user(
    name: str,
    email: str,
    role: str = "member",
    is_active: bool = True,
    extra_metadata: dict[str, object] | None = None,
) -> User:
    ...
```

❌ Wrong:

```python
# 超长行未换行
def create_user(name: str, email: str, role: str = "member", is_active: bool = True, extra_metadata: dict[str, object] | None = None) -> User:
    ...
```

**MUST** — Import 顺序分层：

```python
# 1. 标准库
import os
import sys
from pathlib import Path

# 2. 第三方库
import httpx
import structlog

# 3. 本地模块
from myapp.config import settings
from myapp.models import User
```

**MUST NOT** — 使用以下已被弃用的写法：

```python
# ❌ 不要使用
import collections.abc  # 替代 collections.Mapping
```

---

### R04 — 数据模型

**MUST** — 根据场景选择合适的数据模型：

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 纯数据容器、无验证 | `dataclass` | 轻量、标准库 |
| API 请求/响应、需要验证 | `pydantic.BaseModel` | 自动验证、序列化 |
| 不可变对象 | `dataclass(frozen=True)` | 防止意外修改 |
| 配置对象 | `pydantic.BaseModel` + `Settings` | 环境变量集成 |

✅ Correct:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Point:
    """不可变的二维坐标点。"""
    x: float
    y: float

    def distance(self) -> float:
        return (self.x ** 2 + self.y ** 2) ** 0.5
```

```python
from pydantic import BaseModel, Field, field_validator


class CreateUserRequest(BaseModel):
    """创建用户的请求模型。"""
    name: str = Field(..., min_length=1, max_length=64)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    age: int = Field(..., ge=0, le=200)

    @field_validator("name")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()
```

❌ Wrong:

```python
# 使用普通类代替 dataclass（冗余且易出错）
class Point:
    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y

# Pydantic 模型缺少字段约束
class CreateUserRequest(BaseModel):
    name: str
    email: str  # 无格式校验
    age: int    # 无范围约束
```

**SHOULD** — Pydantic 模型使用 `model_config` 配置行为：

```python
from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(
        frozen=True,           # 不可变
        populate_by_name=True, # 允许 alias 或字段名
        extra="forbid",       # 禁止额外字段
    )

    id: int
    name: str
```

---

### R05 — 异步编程

**MUST** — I/O 密集型操作使用 `async/await`，CPU 密集型操作使用线程池或进程池：

✅ Correct:

```python
import asyncio
from datetime import datetime

import httpx


async def fetch_user(client: httpx.AsyncClient, user_id: int) -> dict[str, object]:
    """异步获取用户信息。"""
    resp = await client.get(f"/api/users/{user_id}")
    resp.raise_for_status()
    return resp.json()


async def fetch_all_users(user_ids: list[int]) -> list[dict[str, object]]:
    """并发获取多个用户信息。"""
    async with httpx.AsyncClient(base_url="https://api.example.com") as client:
        tasks = [fetch_user(client, uid) for uid in user_ids]
        return await asyncio.gather(*tasks)
```

❌ Wrong:

```python
# 在异步函数中使用阻塞调用
async def fetch_user(user_id: int) -> dict[str, object]:
    import requests  # 同步 HTTP 库
    resp = requests.get(f"https://api.example.com/users/{user_id}")  # 阻塞事件循环
    return resp.json()

# 不必要的异步（纯 CPU 计算）
async def compute_hash(data: bytes) -> str:
    import hashlib
    return hashlib.sha256(data).hexdigest()  # 应使用 loop.run_in_executor
```

**MUST** — 使用 `asyncio.Semaphore` 控制并发数：

```python
import asyncio

SEMAPHORUE_SIZE = 20


async def bounded_fetch(client: httpx.AsyncClient, url: str) -> dict[str, object]:
    sem = asyncio.Semaphore(SEMAPHORUE_SIZE)
    async with sem:
        resp = await client.get(url)
        resp.raise_for_status()
        return resp.json()
```

**SHOULD** — 异步上下文管理器管理资源生命周期：

```python
async def main() -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await fetch_all_users([1, 2, 3])
    # client 自动关闭
```

**MUST NOT** — 在异步代码中使用 `time.sleep`，改用 `asyncio.sleep`：

```python
# ❌ 阻塞事件循环
import time
time.sleep(1)

# ✅ 非阻塞等待
await asyncio.sleep(1)
```

---

### R06 — 异常处理

**MUST** — 自定义异常继承 `Exception`，按领域分层组织：

✅ Correct:

```python
class AppError(Exception):
    """应用基础异常。"""

    def __init__(self, message: str, code: str) -> None:
        super().__init__(message)
        self.code = code


class NotFoundError(AppError):
    """资源不存在。"""

    def __init__(self, resource: str, resource_id: int) -> None:
        super().__init__(f"{resource} {resource_id} not found", code="NOT_FOUND")


class ValidationError(AppError):
    """数据校验失败。"""

    def __init__(self, errors: list[dict[str, str]]) -> None:
        super().__init__("Validation failed", code="VALIDATION_ERROR")
        self.errors = errors
```

❌ Wrong:

```python
# 裸 Exception 捕获所有异常
try:
    do_something()
except Exception:  # 吞掉所有异常，无法定位问题
    pass

# 无意义的异常包装
try:
    risky_operation()
except:  # 裸 except 捕获一切，包括 SystemExit 和 KeyboardInterrupt
    pass
```

**MUST** — 使用异常链 `raise ... from ...` 保留原始异常上下文：

✅ Correct:

```python
def get_user(user_id: int) -> User:
    try:
        return db.query(User).get(user_id)
    except DatabaseError as exc:
        raise NotFoundError("User", user_id) from exc
```

❌ Wrong:

```python
# 丢失原始异常信息
try:
    return db.query(User).get(user_id)
except DatabaseError:
    raise NotFoundError("User", user_id)  # 原始异常被丢弃
```

**MUST NOT** — 使用裸 `except` 或裸 `except Exception`：

```python
# ❌ 禁止
try:
    do_something()
except:          # 捕获 BaseException，包括 SystemExit
    pass
except Exception:  # 过于宽泛，应指定具体异常类型
    pass

# ✅ 正确
try:
    do_something()
except ValueError as exc:
    logger.warning("Invalid value: %s", exc)
except TimeoutError as exc:
    logger.error("Operation timed out: %s", exc)
```

**SHOULD** — 业务逻辑中抛出自定义异常，框架层统一拦截转换为响应：

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"code": exc.code, "message": str(exc)})
```

---

### R07 — 包管理

**MUST** — 使用 `pyproject.toml` 作为唯一配置文件，不再使用 `setup.py` / `requirements.txt`：

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "myapp"
version = "0.1.0"
description = "My application"
requires-python = ">=3.10"
dependencies = [
    "httpx>=0.27,<1.0",
    "pydantic>=2.0,<3.0",
    "structlog>=24.0,<25.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "ruff>=0.4",
    "mypy>=1.10",
]
```

**MUST** — 使用 Poetry 或 uv 管理依赖和虚拟环境：

```bash
# uv 方式（推荐，速度更快）
uv init myapp
uv add httpx pydantic structlog
uv add --group dev pytest ruff mypy

# Poetry 方式
poetry init
poetry add httpx pydantic structlog
poetry add --group dev pytest ruff mypy
```

**MUST** — 锁定依赖版本，确保可复现构建：

```bash
# uv lock
uv lock

# Poetry lock
poetry lock
```

**MUST NOT** — 将 `__pycache__`、`.venv`、`*.pyc` 提交到版本库：

```gitignore
__pycache__/
*.py[cod]
.venv/
venv/
*.egg-info/
dist/
build/
```

**SHOULD** — 使用 `uv tool` 或 `poetry run` 执行脚本，避免全局安装：

```bash
# uv tool 方式
uv tool run myapp

# Poetry 方式
poetry run python -m myapp
```

---

### R08 — 日志规范

**MUST** — 使用标准 `logging` 模块，禁止使用 `print` 输出日志：

✅ Correct:

```python
import logging

logger = logging.getLogger(__name__)


def process_order(order_id: int) -> None:
    logger.info("Processing order %s", order_id)
    try:
        result = do_process(order_id)
        logger.info("Order %s processed successfully", order_id)
    except DatabaseError as exc:
        logger.error("Failed to process order %s: %s", order_id, exc)
        raise
```

❌ Wrong:

```python
# 使用 print 代替日志
print(f"Processing order {order_id}")

# 字符串拼接（性能差）
logger.info("Processing order " + str(order_id))
```

**SHOULD** — 使用 structlog 实现结构化日志：

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
)

logger = structlog.get_logger()

# 使用
logger.info("order_processed", order_id=123, amount=99.9)
```

**MUST** — 日志级别使用规范：

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| `DEBUG` | 开发调试信息 | 变量值、SQL 语句 |
| `INFO` | 关键业务流程 | 订单创建、用户登录 |
| `WARNING` | 可恢复的异常 | 重试成功、降级生效 |
| `ERROR` | 需要人工关注的错误 | 数据库连接失败 |
| `CRITICAL` | 系统级故障 | 服务不可用 |

**SHOULD** — 生产环境使用 JSON 格式日志，便于日志平台采集：

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),  # JSON 输出
    ],
)
```

**SHOULD** — 使用 `contextvars` 传递 correlation ID：

```python
import contextvars
import uuid

correlation_id: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id")


def setup_correlation_id() -> None:
    correlation_id.set(uuid.uuid4().hex)


# 日志自动包含 correlation_id
logger.info("request_handled", correlation_id=correlation_id.get())
```

---

### R09 — 测试规范

**MUST** — 使用 pytest 作为测试框架，测试文件命名为 `test_*.py`：

✅ Correct:

```python
# tests/test_user_service.py
import pytest

from myapp.services.user_service import UserService
from myapp.models import User


@pytest.fixture
def user_service() -> UserService:
    return UserService(repository=InMemoryUserRepository())


def test_create_user_success(user_service: UserService) -> None:
    user = user_service.create_user(name="Alice", email="alice@example.com")
    assert user.id > 0
    assert user.name == "Alice"
    assert user.email == "alicen@example.com"


def test_create_user_duplicate_email(user_service: UserService) -> None:
    user_service.create_user(name="Alice", email="alice@example.com")
    with pytest.raises(DuplicateEmailError):
        user_service.create_user(name="Bob", email="alice@example.com")
```

❌ Wrong:

```python
# 使用 unittest 风格（项目统一用 pytest）
import unittest

class TestUserService(unittest.TestCase):
    def test_create_user(self):
        ...
```

**MUST** — Fixture 设计原则：

- 共享 fixture 放在 `conftest.py`
- fixture 命名描述用途
- 使用 `yield` 实现 teardown
- 优先使用工厂函数而非硬编码数据

```python
# tests/conftest.py
import pytest

from myapp.models import User


@pytest.fixture
def sample_user() -> User:
    return User(id=1, name="Test", email="test@example.com")


@pytest.fixture
def users(sample_user: User) -> list[User]:
    return [sample_user, User(id=2, name="Alice", email="alice@example.com")]
```

**SHOULD** — 使用 `pytest.mark.parametrize` 进行参数化测试：

```python
@pytest.mark.parametrize(
    "email,expected_valid",
    [
        ("user@example.com", True),
        ("invalid.email", False),
        ("", False),
    ],
)
def test_email_validation(email: str, expected_valid: bool) -> None:
    assert validate_email(email) == expected_valid
```

**MUST** — Mock 外部依赖，不 mock 被测对象本身：

✅ Correct:

```python
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_fetch_user() -> None:
    mock_response = AsyncMock()
    mock_response.json.return_value = {"id": 1, "name": "Alice"}
    mock_response.raise_for_status = AsyncMock()

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        user = await fetch_user(1)

    assert user["name"] == "Alice"
```

**SHOULD** — 配置 pytest 覆盖率：

```ini
; pyproject.toml [tool.pytest.ini_options]
addopts = "-v --tb=short --cov=myapp --cov-report=term-missing"

[tool.coverage.run]
source = ["myapp"]
omit = ["tests/*", "*/migrations/*"]
fail_under = 80
```

---

### R10 — 性能优化

**MUST** — 优化前先测量，不凭直觉优化：

```python
import cProfile
import pstats


def profile_function() -> None:
    profiler = cProfile.Profile()
    profiler.enable()
    main()
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats("cumulative").print_stats(20)
```

**SHOULD** — 使用生成器处理大数据集，避免一次性加载全部数据：

✅ Correct:

```python
def read_large_file(path: str) -> Generator[str, None, None]:
    """逐行读取大文件，内存友好。"""
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.strip()


def process_lines(path: str) -> list[str]:
    return [line.upper() for line in read_large_file(path)]
```

❌ Wrong:

```python
def read_large_file(path: str) -> list[str]:
    """一次性读取全部内容，可能导致 OOM。"""
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f]
```

**SHOULD** — 使用 `functools.lru_cache` 缓存重复计算结果：

```python
from functools import lru_cache


@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

**SHOULD** — 异步 IO 使用连接池复用连接：

```python
import httpx

# 连接池自动管理
async with httpx.AsyncClient(
    base_url="https://api.example.com",
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    timeout=httpx.Timeout(30.0),
) as client:
    resp = await client.get("/api/users")
```

**MUST NOT** — 在热路径上使用低效操作：

```python
# ❌ 字符串拼接在循环中
result = ""
for item in items:
    result += str(item)  # 每次创建新字符串

# ✅ 使用 join
result = "".join(str(item) for item in items)

# ❌ 列表推导式内嵌函数调用
results = [expensive_fn(x) for x in range(10000)]

# ✅ 分批处理
batch_size = 1000
for i in range(0, 10000, batch_size):
    results = [expensive_fn(x) for x in range(i, i + batch_size)]
```

---

### R11 — 安全

**MUST** — 所有外部输入必须校验，不信任任何来源的数据：

✅ Correct:

```python
from pydantic import BaseModel, Field, field_validator


class SearchQuery(BaseModel):
    keyword: str = Field(..., max_length=200)
    page: int = Field(1, ge=1, le=10000)
    size: int = Field(20, ge=1, le=100)

    @field_validator("keyword")
    @classmethod
    def sanitize_keyword(cls, v: str) -> str:
        # 去除潜在危险字符
        return v.replace("<", "").replace(">", "").replace("script", "")
```

❌ Wrong:

```python
# 直接使用外部输入，无任何校验
def search(keyword: str, page: int, size: int) -> list[dict]:
    return db.search(keyword, page, size)  # keyword 可能包含恶意内容
```

**MUST** — 使用参数化查询防止 SQL 注入：

✅ Correct:

```python
# SQLAlchemy 方式
users = session.execute(
    select(User).where(User.name == name)
).scalars().all()

# 原生 SQL 参数化
cursor.execute("SELECT * FROM users WHERE name = :name", {"name": name})
```

❌ Wrong:

```python
# 字符串拼接（SQL 注入风险）
cursor.execute(f"SELECT * FROM users WHERE name = '{name}'")

# 即使使用了 ORM，也禁止 raw string 拼接
session.execute(text(f"SELECT * FROM users WHERE name = '{name}'"))
```

**MUST** — 定期扫描依赖安全漏洞：

```bash
# uv 方式
uv security audit

# Poetry 方式
poetry show --audit

# pip-audit（通用）
pip-audit
```

**MUST** — 密钥和敏感信息通过环境变量或密钥管理服务获取，禁止硬编码：

✅ Correct:

```python
import os

DATABASE_URL = os.environ["DATABASE_URL"]
SECRET_KEY = os.environ["SECRET_KEY"]
```

❌ Wrong:

```python
# 硬编码密钥
DATABASE_URL = "postgresql://user:pass@localhost:5432/db"
SECRET_KEY = "my-secret-key-123"
```

**MUST** — 使用 `subprocess.run` 时禁止 shell=True，避免命令注入：

✅ Correct:

```python
import subprocess

result = subprocess.run(
    ["git", "clone", repo_url, target_dir],
    capture_output=True,
    text=True,
    check=True,
)
```

❌ Wrong:

```python
# shell=True + 用户输入 = 命令注入风险
subprocess.run(f"git clone {repo_url}", shell=True, check=True)
```

---

### R12 — 项目结构

**MUST** — 项目目录遵循标准布局：

```
myapp/
├── pyproject.toml
├── README.md
├── .gitignore
├── src/
│   └── myapp/
│       ├── __init__.py
│       ├── __main__.py      # python -m myapp 入口
│       ├── config.py         # 配置管理
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py
│       ├── services/
│       │   ├── __init__.py
│       │   └── user_service.py
│       ├── api/
│       │   ├── __init__.py
│       │   └── routes.py
│       └── utils/
│           ├── __init__.py
│           └── validation.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_user_service.py
│   └── test_routes.py
└── migrations/
    └── versions/
```

**MUST** — 每个包目录下必须有 `__init__.py`：

```python
# src/myapp/__init__.py
"""MyApp - A sample application."""

__version__ = "0.1.0"
```

**SHOULD** — 配置管理使用 Pydantic Settings：

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置，从环境变量加载。"""

    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env")

    debug: bool = False
    database_url: str = Field(..., description="PostgreSQL connection URL")
    log_level: str = "INFO"
    max_retries: int = 3
```

**MUST** — 环境变量命名规范：

| 类别 | 前缀 | 示例 |
|------|------|------|
| 应用配置 | `APP_` | `APP_DEBUG`, `APP_LOG_LEVEL` |
| 数据库 | `DB_` 或 `DATABASE_` | `DATABASE_URL` |
| Redis | `REDIS_` | `REDIS_URL` |
| 第三方服务 | `SERVICE_NAME_` | `STRIPE_API_KEY` |

**SHOULD** — 模块拆分原则：

- 单个模块不超过 500 行
- 职责单一，一个模块只做一件事
- 公共 API 在 `__init__.py` 中导出
- 内部实现使用下划线前缀

```python
# src/myapp/__init__.py
from myapp.config import Settings, get_settings
from myapp.services.user_service import UserService

__all__ = ["Settings", "get_settings", "UserService"]
```

---

## Checklist

- [ ] `pyproject.toml` 声明 `requires-python = ">=3.10"`
- [ ] 公共函数和类有完整类型注解，mypy strict 模式零错误
- [ ] 代码通过 Black / Ruff / isort 检查，命名遵循 PEP 8
- [ ] 数据模型根据场景选择 dataclass 或 Pydantic Model
- [ ] I/O 操作使用 async/await，并发受 Semaphore 控制
- [ ] 自定义异常继承 AppError，使用 raise ... from ... 异常链
- [ ] 使用 pyproject.toml + uv/Poetry 管理依赖，锁定版本
- [ ] 使用 logging 模块，禁止 print 输出日志，生产环境 JSON 格式
- [ ] 测试使用 pytest，fixture 放 conftest.py，参数化测试覆盖边界
- [ ] 优化前先 profiling，大数据使用生成器，热路径避免低效操作
- [ ] 外部输入校验，SQL 参数化查询，密钥走环境变量，subprocess 禁 shell=True
- [ ] 项目结构遵循标准布局，配置使用 Pydantic Settings，环境变量带前缀
