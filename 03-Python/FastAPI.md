# FastAPI

## Overview

FastAPI 工程规范，涵盖项目结构、路由设计、请求与响应模型、依赖注入、中间件与异常处理、数据库集成、认证与授权、异步编程、测试和部署。适用于基于 FastAPI 构建的 Python Web 服务。

---

## Rules

### R01 — 项目结构

**MUST** — FastAPI 项目必须遵循分层架构，目录结构如下：

```
app/
├── main.py              # 应用入口，组装各层
├── core/                # 核心配置（安全、设置）
│   ├── config.py
│   └── security.py
├── api/                 # API 路由层
│   ├── v1/
│   │   ├── router.py    # 聚合子路由
│   │   ├── users.py     # 用户相关端点
│   │   └── orders.py    # 订单相关端点
├── models/              # SQLAlchemy ORM 模型
│   ├── user.py
│   └── order.py
├── schemas/             # Pydantic 请求/响应模型
│   ├── user.py
│   └── order.py
├── services/            # 业务逻辑层
│   ├── user_service.py
│   └── order_service.py
├── repositories/        # 数据访问层
│   ├── base.py          # 基础 CRUD
│   ├── user_repo.py
│   └── order_repo.py
├── dependencies/        # 可复用依赖
│   ├── db.py           # 数据库会话
│   └── auth.py         # 认证依赖
└── common/              # 公共组件
│   ├── exceptions.py   # 自定义异常
│   └── pagination.py   # 分页工具
```

✅ Correct:

```python
# app/api/v1/router.py
from fastapi import APIRouter
from .users import router as users_router
from .orders import router as orders_router

router = APIRouter()
router.include_router(users_router, prefix="/users", tags=["Users"])
router.include_router(orders_router, prefix="/orders", tags=["Orders"])
```

❌ Wrong:

```python
# app/main.py — 所有路由写在入口文件
@app.get("/users")
@app.post("/users")
@app.get("/orders")
@app.post("/orders")
# ... 几十个端点堆在一个文件
```

**规则说明：**

| 层级 | 职责 | 禁止事项 |
|------|------|---------|
| `api/` | HTTP 层，参数校验、调用 Service | 直接操作数据库 |
| `services/` | 业务逻辑，编排 Repository | 处理 HTTP 请求对象 |
| `repositories/` | 数据访问，SQL 查询 | 包含业务判断逻辑 |
| `models/` | ORM 映射，表结构定义 | 包含业务逻辑 |
| `schemas/` | 请求/响应序列化 | 包含数据库操作 |

---

### R02 — 路由设计

**MUST** — 路由组织使用 `APIRouter`，按资源拆分模块，统一前缀和标签：

✅ Correct:

```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, Query
from typing import List
from ..schemas.user import UserCreate, UserResponse, UserListResponse
from ..services.user_service import UserService

router = APIRouter()

@router.get("/", response_model=UserListResponse, summary="获取用户列表")
async def list_users(
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页条数"),
    service: UserService = Depends(),
):
    return await service.list_users(page, size)

@router.post("/", response_model=UserResponse, status_code=201, summary="创建用户")
async def create_user(
    data: UserCreate,
    service: UserService = Depends(),
):
    return await service.create_user(data)

@router.get("/{user_id}", response_model=UserResponse, summary="获取用户详情")
async def get_user(
    user_id: int,
    service: UserService = Depends(),
):
    return await service.get_user(user_id)
```

❌ Wrong:

```python
# 缺少路由前缀和标签
router = APIRouter()

@router.get("")  # 无前缀，URL 不明确
async def list_users():
    pass

# 路径参数未做类型约束
@router.get("/{user_id}")
async def get_user(user_id: str):  # 应为 int
    pass
```

**SHOULD** — 路由命名与函数名保持一致，使用名词形式：

```python
# ✅ 正确
@router.get("/users")
async def list_users(): ...

@router.get("/users/{user_id}")
async def get_user(user_id: int): ...

# ❌ 错误
@router.get("/users")
async def getAllUsers(): ...       # 动词开头
@router.get("/users/{user_id}")
async def fetchUser(user_id: int): ...  # 动词开头
```

