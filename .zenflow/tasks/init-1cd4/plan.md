# OpenFlow Implementation Plan

> AI Task Orchestration App - Tauri + Rust + React/TypeScript

## Reference Documents
- **Requirements**: `.zenflow/tasks/init-1cd4/requirements.md`
- **Technical Spec**: `.zenflow/tasks/init-1cd4/spec.md`
- **Project Guidelines**: `CLAUDE.md` (created in Step 0.1)

---

## Agent Instructions

**IMPORTANT: Every agent MUST follow these rules:**

1. **Read CLAUDE.md first** - Before any work, read `/CLAUDE.md` for project conventions
2. **Mark step complete** - After finishing, edit this file to change `[ ]` to `[x]` for your step
3. **Run verification** - Execute all verification commands listed in your step
4. **Update plan if needed** - If you discover missing steps or issues, add them to this plan
5. **Follow TDD** - Write tests BEFORE implementation when specified
6. **Single Responsibility** - Each step should do ONE thing well
7. **DRY Principle** - Never duplicate code; create shared utilities
8. **Commit after each step** - Make atomic commits with clear messages

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 02b58aa2-9d97-4608-8118-5da0ea097de3 -->
PRD completed in `requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 6bc34eb7-80d8-4863-9cd1-a220ea507d4e -->
Technical spec completed in `spec.md`.

### [x] Step: Planning
<!-- chat-id: 7fcee9e2-087b-4816-91ba-a48b764b4772 -->
Implementation plan created with micro-steps for AI agent execution.

---

## Phase 0: Project Bootstrap

**Goal:** Establish project foundation and agent guidelines.

### [ ] Step: Create CLAUDE.md

Create the project's CLAUDE.md file that all agents will reference.

**Context:**
This is the FIRST file created. It defines all conventions, patterns, and rules for the project. Every subsequent step references this file.

**Tasks:**
1. Create `CLAUDE.md` at project root with:
   - Project overview and architecture summary
   - Technology stack with exact versions
   - Code style and conventions (Rust and TypeScript)
   - File naming conventions
   - Import ordering rules
   - Testing requirements (TDD approach)
   - Commit message format
   - Error handling patterns
   - Common commands reference

**File to create:**
```
CLAUDE.md
```

**Template content requirements:**
- Must include the dependency hierarchy from spec.md section 2.3
- Must include verification commands
- Must reference this plan.md for workflow
- Must specify that UI components are stateless (no hooks)
- Must specify Rust service pattern from spec.md section 8.4

**Verification:**
```bash
cat CLAUDE.md | head -100  # Verify file exists and has content
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add CLAUDE.md && git commit -m "docs: add CLAUDE.md project guidelines"`

---

### [ ] Step: Create .gitignore

Create comprehensive .gitignore for Tauri + pnpm + Rust project.

**Context:**
Must be created BEFORE any npm install or cargo build to prevent committing generated files.

**Tasks:**
1. Create `.gitignore` with sections for:
   - Node.js (node_modules, .pnpm-store)
   - Build outputs (dist, build, .cache)
   - Rust/Cargo (target/, Cargo.lock in src-tauri)
   - Generated files (packages/generated/types.ts, routeTree.gen.ts)
   - Environment files (.env, .env.local)
   - IDE files (.idea, .vscode, *.swp)
   - OS files (.DS_Store, Thumbs.db)
   - Test coverage (coverage/)
   - SQLite databases (*.db, *.db-journal)
   - Storybook (storybook-static/)

**File to create:**
```
.gitignore
```

**Verification:**
```bash
cat .gitignore | wc -l  # Should have 30+ lines
grep "node_modules" .gitignore  # Must exist
grep "target" .gitignore  # Must exist
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add .gitignore && git commit -m "chore: add .gitignore"`

---

### [ ] Step: Create package.json

Create root package.json with workspace configuration.

**Context:**
This is the pnpm workspace root. All dependencies listed here are shared. Individual packages have their own package.json.

**Tasks:**
1. Create `package.json` with:
   - name: "openflow"
   - version: "0.1.0"
   - private: true
   - type: "module"
   - All scripts from spec section 7.1 and 7.2
   - Dependencies (exact versions from spec 1.1):
     - @tauri-apps/api: ^2.1.1
     - @tauri-apps/plugin-shell: ^2.0.1
     - @tanstack/react-query: ^5.62.0
     - @tanstack/react-router: ^1.93.0
     - react: ^18.3.1
     - react-dom: ^18.3.1
     - clsx: ^2.1.1
     - tailwind-merge: ^2.6.0
     - lucide-react: ^0.468.0
     - zod: ^3.24.1
   - DevDependencies:
     - @biomejs/biome: ^1.9.4
     - @tauri-apps/cli: ^2.1.0
     - @tanstack/router-plugin: ^1.93.0
     - @types/react: ^18.3.12
     - @types/react-dom: ^18.3.1
     - @vitejs/plugin-react: ^4.3.4
     - typescript: ^5.7.2
     - vite: ^6.0.3
     - vitest: ^2.1.8
     - autoprefixer: ^10.4.20
     - postcss: ^8.4.49
     - tailwindcss: ^3.4.16
     - husky: ^9.1.7
     - lint-staged: ^15.2.10
     - tsx: ^4.19.2
     - glob: ^11.0.0
   - lint-staged config (from spec 7.1)

**File to create:**
```
package.json
```

**Verification:**
```bash
cat package.json | grep '"name"'  # Should show "openflow"
cat package.json | grep '"type"'  # Should show "module"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add package.json && git commit -m "chore: add package.json"`

