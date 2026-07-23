# RAG Engineering Standards

## Overview

本文档定义了项目中检索增强生成（Retrieval-Augmented Generation，RAG）系统的工程规范，涵盖架构设计、分块策略、向量数据库、检索优化等核心实践。

---

## Rules

### R01 — RAG 架构设计

RAG 系统必须采用 Retriever + Generator 的清晰分离架构。

- **MUST** Retriever（检索器）与 Generator（生成器）解耦，各自独立可测试
- **SHOULD** 使用 LangChain / LlamaIndex 等框架实现模块化编排，避免硬编码流程
- **MAY** 支持多路召回（Multi-Query Retrieval）提升召回率

✅ 示例：
```python
from langchain.retrievers import MultiQueryRetriever
from langchain.chat_models import ChatOpenAI

retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=ChatOpenAI()
)

chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(),
    chain_type="stuff",
    retriever=retriever
)
```

❌ 反例：将检索和生成逻辑写在一个函数中，无法单独测试。

---

### R02 — 文档分块策略

文档分块质量直接影响检索效果，必须根据文档类型选择合适的分块策略。

- **MUST** 分块大小控制在 256-1024 tokens，重叠窗口 50-200 tokens
- **SHOULD** 结构化文档（PDF、Markdown）按标题/段落语义分块，非结构化文本按滑动窗口分块
- **MAY** 使用语义分块（Semantic Chunking）基于句子相似度动态切分

✅ 示例：
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=100,
    separators=["\n## ", "\n### ", "\n", ". ", " "]
)
chunks = text_splitter.split_documents(documents)
```

❌ 反例：所有文档统一按 500 字符硬切，不考虑语义完整性。

---

### R03 — Embedding 模型选择

Embedding 模型的选择需平衡效果、成本和语言支持。

- **MUST** 中文场景优先使用 `bge-large-zh` / `bge-m3`；英文场景使用 `text-embedding-3-large`
- **SHOULD** 评估候选模型在领域数据集上的 Recall@K 指标，选择最优者
- **MAY** 对多语言场景使用 `bge-m3` 或 `gte-multilingual`

✅ 示例：
```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('BAAI/bge-large-zh')
embeddings = model.encode(["如何重置密码？"])
```

❌ 反例：直接使用通用英文 Embedding 模型处理中文文档。

---

### R04 — 向量数据库选型

向量数据库选型需考虑规模、延迟、运维复杂度等因素。

- **MUST** 百万级以下数据量使用 Milvus / Qdrant；千万级以上使用专用分布式方案
- **SHOULD** 生产环境必须支持增量更新、持久化备份、高可用部署
- **MAY** 小规模实验阶段使用 ChromaDB / FAISS 快速验证

✅ 对比表：
| 数据库 | 适用规模 | 优势 | 劣势 |
|--------|----------|------|------|
| Qdrant | <1000万 | Rust 高性能、易部署 | 生态较小 |
| Milvus | >1000万 | 分布式、功能全 | 运维复杂 |
| ChromaDB | <100万 | Python 原生、零配置 | 不适合生产 |

❌ 反例：百万级数据使用 PostgreSQL pgvector 而不做性能压测。

---

### R05 — 检索优化

单一向量检索往往不够精确，需要结合多种技术提升检索质量。

- **MUST** 实施混合检索（Hybrid Search）：向量检索 + BM25 关键词检索加权融合
- **SHOULD** 对 Top-K 结果使用 Reranker（如 bge-reranker）重排序
- **MAY** 使用 ColBERT 等细粒度交互式检索提升精度

✅ 示例：
```python
from rank_bm25 import BM25Okapi

# BM25 关键词检索
bm25 = BM25Okapi(tokenized_corpus)
bm25_scores = bm25.get_scores(tokenized_query)

# 向量检索
vector_scores = vectorstore.similarity_search(query, k=20)

# 融合 + Rerank
hybrid_results = fuse_scores(bm25_scores, vector_scores)
reranked = reranker.rerank(query, hybrid_results, top_k=5)
```

❌ 反例：仅使用向量相似度检索，不处理同义词和专业术语。

---

### R06 — 上下文窗口管理

LLM 上下文窗口有限，必须合理管理注入的上下文内容。

- **MUST** 检索到的文档片段总长度不超过模型上下文窗口的 80%
- **SHOULD** 按相关性排序后截取 Top-K 片段，而非全量拼接
- **MAY** 使用 Map-Reduce 或 Refine 模式处理超长上下文

✅ 示例：
```python
MAX_CONTEXT_TOKENS = 32000  # 80% of 40960 context window

def select_context(retrieved_docs, query):
    reranked = reranker.rerank(query, retrieved_docs, top_k=5)
    total_tokens = sum(len(doc.page_content) for doc in reranked)
    if total_tokens > MAX_CONTEXT_TOKENS:
        # 按比例缩减
        ratio = MAX_CONTEXT_TOKENS / total_tokens
        reranked = reranked[:int(5 * ratio)]
    return reranked
```

❌ 反例：将所有检索结果拼接后直接送入 LLM，超出上下文限制。

---

### R07 — RAG 评估

RAG 系统需要分别评估检索质量和生成质量。

- **MUST** 检索质量评估：Recall@K、MRR、NDCG
- **SHOULD** 生成质量评估：答案忠实度（Faithfulness）、答案相关性（Answer Relevancy）
- **MAY** 使用 RAGAS 框架自动化评估端到端 RAG 流水线

✅ 示例：
```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

results = evaluate(
    dataset=eval_dataset,
    llm=generator,
    metrics=[faithfulness, answer_relevancy]
)
print(f"Faithfulness: {results['faithfulness']}")
print(f"Answer Relevancy: {results['answer_relevancy']}")
```

❌ 反例：仅人工抽查几组问答就认为 RAG 系统达标。

---

### R08 — 生产环境 RAG

生产环境的 RAG 系统需要考虑缓存、延迟和稳定性。

- **MUST** 相同查询的结果缓存至少 5 分钟，减少重复计算
- **SHOULD** 检索 P99 延迟 < 200ms，端到端响应时间 < 3s
- **MAY** 使用异步流式输出（Streaming）改善用户体验

✅ 示例：
```python
from functools import lru_cache
import asyncio

@lru_cache(maxsize=1000)
def cached_retrieve(query: str, top_k: int = 5):
    return retriever.invoke(query)

async def rag_response(query: str):
    context = await asyncio.to_thread(cached_retrieve, query)
    answer = await generator.agenerate(query, context)
    return answer
```

❌ 反例：每次请求都重新执行完整的检索和生成链路。

---

## Checklist

- [ ] Retriever 与 Generator 解耦，可独立测试
- [ ] 文档分块大小 256-1024 tokens，有重叠窗口
- [ ] 根据语言场景选择合适 Embedding 模型
- [ ] 向量数据库选型经过规模评估和压测
- [ ] 实施混合检索 + Reranker 提升精度
- [ ] 上下文总长度不超过窗口 80%
- [ ] 检索和生成质量均有量化评估指标
- [ ] 生产环境配置缓存，P99 延迟达标