**MAY** — 对复杂查询参数使用 Pydantic Model 替代多个独立参数：

```python
from pydantic import BaseModel, Field

class UserListParams(BaseModel):
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    keyword: str = Field("", max_length=50)
    status: int | None = None

@router.get("/", response_model=UserListResponse)
async def list_users(params: UserListParams = Query()):
    ...
```

---

### R03 — 请求与响应模型

**MUST** — 使用 Pydantic Model 定义请求体和响应体，禁止使用原生 dict：

✅ Correct:

```python
# app/schemas/user.py
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=64)
    age: int = Field(ge=0, le=200)

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    age: int
    created_at: datetime

    model_config = {"from_attributes": True}

class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    size: int
```

❌ Wrong:

```python
# 使用原生 dict，无验证
@router.post("/users")
async def create_user(body: dict):
    email = body["email"]  # KeyError 风险
    name = body.get("name", "")  # 无长度限制
    ...

# 响应返回裸 dict
@router.get("/users/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id, "email": "test@example.com"}  # 无 schema 约束
```

**MUST** — 请求体使用 `Body` 显式指定，避免位置歧义：

✅ Correct:

```python
from fastapi import Body

@router.post("/users")
async def create_user(
    user: UserCreate = Body(..., description="用户信息"),
):
    ...
```

❌ Wrong:

```python
# 多个参数时，Pydantic Model 可能被误判为查询参数
@router.post("/users")
async def create_user(user: UserCreate, token: str):
    # user 可能被当作 query parameter
    ...
```

**SHOULD** — 使用别名（alias）支持前端 camelCase 字段：

```python
class UserCreate(BaseModel):
    user_name: str = Field(..., alias="userName", min_length=1)
    first_name: str = Field(..., alias="firstName")
    last_name: str = Field(..., alias="lastName")

    model_config = {"populate_by_name": True}
```

**MUST** — 嵌套模型使用 `list[Schema]` / `Nested`，禁止使用 `Any`：

✅ Correct:

```python
class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderResponse(BaseModel):
    id: int
    items: list[OrderItemResponse]
    total_amount: float
```

❌ Wrong:

```python
class OrderResponse(BaseModel):
    items: list[dict]  # 无类型约束
    extra: Any          # 完全无约束
```

---

### R04 — 依赖注入

**MUST** — 可复用依赖通过 `Depends()` 注入，禁止在路由函数内直接实例化：

✅ Correct:

```python
# app/dependencies/db.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.database import engine

async def get_db() -> AsyncSession:
    async with AsyncSession(engine) as session:
        try:
            yield session
        finally:
            await session.close()

# app/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    return await get_user_by_id(user_id)

# app/api/v1/users.py
@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
```

❌ Wrong:

```python
# 在路由函数内直接实例化 — 无法复用、难以测试
@router.get("/me")
async def read_current_user():
    engine = create_engine(DATABASE_URL)  # 每次请求创建引擎
    session = Session(engine)
    user = session.query(User).first()
    return user
```

**MUST** — 数据库会话依赖使用 `yield` 确保资源释放：

✅ Correct:

```python
async def get_db():
    async with AsyncSession(engine) as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

❌ Wrong:

```python
# 未使用 yield，session 不会自动关闭
async def get_db():
    session = AsyncSession(engine)
    return session
```

**SHOULD** — 依赖组合使用嵌套 `Depends`：

```python
async def get_active_user(
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")
    return current_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_active_user),
):
    ...
```

---

### R05 — 中间件与异常处理

**MUST** — 全局异常处理器注册到 FastAPI 应用，统一错误响应格式：

✅ Correct:

```python
# app/common/exceptions.py
from fastapi import Request
from fastapi.responses import JSONResponse

class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code

class NotFoundException(AppException):
    def __init__(self, resource: str, resource_id: int):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} {resource_id} not found",
            status_code=404,
        )

# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.common.exceptions import AppException

app = FastAPI()

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "Internal server error"},
    )