---

### [ ] Step: Create pnpm-workspace.yaml

Create pnpm workspace configuration.

**Tasks:**
1. Create `pnpm-workspace.yaml` with packages glob

**File to create:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

**Verification:**
```bash
cat pnpm-workspace.yaml
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add pnpm-workspace.yaml && git commit -m "chore: add pnpm workspace config"`

---

### [ ] Step: Create tsconfig.json

Create TypeScript configuration with strict mode and path aliases.

**Context:**
Uses path aliases matching the pnpm workspace packages. Strict mode is required.

**Tasks:**
1. Create `tsconfig.json` with:
   - target: ES2022
   - lib: ["ES2022", "DOM", "DOM.Iterable"]
   - module: ESNext
   - moduleResolution: bundler
   - strict: true
   - noUnusedLocals: true
   - noUnusedParameters: true
   - noFallthroughCasesInSwitch: true
   - Path aliases for all @openflow/* packages
   - include: ["src", "packages"]
   - exclude: ["node_modules", "dist"]

**File to create:**
```
tsconfig.json
```

**Verification:**
```bash
cat tsconfig.json | grep '"strict"'  # Must be true
cat tsconfig.json | grep '@openflow'  # Must have path aliases
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add tsconfig.json && git commit -m "chore: add tsconfig.json with strict mode"`

---

### [ ] Step: Create biome.json

Create Biome configuration for linting and formatting.

**Context:**
Biome replaces ESLint + Prettier. Configuration from spec section 10.1.

**Tasks:**
1. Create `biome.json` with:
   - Schema reference
   - organizeImports enabled
   - linter with recommended rules
   - formatter with 2-space indent
   - javascript formatter: single quotes, trailing commas es5

**File to create:**
```
biome.json
```

**Verification:**
```bash
cat biome.json | grep '"enabled": true'
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add biome.json && git commit -m "chore: add biome.json linter config"`

---

### [ ] Step: Create vite.config.ts

Create Vite configuration for Tauri development.

**Context:**
Must include TanStack Router plugin and path aliases matching tsconfig.

**Tasks:**
1. Create `vite.config.ts` with:
   - TanStackRouterVite plugin
   - React plugin
   - Path aliases for @openflow/* packages
   - Tauri-specific settings (clearScreen: false, port: 5173)
   - Watch ignore for src-tauri

**File to create:**
```
vite.config.ts
```

**Verification:**
```bash
cat vite.config.ts | grep "TanStackRouterVite"
cat vite.config.ts | grep "@openflow"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add vite.config.ts && git commit -m "chore: add vite config for Tauri"`

---

### [ ] Step: Create index.html

Create HTML entry point for Vite/React.

**Tasks:**
1. Create `index.html` with:
   - DOCTYPE html
   - lang="en"
   - Meta charset UTF-8
   - Meta viewport
   - Title: OpenFlow
   - div#root
   - Script module pointing to /src/main.tsx

**File to create:**
```
index.html
```

**Verification:**
```bash
cat index.html | grep 'id="root"'
cat index.html | grep 'src/main.tsx'
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add index.html && git commit -m "chore: add index.html entry point"`

---

### [ ] Step: Create src/main.tsx

Create React application entry point with minimal App component.

**Tasks:**
1. Create `src/main.tsx` with:
   - React 18 createRoot
   - StrictMode wrapper
   - Simple App component (placeholder)
   - Import for globals.css (will be created later)

2. Create `src/vite-env.d.ts` with Vite types reference

**Files to create:**
```
src/main.tsx
src/vite-env.d.ts
```

**Verification:**
```bash
cat src/main.tsx | grep "createRoot"
cat src/main.tsx | grep "StrictMode"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/ && git commit -m "feat: add React entry point"`

---

### [ ] Step: Create Tailwind Configuration

Create Tailwind CSS configuration with dark mode.

**Tasks:**
1. Create `tailwind.config.js` with:
   - content paths for src and packages
   - darkMode: 'class'
   - Default theme extensions

2. Create `postcss.config.js` with tailwindcss and autoprefixer

3. Create `src/styles/globals.css` with:
   - @tailwind base/components/utilities
   - CSS variables for theming
   - Base styles

**Files to create:**
```
tailwind.config.js
postcss.config.js
src/styles/globals.css
```

**Verification:**
```bash
cat tailwind.config.js | grep "darkMode"
cat src/styles/globals.css | grep "@tailwind"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add tailwind.config.js postcss.config.js src/styles/ && git commit -m "feat: add Tailwind CSS configuration"`

---

## Phase 1: Tauri Backend Foundation

**Goal:** Set up Rust backend with Tauri 2.x.

### [ ] Step: Create Cargo.toml

Create Rust project configuration for Tauri backend.

**Context:**
This defines the Rust crate. Versions must match spec section 1.1.

**Tasks:**
1. Create `src-tauri/Cargo.toml` with:
   - Package: name="openflow", version="0.1.0", edition="2021"
   - lib section with crate-type: ["lib", "cdylib", "staticlib"]
   - build-dependencies: tauri-build 2.x
   - dependencies:
     - tauri 2.x with no default features
     - tauri-plugin-shell 2.x
     - serde 1.x with derive feature
     - serde_json 1.x
     - typeshare 1.x
     - sqlx 0.8.x with runtime-tokio and sqlite features
     - tokio 1.x with full features
     - uuid 1.x with v4 and serde features
     - chrono 0.4.x with serde feature
     - thiserror 2.x
   - features: custom-protocol
   - release profile optimizations

**File to create:**
```
src-tauri/Cargo.toml
```

**Verification:**
```bash
cat src-tauri/Cargo.toml | grep 'name = "openflow"'
cat src-tauri/Cargo.toml | grep "tauri"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/Cargo.toml && git commit -m "chore: add Cargo.toml for Tauri backend"`

---

### [ ] Step: Create tauri.conf.json

Create Tauri application configuration.

**Context:**
Configuration from spec section 10.3.

**Tasks:**
1. Create `src-tauri/tauri.conf.json` with:
   - $schema for Tauri 2
   - productName: "OpenFlow"
   - version: "0.1.0"
   - identifier: "com.openflow.app"
   - build commands (pnpm dev:frontend, pnpm build:frontend)
   - devUrl: http://localhost:5173
   - frontendDist: ../dist
   - Window: 1280x800, min 1024x768, resizable, title "OpenFlow"
   - Security: csp null (for development)

**File to create:**
```
src-tauri/tauri.conf.json
```

**Verification:**
```bash
cat src-tauri/tauri.conf.json | grep '"productName"'
cat src-tauri/tauri.conf.json | grep '"identifier"'
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/tauri.conf.json && git commit -m "chore: add Tauri configuration"`

---

### [ ] Step: Create build.rs

Create Tauri build script.

**Tasks:**
1. Create `src-tauri/build.rs` with tauri_build::build() call

**File to create:**
```
src-tauri/build.rs
```

**Verification:**
```bash
cat src-tauri/build.rs | grep "tauri_build"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/build.rs && git commit -m "chore: add Tauri build script"`

---

### [ ] Step: Create Rust main.rs and lib.rs

Create Tauri application entry points.

**Tasks:**
1. Create `src-tauri/src/main.rs` with:
   - Windows subsystem attribute for release
   - Main function calling lib::run()

2. Create `src-tauri/src/lib.rs` with:
   - Mobile entry point attribute
   - run() function with tauri::Builder
   - Shell plugin initialization

**Files to create:**
```
src-tauri/src/main.rs
src-tauri/src/lib.rs
```

**Verification:**
```bash
cat src-tauri/src/main.rs | grep "openflow_lib::run"
cat src-tauri/src/lib.rs | grep "tauri::Builder"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/ && git commit -m "feat: add Tauri entry points"`

---

### [ ] Step: Install Dependencies and Verify Build

Install all dependencies and verify the project builds.

**Context:**
This is a verification step. Must pass before proceeding.

**Tasks:**
1. Run `pnpm install` to install Node.js dependencies
2. Run `cd src-tauri && cargo check` to verify Rust compiles
3. Fix any dependency issues

**Verification:**
```bash
pnpm install
cd src-tauri && cargo check
```

**Expected output:**
- pnpm install completes without errors
- cargo check shows "Finished" with no errors

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git commit -m "chore: verify initial build"`

---

## Phase 1B: Frontend Package Structure

**Goal:** Create pnpm workspace packages following dependency hierarchy.

### [ ] Step: Create packages/utils

Create utilities package (Level 0 - no internal imports).

**Context:**
This package has NO dependencies on other @openflow packages. It provides shared utilities.

**Tasks:**
1. Create `packages/utils/package.json`:
   - name: "@openflow/utils"
   - version: "0.1.0"
   - type: "module"
   - main/types pointing to index.ts

2. Create `packages/utils/index.ts` - re-exports all utilities

3. Create `packages/utils/cn.ts`:
   - Import clsx and tailwind-merge
   - Export cn() function that combines clsx and twMerge
   - Add JSDoc documentation

**Files to create:**
```
packages/utils/package.json
packages/utils/index.ts
packages/utils/cn.ts
```

**Code pattern for cn.ts:**
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind CSS conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

**Verification:**
```bash
cat packages/utils/cn.ts | grep "twMerge"
cat packages/utils/index.ts | grep "export"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/utils/ && git commit -m "feat: add @openflow/utils package with cn utility"`

---

### [ ] Step: Create packages/generated (Placeholder)

Create generated types package (Level 0 - auto-generated, no imports).

**Context:**
This package will contain TypeScript types generated from Rust via typeshare. For now, create placeholder types.

**Tasks:**
1. Create `packages/generated/package.json`:
   - name: "@openflow/generated"
   - version: "0.1.0"
   - type: "module"

2. Create `packages/generated/index.ts` - re-exports types

3. Create `packages/generated/types.ts`:
   - Add header comment: "AUTO-GENERATED by typeshare. DO NOT EDIT."
   - Add placeholder types that match spec section 4.2:
     - TaskStatus enum
     - Task interface
     - Project interface
     - ChatRole enum
     - Chat interface
     - ProcessStatus enum
     - ExecutionProcess interface

**Files to create:**
```
packages/generated/package.json
packages/generated/index.ts
packages/generated/types.ts
```

**Important:** types.ts will be overwritten by typeshare later. These are placeholders for TypeScript compilation.

**Verification:**
```bash
cat packages/generated/types.ts | grep "AUTO-GENERATED"
cat packages/generated/types.ts | grep "TaskStatus"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/generated/ && git commit -m "feat: add @openflow/generated package with placeholder types"`

---

### [ ] Step: Create packages/validation

Create validation package with Zod schemas (Level 1 - imports generated, utils).

**Context:**
Zod schemas derived from generated types. Used for form validation.

**Tasks:**
1. Create `packages/validation/package.json`:
   - name: "@openflow/validation"
   - version: "0.1.0"
   - type: "module"
   - dependencies: zod, @openflow/generated

2. Create `packages/validation/index.ts` - re-exports schemas

3. Create `packages/validation/schemas.ts`:
   - Import z from zod
   - Create schemas matching generated types:
     - taskStatusSchema
     - createProjectSchema
     - createTaskSchema
     - updateTaskSchema
   - Export inferred types from schemas

**Files to create:**
```
packages/validation/package.json
packages/validation/index.ts
packages/validation/schemas.ts
```

**Verification:**
```bash
cat packages/validation/schemas.ts | grep "z.object"
cat packages/validation/package.json | grep "@openflow/generated"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/validation/ && git commit -m "feat: add @openflow/validation package with Zod schemas"`

---

### [ ] Step: Create packages/queries

Create queries package with Tauri invoke wrappers (Level 2 - imports generated, utils).

**Context:**
Thin wrappers around Tauri invoke() calls. No business logic here.

**Tasks:**
1. Create `packages/queries/package.json`:
   - name: "@openflow/queries"
   - version: "0.1.0"
   - type: "module"
   - dependencies: @tauri-apps/api, @openflow/generated

2. Create `packages/queries/index.ts` - re-exports all query modules

3. Create `packages/queries/projects.ts`:
   - Import invoke from @tauri-apps/api/core
   - Import types from @openflow/generated
   - Export projectQueries object with:
     - list(): Promise<Project[]>
     - get(id): Promise<Project>
     - create(request): Promise<Project>
     - update(id, request): Promise<Project>
     - delete(id): Promise<void>

**Files to create:**
```
packages/queries/package.json
packages/queries/index.ts
packages/queries/projects.ts
```

**Code pattern:**
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Project, CreateProjectRequest } from '@openflow/generated';

export const projectQueries = {
  list: (): Promise<Project[]> => invoke('list_projects'),
  get: (id: string): Promise<Project> => invoke('get_project', { id }),
  // ...
};
```

**Verification:**
```bash
cat packages/queries/projects.ts | grep "invoke"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/queries/ && git commit -m "feat: add @openflow/queries package with project queries"`

---

### [ ] Step: Create packages/queries - Tasks, Settings

Add remaining query modules.

**Tasks:**
1. Create `packages/queries/tasks.ts` with taskQueries object
2. Create `packages/queries/executor-profiles.ts` with executorProfileQueries object
3. Create `packages/queries/settings.ts` with settingsQueries object
4. Update `packages/queries/index.ts` to re-export all

**Files to create:**
```
packages/queries/tasks.ts
packages/queries/executor-profiles.ts
packages/queries/settings.ts
```

**Verification:**
```bash
cat packages/queries/index.ts | grep "tasks"
cat packages/queries/index.ts | grep "settings"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/queries/ && git commit -m "feat: add task, executor, and settings queries"`

---

### [ ] Step: Create packages/hooks

Create hooks package with TanStack Query hooks (Level 3 - imports queries, validation, generated, utils).

**Context:**
TanStack Query hooks for data fetching with caching. Uses query keys pattern.

**Tasks:**
1. Create `packages/hooks/package.json`:
   - name: "@openflow/hooks"
   - version: "0.1.0"
   - type: "module"
   - dependencies: @tanstack/react-query, @openflow/queries, @openflow/generated

2. Create `packages/hooks/index.ts` - re-exports all hooks

3. Create `packages/hooks/useProjects.ts`:
   - Define projectKeys factory (all, lists, list, details, detail)
   - useProjects() - list query
   - useProject(id) - single query
   - useCreateProject() - mutation with invalidation
   - useUpdateProject() - mutation with invalidation
   - useDeleteProject() - mutation with invalidation

**Files to create:**
```
packages/hooks/package.json
packages/hooks/index.ts
packages/hooks/useProjects.ts
```

**Code pattern (from spec 5.4):**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectQueries } from '@openflow/queries';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => projectQueries.list(),
  });
}
```

**Verification:**
```bash
cat packages/hooks/useProjects.ts | grep "useQuery"
cat packages/hooks/useProjects.ts | grep "projectKeys"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add @openflow/hooks package with useProjects"`

---

### [ ] Step: Create packages/hooks - Tasks, Settings

Add remaining hook modules.

**Tasks:**
1. Create `packages/hooks/useTasks.ts` with:
   - taskKeys factory
   - useTasks(projectId, status?)
   - useTask(id)
   - useCreateTask()
   - useUpdateTask()
   - useArchiveTask()

2. Create `packages/hooks/useExecutorProfiles.ts`

3. Create `packages/hooks/useSettings.ts`

4. Update `packages/hooks/index.ts` to re-export all

**Files to create:**
```
packages/hooks/useTasks.ts
packages/hooks/useExecutorProfiles.ts
packages/hooks/useSettings.ts
```

**Verification:**
```bash
cat packages/hooks/useTasks.ts | grep "taskKeys"
cat packages/hooks/index.ts | grep "useTasks"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add task, executor, and settings hooks"`

---

### [ ] Step: Create packages/ui Structure

Create UI package structure with atomic design folders.

**Context:**
UI components are STATELESS. They receive props and call callbacks. No hooks, no invoke(), no business logic.

**Tasks:**
1. Create `packages/ui/package.json`:
   - name: "@openflow/ui"
   - version: "0.1.0"
   - type: "module"
   - dependencies: @openflow/utils, @openflow/generated, lucide-react

2. Create folder structure:
   - packages/ui/atoms/
   - packages/ui/molecules/
   - packages/ui/organisms/
   - packages/ui/templates/

3. Create index files:
   - packages/ui/index.ts
   - packages/ui/atoms/index.ts
   - packages/ui/molecules/index.ts
   - packages/ui/organisms/index.ts
   - packages/ui/templates/index.ts

**Files to create:**
```
packages/ui/package.json
packages/ui/index.ts
packages/ui/atoms/index.ts
packages/ui/molecules/index.ts
packages/ui/organisms/index.ts
packages/ui/templates/index.ts
```

**Verification:**
```bash
ls packages/ui/atoms/
ls packages/ui/molecules/
cat packages/ui/package.json | grep "@openflow/utils"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/ && git commit -m "feat: add @openflow/ui package structure"`

---

### [ ] Step: Verify Package Resolution

Run pnpm install and verify all packages resolve correctly.

**Context:**
This is a critical verification step. All packages must resolve before proceeding.

**Tasks:**
1. Run `pnpm install`
2. Verify no resolution errors
3. Test imports between packages compile

**Verification:**
```bash
pnpm install
pnpm typecheck  # Should pass (may have minor issues to fix)
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git commit -m "chore: verify package resolution"`

---

## Phase 2: Rust Types and Database

**Goal:** Define Rust types with typeshare and set up SQLite database.

### [ ] Step: Create Rust Types Module Structure

Create the types module structure in Rust.

**Tasks:**
1. Create `src-tauri/src/types/mod.rs`:
   - Declare all submodules
   - Re-export all types

**File to create:**
```
src-tauri/src/types/mod.rs
```

**Content:**
```rust
pub mod project;
pub mod task;
pub mod chat;
pub mod message;
pub mod process;
pub mod executor;

pub use project::*;
pub use task::*;
pub use chat::*;
pub use message::*;
pub use process::*;
pub use executor::*;
```

**Verification:**
```bash
cat src-tauri/src/types/mod.rs | grep "pub mod"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/ && git commit -m "feat: add Rust types module structure"`

---

### [ ] Step: Create Rust Project Types

Create project.rs with Project types.

**Context:**
Types use #[typeshare] attribute for TypeScript generation. Follow spec section 4.2.

**Tasks:**
1. Create `src-tauri/src/types/project.rs` with:
   - Project struct with all fields from spec
   - CreateProjectRequest struct
   - UpdateProjectRequest struct
   - All with #[typeshare], Serialize, Deserialize, Clone, Debug

**File to create:**
```
src-tauri/src/types/project.rs
```

**Verification:**
```bash
cat src-tauri/src/types/project.rs | grep "#\[typeshare\]"
cat src-tauri/src/types/project.rs | grep "pub struct Project"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/project.rs && git commit -m "feat: add Rust Project types"`

---

### [ ] Step: Create Rust Task Types

Create task.rs with Task types and TaskStatus enum.

**Tasks:**
1. Create `src-tauri/src/types/task.rs` with:
   - TaskStatus enum (Todo, Inprogress, Inreview, Done, Cancelled)
   - Task struct with all fields
   - CreateTaskRequest struct
   - UpdateTaskRequest struct
   - TaskWithChats struct (for get_task response)

**File to create:**
```
src-tauri/src/types/task.rs
```

**Code pattern:**
```rust
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    Inprogress,
    Inreview,
    Done,
    Cancelled,
}
```

**Verification:**
```bash
cat src-tauri/src/types/task.rs | grep "TaskStatus"
cat src-tauri/src/types/task.rs | grep "CreateTaskRequest"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/task.rs && git commit -m "feat: add Rust Task types"`

---

### [ ] Step: Create Rust Chat Types

Create chat.rs with Chat types and ChatRole enum.

**Tasks:**
1. Create `src-tauri/src/types/chat.rs` with:
   - ChatRole enum (Main, Review, Test, Terminal)
   - Chat struct with all fields from spec
   - CreateChatRequest struct
   - ChatWithMessages struct

**File to create:**
```
src-tauri/src/types/chat.rs
```

**Verification:**
```bash
cat src-tauri/src/types/chat.rs | grep "ChatRole"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/chat.rs && git commit -m "feat: add Rust Chat types"`

---

### [ ] Step: Create Rust Message Types

Create message.rs with Message types.

**Tasks:**
1. Create `src-tauri/src/types/message.rs` with:
   - MessageRole enum (User, Assistant, System)
   - Message struct with all fields
   - CreateMessageRequest struct

**File to create:**
```
src-tauri/src/types/message.rs
```

**Verification:**
```bash
cat src-tauri/src/types/message.rs | grep "Message"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/message.rs && git commit -m "feat: add Rust Message types"`

---

### [ ] Step: Create Rust Process Types

Create process.rs with ExecutionProcess types.

**Tasks:**
1. Create `src-tauri/src/types/process.rs` with:
   - ProcessStatus enum (Running, Completed, Failed, Killed)
   - RunReason enum (from spec)
   - OutputType enum (Stdout, Stderr)
   - ExecutionProcess struct
   - ProcessOutputEvent struct (for Tauri events)
   - ProcessStatusEvent struct

**File to create:**
```
src-tauri/src/types/process.rs
```

**Verification:**
```bash
cat src-tauri/src/types/process.rs | grep "ProcessStatus"
cat src-tauri/src/types/process.rs | grep "ProcessOutputEvent"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/process.rs && git commit -m "feat: add Rust Process types"`

---

### [ ] Step: Create Rust Executor Types

Create executor.rs with ExecutorProfile types.

**Tasks:**
1. Create `src-tauri/src/types/executor.rs` with:
   - ExecutorProfile struct
   - CreateExecutorProfileRequest struct
   - UpdateExecutorProfileRequest struct

**File to create:**
```
src-tauri/src/types/executor.rs
```

**Verification:**
```bash
cat src-tauri/src/types/executor.rs | grep "ExecutorProfile"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/executor.rs && git commit -m "feat: add Rust Executor types"`

---

### [ ] Step: Create TypeShare Generation Script

Create script to generate TypeScript from Rust types.

**Tasks:**
1. Create `scripts/generate-types.sh`:
   - Install typeshare-cli if not present
   - Run typeshare on src-tauri/src/types
   - Output to packages/generated/types.ts
   - Make executable

2. Add script to package.json: "generate:types": "bash scripts/generate-types.sh"

**File to create:**
```
scripts/generate-types.sh
```

**Content:**
```bash
#!/bin/bash
set -e

# Install typeshare-cli if not present
if ! command -v typeshare &> /dev/null; then
    cargo install typeshare-cli
fi

# Generate TypeScript types from Rust
typeshare ./src-tauri/src/types --lang=typescript --output-file=./packages/generated/types.ts

echo "✅ Types generated successfully"
```

**Verification:**
```bash
chmod +x scripts/generate-types.sh
./scripts/generate-types.sh
cat packages/generated/types.ts | head -20
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add scripts/ package.json && git commit -m "feat: add typeshare generation script"`

---

### [ ] Step: Create Database Module

Create SQLite database module with connection pool.

**Tasks:**
1. Create `src-tauri/src/db/mod.rs`:
   - Declare pool submodule
   - Re-export pool functions

2. Create `src-tauri/src/db/pool.rs`:
   - Create init_db function that:
     - Creates app data directory if needed
     - Creates SQLite database file
     - Runs migrations
     - Returns SqlitePool
   - Use Tauri's app_data_dir for database location

**Files to create:**
```
src-tauri/src/db/mod.rs
src-tauri/src/db/pool.rs
```

**Verification:**
```bash
cat src-tauri/src/db/pool.rs | grep "SqlitePool"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/db/ && git commit -m "feat: add database module with pool"`

---

### [ ] Step: Create Initial Database Migration

Create SQL migration with all tables from spec section 4.1.

**Tasks:**
1. Create `src-tauri/migrations/001_initial.sql` with:
   - All tables from spec section 4.1
   - Proper foreign key constraints
   - Indexes on frequently queried columns
   - Check constraints for enums
   - Default values

**File to create:**
```
src-tauri/migrations/001_initial.sql
```

**Important:** Copy the EXACT schema from spec section 4.1.

**Verification:**
```bash
cat src-tauri/migrations/001_initial.sql | grep "CREATE TABLE"
cat src-tauri/migrations/001_initial.sql | wc -l  # Should be 100+ lines
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/migrations/ && git commit -m "feat: add initial database migration"`

---

## Phase 3: Rust Services (TDD)

**Goal:** Implement business logic services with tests first.

### [ ] Step: Create Services Module Structure

Create the services module structure.

**Tasks:**
1. Create `src-tauri/src/services/mod.rs`:
   - Declare all service submodules
   - Re-export service structs

**File to create:**
```
src-tauri/src/services/mod.rs
```

**Content:**
```rust
pub mod project_service;
pub mod task_service;
pub mod executor_profile_service;
pub mod settings_service;

pub use project_service::ProjectService;
pub use task_service::TaskService;
pub use executor_profile_service::ExecutorProfileService;
pub use settings_service::SettingsService;
```

**Verification:**
```bash
cat src-tauri/src/services/mod.rs | grep "pub mod"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/mod.rs && git commit -m "feat: add services module structure"`

---

### [ ] Step: Create ProjectService - Tests First

Create project service with TDD approach.

**Context:**
TDD: Write tests FIRST, then implement. Pattern from spec section 8.4.

**Tasks:**
1. Create `src-tauri/src/services/project_service.rs`:
   - Write #[cfg(test)] module with tests for:
     - test_create_project
     - test_get_project
     - test_list_projects
     - test_update_project
     - test_delete_project
   - Implement ProjectService struct with:
     - list(pool) -> Result<Vec<Project>>
     - get(pool, id) -> Result<Project>
     - create(pool, request) -> Result<Project>
     - update(pool, id, request) -> Result<Project>
     - delete(pool, id) -> Result<()>

**File to create:**
```
src-tauri/src/services/project_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test project
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/project_service.rs && git commit -m "feat: add ProjectService with tests"`

---

### [ ] Step: Create TaskService - Tests First

Create task service with TDD approach.

**Tasks:**
1. Create `src-tauri/src/services/task_service.rs`:
   - Write tests first
   - Implement TaskService with:
     - list(pool, project_id, status, include_archived) -> Result<Vec<Task>>
     - get(pool, id) -> Result<TaskWithChats>
     - create(pool, request) -> Result<Task>
     - update(pool, id, request) -> Result<Task>
     - archive(pool, id) -> Result<Task>
     - delete(pool, id) -> Result<()>

**File to create:**
```
src-tauri/src/services/task_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test task
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/task_service.rs && git commit -m "feat: add TaskService with tests"`

---

### [ ] Step: Create ExecutorProfileService

Create executor profile service.

**Tasks:**
1. Create `src-tauri/src/services/executor_profile_service.rs`:
   - Write tests first
   - Implement CRUD operations
   - Handle is_default logic (only one default)

**File to create:**
```
src-tauri/src/services/executor_profile_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test executor
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/executor_profile_service.rs && git commit -m "feat: add ExecutorProfileService"`

---

### [ ] Step: Create SettingsService

Create settings service for app configuration.

**Tasks:**
1. Create `src-tauri/src/services/settings_service.rs`:
   - get(pool, key) -> Result<Option<String>>
   - set(pool, key, value) -> Result<()>
   - get_all(pool) -> Result<HashMap<String, String>>

**File to create:**
```
src-tauri/src/services/settings_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test settings
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/settings_service.rs && git commit -m "feat: add SettingsService"`

---

## Phase 4: Tauri Commands

**Goal:** Create IPC command handlers that call services.

### [ ] Step: Create Commands Module Structure

Create commands module with AppState.

**Tasks:**
1. Create `src-tauri/src/commands/mod.rs`:
   - Declare submodules
   - Define AppState struct holding SqlitePool
   - Re-export commands

**File to create:**
```
src-tauri/src/commands/mod.rs
```

**Content:**
```rust
pub mod projects;
pub mod tasks;
pub mod executor;
pub mod settings;

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub db: Arc<Mutex<SqlitePool>>,
}
```

**Verification:**
```bash
cat src-tauri/src/commands/mod.rs | grep "AppState"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/mod.rs && git commit -m "feat: add commands module with AppState"`

---

### [ ] Step: Create Project Commands

Create Tauri commands for projects.

**Context:**
Commands are thin wrappers that call services. Error handling converts to String for IPC.

**Tasks:**
1. Create `src-tauri/src/commands/projects.rs`:
   - #[tauri::command] for each operation
   - Pattern: get state, acquire pool, call service, map error

**File to create:**
```
src-tauri/src/commands/projects.rs
```

**Code pattern (from spec 5.1.1):**
```rust
use tauri::State;
use crate::commands::AppState;
use crate::services::ProjectService;
use crate::types::{Project, CreateProjectRequest};

#[tauri::command]
pub async fn list_projects(
    state: State<'_, AppState>,
) -> Result<Vec<Project>, String> {
    let pool = state.db.lock().await;
    ProjectService::list(&pool)
        .await
        .map_err(|e| e.to_string())
}
```

**Verification:**
```bash
cat src-tauri/src/commands/projects.rs | grep "#\[tauri::command\]"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/projects.rs && git commit -m "feat: add project commands"`

---

### [ ] Step: Create Task Commands

Create Tauri commands for tasks.

**Tasks:**
1. Create `src-tauri/src/commands/tasks.rs`:
   - list_tasks, get_task, create_task, update_task, archive_task, delete_task

**File to create:**
```
src-tauri/src/commands/tasks.rs
```

**Verification:**
```bash
cat src-tauri/src/commands/tasks.rs | grep "list_tasks"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/tasks.rs && git commit -m "feat: add task commands"`

---

### [ ] Step: Create Executor Commands

Create Tauri commands for executor profiles.

**Tasks:**
1. Create `src-tauri/src/commands/executor.rs`:
   - list_executor_profiles, create_executor_profile, update_executor_profile, delete_executor_profile

**File to create:**
```
src-tauri/src/commands/executor.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/executor.rs && git commit -m "feat: add executor commands"`

---

### [ ] Step: Create Settings Commands

Create Tauri commands for settings.

**Tasks:**
1. Create `src-tauri/src/commands/settings.rs`:
   - get_setting, set_setting, get_all_settings

**File to create:**
```
src-tauri/src/commands/settings.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/settings.rs && git commit -m "feat: add settings commands"`

---

### [ ] Step: Register Commands in lib.rs

Update lib.rs to register all commands and initialize state.

**Tasks:**
1. Update `src-tauri/src/lib.rs`:
   - Import all modules (types, db, services, commands)
   - Initialize database in setup hook
   - Manage AppState
   - Register all commands with invoke_handler

**Update file:**
```
src-tauri/src/lib.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
cd src-tauri && cargo test
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/lib.rs && git commit -m "feat: register all Tauri commands"`

---

### [ ] Step: Verify Full Rust Backend

Run all Rust tests and verify compilation.

**Tasks:**
1. Run cargo check
2. Run cargo test
3. Run cargo clippy
4. Fix any warnings or errors

**Verification:**
```bash
cd src-tauri && cargo check
cd src-tauri && cargo test
cd src-tauri && cargo clippy -- -D warnings
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git commit -m "chore: verify Rust backend builds and tests pass"`

---

## Phase 5: UI Atoms (TDD with Storybook)

**Goal:** Create atomic UI components with stories.

### [ ] Step: Create Button Component

Create Button atom with variants and stories.

**Context:**
UI components are STATELESS. No hooks. Use cn() for class names.

**Tasks:**
1. Create `packages/ui/atoms/Button.tsx`:
   - ButtonProps interface (variant, size, disabled, loading, children, onClick)
   - Variants: primary, secondary, ghost, destructive
   - Sizes: sm, md, lg
   - Loading state with Spinner
   - Use cn() for class composition

2. Create `packages/ui/atoms/Button.stories.tsx`:
   - Default story
   - All variants story
   - All sizes story
   - Loading state story
   - Disabled state story

3. Update `packages/ui/atoms/index.ts` to export Button

**Files to create:**
```
packages/ui/atoms/Button.tsx
packages/ui/atoms/Button.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
cat packages/ui/atoms/Button.tsx | grep "interface ButtonProps"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/atoms/Button* && git commit -m "feat: add Button component with stories"`

---

### [ ] Step: Create Input Component

Create Input atom with variants.

**Tasks:**
1. Create `packages/ui/atoms/Input.tsx`:
   - InputProps extending React InputHTMLAttributes
   - Error state styling
   - Disabled state styling

2. Create `packages/ui/atoms/Input.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/atoms/Input.tsx
packages/ui/atoms/Input.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/atoms/Input* && git commit -m "feat: add Input component"`

---

### [ ] Step: Create Badge Component

Create Badge atom for status display.

**Tasks:**
1. Create `packages/ui/atoms/Badge.tsx`:
   - BadgeProps (variant, children)
   - Variants: default, success, warning, error, info
   - Status-specific variants: todo, inprogress, inreview, done, cancelled

2. Create `packages/ui/atoms/Badge.stories.tsx`

**Files to create:**
```
packages/ui/atoms/Badge.tsx
packages/ui/atoms/Badge.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/atoms/Badge* && git commit -m "feat: add Badge component"`

---

### [ ] Step: Create Icon and Spinner Components

Create remaining atom components.

**Tasks:**
1. Create `packages/ui/atoms/Icon.tsx`:
   - Wrapper around lucide-react icons
   - Size prop

2. Create `packages/ui/atoms/Spinner.tsx`:
   - Loading spinner with sizes

3. Update index.ts

**Files to create:**
```
packages/ui/atoms/Icon.tsx
packages/ui/atoms/Spinner.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/atoms/ && git commit -m "feat: add Icon and Spinner components"`

---

## Continue with remaining phases...

*Note: The plan continues with similar detailed steps for:*
- Phase 6: UI Molecules (FormField, Card, Dropdown, Dialog, Tabs)
- Phase 7: UI Organisms (TaskCard, TaskList, ProjectSelector, ChatPanel, etc.)
- Phase 8: UI Templates (AppLayout, TaskLayout)
- Phase 9: Routing (TanStack Router setup, route files)
- Phase 10: Storybook Setup
- Phase 11: Architecture Validation
- Phase 12: Git Hooks (Husky, lint-staged)
- Phase 13: Chat & Workflow (services, commands, UI)
- Phase 14: Process Execution (PTY, streaming)
- Phase 15: Git Integration (worktrees, diff, commits)
- Phase 16: Settings & Search
- Phase 17: CI Pipeline

---

## Verification Checklist

After completing all phases, verify:

- [ ] `pnpm install` succeeds
- [ ] `pnpm generate:types` produces valid TypeScript
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm validate:arch` passes
- [ ] `pnpm storybook` launches correctly
- [ ] `cd src-tauri && cargo check` passes
- [ ] `cd src-tauri && cargo test` passes
- [ ] `cd src-tauri && cargo clippy -- -D warnings` passes
- [ ] `pnpm tauri dev` launches app without errors
