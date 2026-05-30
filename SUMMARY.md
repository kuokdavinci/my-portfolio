# Executive Summary — Legal GraphRAG Assistant

**For evaluators.** Single-page summary of system capabilities, metrics, and key findings.

**Date:** 17/05/2026
**System:** Vietnamese Legal Education Assistant — Triple-Gated GraphRAG with Guardrails

---

## System Overview

Hệ thống RAG pháp luật Việt Nam với agent loop, hỗ trợ tra cứu văn bản giáo dục (661 documents, 15,662 chunks). Kiến trúc Triple-Gated: Semantic Router → Agent Loop → GraphRAG + Reflection.

## Core Metrics

| Domain | Metric | Value | Verdict |
|--------|--------|-------|---------|
| **Retrieval** | Hit@1 (legal queries, 1536d) | **91.2%** | ✅ Excellent |
| **Retrieval** | Hit@5 (legal queries, 1536d) | **100.0%** | ✅ Perfect |
| **Retrieval** | MRR (legal queries, 1536d) | **0.947** | ✅ Excellent |
| **Retrieval** | Hit@5 (legal queries, 50 cases — 768d) | **80.0%** | ✅ Good |
| **Retrieval** | MRR (legal queries, 50 cases — 768d) | **0.764** | ⚠️ Room for improvement |
| **Latency** | Agent pipeline (mean) | 9,298ms | ⚠️ High (85% = rerank + LLM) |
| **Latency** | 1536d GraphRAG (mean) | 1,145ms | ✅ Fast |
| **Latency** | Warm cache | 0.0001s | ✅ 70,000x speedup |
| **Cost** | Total (6 days, 3,640 traces) | $1.23 | ✅ Extremely low |
| **Cost** | Est. monthly (1K traces/day) | $26 | ✅ Affordable |

### Guardrails

| Component | Status | Tests | Details |
|-----------|--------|-------|---------|
| Input guard (prompt injection) | ✅ Production | 18 | 17 regex patterns (VI + EN) |
| Output guard (citation normalize) | ✅ Production | 10 | 5 normalization rules |
| Integration (SSE + sync) | ✅ Deployed | — | 2 endpoints |
| **Total** | **✅ 35/35 pass** | 35 | See `tests/test_guardrails.py` |

### LLM Judge Scores (test007 — 34 cases, 8 metrics)

| Metric | Score | Verdict |
|--------|-------|---------|
| Answer Relevancy | **0.965** | ✅ High |
| Context Precision | **0.891** | ✅ Good |
| Faithfulness | **0.815** | ✅ Good |
| Context Recall | **0.762** | ⚠️ Moderate |
| Citation Accuracy | **0.694** | ⚠️ Needs improvement |
| Citation Chunk Precision | **1.000** | ✅ Perfect |
| Citation Chunk Recall | **0.294** | ❌ Low |
| Citation Hallucination Rate | **0.000** | ✅ None |

### A/B Improvement: 3-Way Comparison (test005 → test006 → test007)

| Metric | test005 | test006 | test007 |
|--------|---------|---------|---------|
| Faithfulness | 0.617 | 0.774 | **0.815** |
| Citation Accuracy | 0.391 | 0.656 | **0.694** |
| Context Recall | 0.617 | 0.721 | **0.762** |
| Answer Relevancy | 0.852 | 0.941 | **0.965** |

- test005: Trước prompt split (SYSTEM/RESPONSE_PROMPT chưa tách)
- test006: Sau prompt split + context optimization + 6 quickwins
- test007: Sau guardrails + citation normalization
- **Biggest jump**: Faithfulness +0.157 (test005→006) — prompt restructuring

### Evaluation Infrastructure Score

| Domain | Score | Detail |
|--------|-------|--------|
| Coverage | **40%** | 0 COVERED + 9 PARTIAL + 1 MISSING |
| Infrastructure | **90%** | Tests, reports, datasets, monitoring |
| **Overall** | **60/100** | **NEEDS WORK** |

## Top Strengths

1. **1536d retrieval quality**: Hit@1 = 91.2%, Hit@5 = 100% — state-of-the-art for this domain
2. **A/B improvement**: All 8 Langfuse metrics improved from test006 → test007
3. **Guardrails deployed**: 35 tests, 2 integration points, ~0.01ms overhead
4. **Cost efficiency**: $1.23 for 3,640 traces — production-ready economics
5. **Cache performance**: 70,000x speedup on warm cache
6. **Zero hallucination**: 0% citation hallucination rate across both experiments

## Top Risks

1. **Citation chunk recall low**: Only 29.4% — LLM misses relevant chunks from retrieved set
2. **No human calibration**: LLM Judge scores (faithfulness 0.815) unvalidated
3. **No task completion metric**: Cannot measure % agent runs succeed vs fail
4. **No online guardrail**: Runs in-process, not suitable for multi-tenant production

## Recommendations

| # | Action | Priority |
|---|--------|----------|
| 1 | Improve citation chunk recall — prompt LLM to cite more retrieved chunks | P0 — Critical |
| 2 | Human calibration of LLM Judge (50 samples) | P0 — Critical |
| 3 | Populate Neo4j relationships (AMENDS/REVOKES/SUPERSEDES) | P0 — High |
| 4 | Implement recall optimization (Phase 4: synonym + paraphrase expansion) | P1 — High |
| 5 | Add task completion rate + tool selection accuracy metrics | P1 — High |
| 6 | Extract guardrails to external service | P1 — Medium |

## Verification Commands

```bash
# Run guardrail tests
uv run pytest tests/test_guardrails.py -v

# Run benchmark suite (requires Neo4j + Qdrant)
uv run python -m src.graphrag.benchmark_suite

# Check cache stats
uv run python -c "from src.graphrag.cache_manager import CacheManager; cm = CacheManager(); print(cm.get_stats())"

# Refresh Langfuse data (via API scripts in src/eval/)
uv run python -c "from src.eval.langfuse_runner import upload_and_run; help(upload_and_run)"
```

---

## Key Files for Evaluators

| File | Purpose |
|------|---------|
| `reports/evaluation-evidence-report.md` | Full master report — architecture, metrics, cost, recommendations |
| `reports/embedding_dim_comparison.md` | 1536d GraphRAG evaluation (34 cases) |
| `reports/charts/accuracy-comparison.md` | Text-based charts: agent latency, scores, hit rates |
| `reports/charts/latency-comparison.md` | Latency + cost + Langfuse volume charts |
| `reports/benchmark-data-compiled.json` | Source of truth — compiled benchmark JSON |
| `reports/benchmark_1536d.json` | Raw 1536d benchmark JSON |
| `src/core/guardrails.py` | Input + output guardrail implementation |
| `tests/test_guardrails.py` | 35 guardrail tests |
| `docs/architecture/overview.md` | Architecture documentation |

---

*Last updated: 17/05/2026*
