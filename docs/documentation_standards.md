# Documentation Standards

<!-- SCOPE: Rules for writing and maintaining project documentation. -->

## Core Rules

| Rule | Description |
|------|-------------|
| **NO_CODE** | Documents describe contracts and intent, not implementation. No code blocks over 5 lines. |
| **Single Source of Truth** | Each fact lives in exactly one document. Others link to it. |
| **Tables over prose** | Use tables for parameters, configs, comparisons. Lists for enumerations. Prose only when necessary. |
| **SCOPE tags** | Every file starts with a SCOPE comment defining what belongs in it. |
| **Maintenance section** | Every file ends with "Update when" and "Verify" instructions. |

## Document Ownership

| Document | Owner (update when...) |
|----------|------------------------|
| requirements.md | Adding/changing features |
| architecture.md | Adding components, changing data flow |
| tech_stack.md | Adding/upgrading packages, new env vars |
| api_spec.md | Adding/changing routes |
| database_schema.md | Schema migrations |
| design_guidelines.md | New component patterns, theme changes |
| runbook.md | Setup steps change, new tooling |
| principles.md | Code conventions evolve |
| kanban_board.md | New Epics/Stories created, issues closed |

## Accuracy Standard

Documentation must match code. If you change a file path, route, or config value in the codebase, update the relevant doc in the same commit.

**Verify command (quick check):**
- Route paths in api_spec.md → match `apps/api/src/routers/`
- Table names in database_schema.md → match `apps/api/src/db/schema.ts`
- Package versions in tech_stack.md → match `apps/*/package.json`
- Ports in runbook.md → match `docker-compose.yml` and `Tiltfile`

## Writing Style

- **Imperative headings**: "Add a new route" not "Adding a new route"
- **Present tense**: "The API returns..." not "The API will return..."
- **No filler**: Skip "This document describes...", go straight to content
- **No emojis** unless explicitly needed
- **Kebab-case filenames**: `api_spec.md`, `tech_stack.md`

## What Does NOT Belong in Docs

- Implementation code (belongs in source files with comments)
- Step-by-step tutorials (belongs in runbook.md or a guide in docs/reference/guides/)
- Temporary notes or in-progress ideas (use Linear issues instead)
- Duplicate information (link to the canonical source instead)
