# Contributing to AI Engineering Standards

Thank you for your interest in contributing!

---

## How to Contribute

### 1. Propose a Change

- Open an Issue describing the change
- Wait for discussion and approval before writing content

### 2. Write Content

Follow the standard document format:

```markdown
# Title

## Overview
Brief description.

## Rules

### R01 — Rule Title
**MUST / SHOULD / MAY** — Description.

✅ Correct:
```language
example
```

❌ Wrong:
```language
anti-pattern
```

## Checklist
- [ ] Item
```

### 3. Submit a PR

- One topic per PR
- PR title follows [Conventional Commits](https://www.conventionalcommits.org/):
  - `docs: add Redis caching rules`
  - `fix: correct API versioning example`
  - `feat: add Python/FastAPI chapter`
- Fill in the [PR template](templates/pr-template.md)

---

## Writing Guidelines

- Use **MUST / MUST NOT / SHOULD / SHOULD NOT / MAY** for rule severity
- Every rule MUST have at least one ✅ example and one ❌ anti-pattern
- Code examples MUST be runnable (no pseudocode, no `TODO`, no `...`)
- Keep rules language-agnostic unless the chapter is language-specific
- Add new rules as `R##` with sequential numbering within each document
- Update the chapter README index when adding a new document

---

## Review Criteria

- [ ] Follows document format
- [ ] Rules have clear severity levels
- [ ] Examples are correct and runnable
- [ ] Anti-patterns are realistic
- [ ] Checklist is complete
- [ ] No sensitive information
- [ ] No duplicated content with existing documents