```

❌ Wrong:

```python
# 每个路由手动 try-except
@router.get("/users/{user_id}")
async def get_user(user_id: int):
    try:
        return await get_user_by_id(user_id)
    except ValueError:
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})  # 暴露内部错误
```

**MUST** — CORS 中间件必须显式配置，禁止使用通配符：

✅ Correct:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.example.com",
        "https://admin.example.com",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)
```

❌ Wrong:

```python
# 允许所有来源 — 生产环境存在安全风险
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # 与 * 冲突且不安全
)
```

**SHOULD** — 请求日志中间件记录关键信息：

```python
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        logger.info(
            f"{request.method} {request.url.path} "
            f"→ {response.status_code} ({duration:.3f}s)"
        )
        return response
```

---

### R06 — 数据库集成

**MUST** — 使用 SQLAlchemy 2.0 风格 + 异步引擎，连接池配置合理：

✅ Correct:

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/db"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,           # 连接池大小
    max_overflow=10,        # 溢出连接数
    pool_pre_ping=True,     # 连接健康检查
    pool_recycle=3600,      # 连接回收时间（秒）
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass
```

❌ Wrong:

```python
# 同步引擎用于异步场景 — 阻塞事件循环
from sqlalchemy import create_engine
engine = create_sync_engine(DATABASE_URL)  # 阻塞！

# 无连接池配置 — 高并发下连接耗尽
engine = create_async_engine(DATABASE_URL)  # 默认 pool_size=5
```

**MUST** — ORM 模型使用 SQLAlchemy 2.0 声明式风格：

✅ Correct:

```python
# app/models/user.py
from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import datetime

class User(Base):
    __tablename__ = "usr_user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
```

❌ Wrong:

```python
# 旧式 declarative 风格
class User(Base):
    __tablename__ = "usr_user"
    id = Column(Integer, primary_key=True)
    email = Column(String(255))  # 无类型注解
```

**MUST** — Migration 使用 Alembic，配置异步运行：

✅ Correct:

```ini
# alembic.ini
sqlalchemy.url = postgresql+asyncpg://user:pass@localhost/db

# env.py
from sqlalchemy.ext.asyncio import create_async_engine
target_metadata = Base.metadata

connectable = create_async_engine(config.get_main_option("sqlalchemy.url"))
```

**MUST** — 查询使用 select 语句，禁止 raw SQL：

✅ Correct:

```python
from sqlalchemy import select

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
```

❌ Wrong:

```python
async def get_user_by_id(db: AsyncSession, user_id: int):
    result = await db.execute(text("SELECT * FROM usr_user WHERE id = :id"), {"id": user_id})
    return result.fetchone()
```

---

### R07 — 认证与授权

**MUST** — 认证使用 OAuth2 Password Flow + JWT，Token 存储于 HTTP Only Cookie：

✅ Correct:

```python
# app/core/security.py
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

SECRET_KEY = "${JWT_SECRET_KEY}"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.JWTError:
        return None
```

❌ Wrong:

```python
# MD5 哈希密码 — 已被破解
import hashlib
hashed = hashlib.md5(password.encode()).hexdigest()

# 硬编码密钥
SECRET_KEY = "my-secret-key"  # 必须在环境变量中

# 无限期 Token
ACCESS_TOKEN_EXPIRE_MINUTES = 999999  # 安全风险
```

**MUST** — 登录接口返回 Token 并设置 Cookie：

✅ Correct:

```python
from fastapi import Response
from fastapi.responses import JSONResponse

@router.post("/auth/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    response: Response = Response(),
):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"access_token": token, "token_type": "bearer"}
```

**SHOULD** — 权限控制使用依赖注入装饰器模式：

✅ Correct:

```python
from functools import wraps
from fastapi import Depends, HTTPException

def require_role(role: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user=Depends(get_current_user), **kwargs):
            if current_user.role != role:
                raise HTTPException(status_code=403, detail="Permission denied")
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator

@router.get("/admin/dashboard")
@require_role("admin")
async def admin_dashboard(current_user=Depends(get_current_user)):
    return {"dashboard": "data"}
