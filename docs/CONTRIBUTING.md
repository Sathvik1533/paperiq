# Contributing to PaperIQ

## Prime Directive

> Every feature must answer: *"Will this help a student score better marks with less effort?"*

If the answer is not clearly yes, don't build it.

## Commit Convention

```
feat: add X
fix: resolve Y in Z
refactor: simplify W
docs: update setup guide
chore: upgrade dependencies
test: add scraper unit tests
```

## Branch Strategy

```
main        — stable, always deployable
feat/m1-*   — milestone 1 features
feat/m2-*   — milestone 2 features
fix/*       — bug fixes
```

## Adding a New College Adapter

1. `backend/app/scrapers/colleges/your_college.py`
2. Extend `PlaywrightScraper` (or `RequestsScraper`)
3. Implement `list_papers()` and `download()`
4. Register in `ScraperFactory`
5. Add to `supabase/seed.sql`
6. Write tests

## Adding a New LLM Provider

1. `backend/app/llm/your_provider.py`
2. Extend `LLMProvider` ABC
3. Define `tier_models` dict
4. Register in `provider_factory.py`
5. Add env vars to `.env.example`

## Evidence Rule

No insight without evidence. If `evidence[]` is empty, do not return the insight.

## Code Quality

```bash
ruff format backend/
ruff check backend/
pytest backend/tests/
```
