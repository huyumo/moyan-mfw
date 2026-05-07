# moyan-shared-dict Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `moyan-shared-dict` framework package + `business-dict` private package, then migrate existing inline dict definitions and unify dictionary rendering across the project.

**Architecture:** A `moyan-shared-dict` package (in `packages/shared-dict/`) provides the decorator/tool/core infrastructure and built-in generic dicts (`StatusDict`, `BoolDict`). A private `business-dict` package (at repo root level) holds project-specific business dicts. Both use `@DictMeta` class decorator + `@DictEntry` property decorator. A global singleton `Map` in `registry.ts` auto-collects all registered dicts. Backend seeder syncs all dicts to `sys_dict_types` / `sys_dict_items` tables via `getAllDicts()`.

**Tech Stack:** TypeScript, `reflect-metadata`, Vue 3 + Element Plus (frontend), NestJS + TypeORM (backend)

**Spec:** `docs/superpowers/specs/2026-05-07-shared-dict-design.md`

---

### Task 1: Create `packages/shared-dict/` directory structure

**Files:**
- Create: `packages/shared-dict/package.json`
- Create: `packages/shared-dict/tsconfig.json`
- Create: `packages/shared-dict/src/core/types.ts`
- Create: `packages/shared-dict/src/core/decorator.ts`
- Create: `packages/shared-dict/src/core/registry.ts`
- Create: `packages/shared-dict/src/core/helper.ts`
- Create: `packages/shared-dict/src/core/index.ts`
- Create: `packages/shared-dict/src/base/status.ts`
- Create: `packages/shared-dict/src/base/index.ts`
- Create: `packages/shared-dict/src/index.ts`

- [ ] **Step 1: Create `packages/shared-dict/package.json`**

```json
{
  "name": "moyan-shared-dict",
  "version": "0.1.0",
  "description": "Shared dictionary definitions for moyan frontend and backend",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "reflect-metadata": "^0.2.2"
  },
  "peerDependencies": {},
  "devDependencies": {
    "typescript": "^5.1.3"
  }
}
```

- [ ] **Step 2: Create `packages/shared