```

**MUST NOT** — 禁止将 Token 放在 URL 参数或响应体明文中：

❌ Wrong:

```python
# Token 在 URL 中 — 可能被日志记录
@router.get("/users")
async def list_users(token: str): ...

# Token 在响应体中 — XSS 风险
return {"token": token, "user": user}
```

---

### R08 — 异步编程

**MUST** — I/O 密集型操作必须使用 `async/await`，禁止在异步上下文中使用同步阻塞调用：

✅ Correct:

```python
# 异步数据库操作
async def get_user(user_id: int) -> User:
    return await get_user_by_id(user_id)  # async session

# 异步 HTTP 请求
import httpx
async def fetch_external_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()
```

❌ Wrong:

```python
# 同步数据库操作阻塞事件循环
async def get_user(user_id: int) -> User:
    session = Session(bind=sync_engine)  # 同步引擎
    user = session.query(User).filter(User.id == user_id).first()  # 阻塞！
    return user

# requests 库阻塞事件循环
import requests
async def fetch_data(url: str):
    response = requests.get(url)  # 阻塞！
    return response.json()
```

**MUST** — 后台任务使用 `BackgroundTasks`，禁止在路由函数中执行耗时同步操作：

✅ Correct:

```python
from fastapi import BackgroundTasks

async def send_notification(email: str, message: str):
    # 异步发送通知
    await smtp_client.send(email, message)

@router.post("/users", status_code=201)
async def create_user(
    data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    user = await create_user_in_db(db, data)
    background_tasks.add_task(send_notification, user.email, "Welcome!")
    return user
```

❌ Wrong:

```python
# 同步耗时操作阻塞请求
@router.post("/users")
async def create_user(data: UserCreate):
    user = create_user_in_db(data)  # 同步阻塞
    send_email_sync(user.email, "Welcome!")  # 同步邮件发送
    return user
```

**SHOULD** — 并发控制使用 `asyncio.Semaphore`：

```python
import asyncio
from contextlib import asynccontextmanager

MAX_CONCURRENT_REQUESTS = 10
semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

async def fetch_with_limit(url: str) -> dict:
    async with semaphore:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            return response.json()
```

**MUST** — CPU 密集型操作必须使用 `run_in_executor` 或进程池：

✅ Correct:

```python
import asyncio
from functools import partial

def heavy_computation(n: int) -> int:
    # CPU 密集型计算
    return sum(i * i for i in range(n))

@router.post("/compute")
async def compute(n: int):
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, partial(heavy_computation, n))
    return {"result": result}
```

❌ Wrong:

```python
# CPU 密集型操作直接在异步函数中执行 — 阻塞事件循环
@router.post("/compute")
async def compute(n: int):
    result = sum(i * i for i in range(n))  # 阻塞事件循环
    return {"result": result}
```

---

### R09 — 测试

**MUST** — 使用 `TestClient`（基于 httpx）进行集成测试，异步测试使用 `pytest-asyncio`：

✅ Correct:

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///file:test?mode=memory&cache=shared"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session")
def setup_database():
    async def init_db():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(init_db())
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
def client(setup_database):
    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

❌ Wrong:

```python
# 直接导入 app 但不覆盖依赖
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)
# 测试使用了真实数据库连接 — 不稳定且有副作用
```

**MUST** — 异步测试使用 `pytest-asyncio` 的 `@pytest.mark.asyncio`：

✅ Correct:

```python
import pytest

@pytest.mark.asyncio
async def test_create_user(client):
    response = client.post(
        "/api/v1/users",
        json={"email": "test@example.com", "name": "Test User", "age": 25},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
```

**SHOULD** — 数据库测试使用内存 SQLite，每个测试事务回滚：

```python
@pytest.fixture
async def db_session():
    async with TestSessionLocal() as session:
        async with session.begin():
            yield session
        await session.rollback()
```

**SHOULD** — Mock 策略使用 `unittest.mock.AsyncMock` 模拟外部依赖：

✅ Correct:

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_user_with_mocked_external_service():
    mock_response = {"data": "mocked"}
    with patch("app.services.user_service.fetch_external", new_callable=AsyncMock, return_value=mock_response):
        response = client.post("/api/v1/users", json={"email": "test@example.com", "name": "Test"})
        assert response.status_code == 201
```

**MUST** — 测试文件组织结构：

```
tests/
├── conftest.py           # 共享 fixtures
├── unit/                 # 单元测试
│   ├── test_user_service.py
│   └── test_order_service.py
├── integration/          # 集成测试
│   ├── test_user_api.py
│   └── test_order_api.py
└── fixtures/             # 测试数据
    └── users.json
```

---

### R10 — 部署

**MUST** — 生产环境使用 Uvicorn + Gunicorn 多 worker 部署：

✅ Correct:

```bash
# Gunicorn 启动命令
gunicorn app.main:app \
    -w 4 \                    # worker 数量（建议 CPU 核数 × 2 + 1）
    -k uvicorn.workers.UvicornWorker \
    --worker-class uvicorn.workers.UvicornWorker \
    --worker-connections 1000 \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 10000 \
    --max-requests-jitter 1000 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
```

❌ Wrong:

```bash
# 仅使用 Uvicorn 单进程 — 无法充分利用多核
uvicorn app.main:app --host 0.0.0.0 --port 8000

# worker 数量过多 — 内存浪费
gunicorn app.main:app -w 32 -k uvicorn.workers.UvicornWorker
```

**MUST** — Docker 部署配置合理的健康检查和资源限制：

✅ Correct:

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", \
     "--worker-connections", "1000", "--timeout", "120", "--bind", "0.0.0.0:8000"]
```

**MUST** — 提供健康检查端点：

✅ Correct:

```python
from fastapi import FastAPI
from datetime import datetime, timezone

@app.get("/health")
async def health_check():
    return {
        "status": "UP",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }

@app.get("/ready")
async def readiness_check():
    # 检查数据库连接等依赖
    try:
        # 简单的数据库连通性检查
        return {"status": "READY"}
    except Exception:
        raise HTTPException(status_code=503, detail="Service Unavailable")
```

**SHOULD** — 性能调优关键参数：

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `--worker-connections` | 1000 | 每个 worker 最大连接数 |
| `--timeout` | 120 | 请求超时时间（秒） |
| `--keep-alive` | 5 | Keep-Alive 超时（秒） |
| `--max-requests` | 10000 | 单个 worker 最大请求数后重启 |
| `--max-requests-jitter` | 1000 | 防止所有 worker 同时重启 |
| `pool_size` | 20 | 数据库连接池大小 |
| `max_overflow` | 10 | 连接池溢出上限 |

**MUST** — 环境变量管理，禁止硬编码配置：

✅ Correct:

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: list[str] = []
    DEBUG: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()
```

❌ Wrong:

```python
# 硬编码配置
DATABASE_URL = "postgresql://user:pass@localhost/db"
JWT_SECRET_KEY = "hardcoded-secret"
```

---

## Checklist

- [ ] 项目采用分层架构（api / services / repositories / models / schemas）
- [ ] 路由使用 APIRouter 拆分，统一前缀和标签
- [ ] 请求体和响应体使用 Pydantic Model，禁止裸 dict
- [ ] 可复用逻辑通过 Depends 注入，禁止函数内直接实例化
- [ ] 数据库会话使用 yield 确保资源释放
- [ ] 全局异常处理器统一错误响应格式
- [ ] CORS 配置显式指定 origins，禁止通配符
- [ ] 使用 SQLAlchemy 2.0 异步引擎 + 连接池配置
- [ ] Migration 使用 Alembic，配置异步运行
- [ ] 认证使用 OAuth2 + JWT，Token 存于 HTTP Only Cookie
- [ ] I/O 操作使用 async/await，禁止同步阻塞调用
- [ ] CPU 密集型操作使用 run_in_executor
- [ ] 测试使用 TestClient + 依赖覆盖 + 内存数据库
- [ ] 生产部署使用 Gunicorn + Uvicorn 多 worker
- [ ] Docker 配置健康检查和资源限制
- [ ] 配置通过环境变量管理，禁止硬编码