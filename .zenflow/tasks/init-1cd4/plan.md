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

### [x] Step: Create CLAUDE.md
<!-- chat-id: 9edced27-df9c-4466-a373-95e52802d6d8 -->

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

   IMPORTANT - HIGH LEVEL ONLY. No magic strings, no magic constants. Talk about high level system architecture, rather than code snippets or directories that may change. Codebases are fluid, patterns and design are solid, and CLAUDE.md should stand the tests of time.

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

### [x] Step: Create .gitignore
<!-- chat-id: 67527208-c226-4f7c-9fec-64b9993621c8 -->

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

### [x] Step: Create package.json
<!-- chat-id: de340f6c-e500-4ad5-be9a-f5362a4d3360 -->

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

### [x] Step: Create pnpm-workspace.yaml
<!-- chat-id: 9951285a-3f63-46dc-b880-c82766b34811 -->

Create pnpm workspace configuration. USE CLI TOOLS TO DO EVERYTHING, pnpm init, pnpm add, etc. 

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

### [x] Step: Create tsconfig.json
<!-- chat-id: 4d7797f4-9752-40ab-b9c2-2abbdeb26a8c -->

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

### [x] Step: Create biome.json
<!-- chat-id: 69a9c470-c650-4684-9188-940b60a8261d -->

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

### [x] Step: Create vite.config.ts
<!-- chat-id: eb3e9731-3aaa-4b69-ac88-e486c027f815 -->

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

### [x] Step: Create index.html
<!-- chat-id: 3cd86153-043e-4180-b7da-75bb711358ea -->

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

### [x] Step: Create src/main.tsx
<!-- chat-id: 32a20f93-abb6-4b11-b4b4-a280eb411a82 -->

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

### [x] Step: Create Tailwind Configuration
<!-- chat-id: 96eab6d6-79f8-4a16-9561-a38700f958a2 -->

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

### [x] Step: Create Cargo.toml
<!-- chat-id: 286efa67-b4fb-4f56-8159-a30f1daa1a83 -->

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

### [x] Step: Create tauri.conf.json
<!-- chat-id: e2701678-3df0-4c94-ae34-fe032ba4e443 -->

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

### [x] Step: Create build.rs
<!-- chat-id: 9b3ae154-4e47-4ee6-8e42-dcdfc323a3ca -->

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

### [x] Step: Create Rust main.rs and lib.rs
<!-- chat-id: f2e35bdf-c13b-48ce-a261-4286c0849dc0 -->

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

### [x] Step: Install Dependencies and Verify Build
<!-- chat-id: 1d5dc7db-74de-41ec-95e3-8297c3cc1036 -->

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

### [x] Step: Create packages/utils
<!-- chat-id: a1722245-827d-4ef2-8677-5fabb5285b13 -->

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

### [x] Step: Create packages/utils - Date and Markdown
<!-- chat-id: 6b633d75-1d2e-48b1-9fb5-2e21f6f6b506 -->

Add date formatting and markdown parsing utilities.

**Tasks:**
1. Create `packages/utils/date.ts`:
   - formatDate() function
   - formatRelativeTime() function
   - parseDate() function

2. Create `packages/utils/markdown.ts`:
   - parseWorkflowSteps() function for workflow markdown parsing
   - extractStepStatus() function

3. Update `packages/utils/index.ts` to re-export all

**Files to create:**
```
packages/utils/date.ts
packages/utils/markdown.ts
```

**Verification:**
```bash
cat packages/utils/date.ts | grep "formatDate"
cat packages/utils/markdown.ts | grep "parseWorkflowSteps"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/utils/ && git commit -m "feat: add date and markdown utilities"`

---

### [x] Step: Create packages/generated (Placeholder)
<!-- chat-id: 8318e29c-f65a-4e91-9563-713514725e78 -->

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
     - Message interface
     - ExecutorProfile interface

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

### [x] Step: Create packages/validation
<!-- chat-id: 180004e8-e758-42e7-b007-deff250b5f92 -->

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
     - createChatSchema
     - createMessageSchema
     - createExecutorProfileSchema
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

### [x] Step: Create packages/queries - Projects
<!-- chat-id: 00a41da5-f577-4a94-ba71-3cb1147825c5 -->

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

### [x] Step: Create packages/queries - Tasks
<!-- chat-id: b9172609-4cea-40f8-ab74-fe948fda3719 -->

Add task queries module.

**Tasks:**
1. Create `packages/queries/tasks.ts` with taskQueries object:
   - list(projectId, status?, includeArchived?): Promise<Task[]>
   - get(id): Promise<TaskWithChats>
   - create(request): Promise<Task>
   - update(id, request): Promise<Task>
   - archive(id): Promise<Task>
   - delete(id): Promise<void>

2. Update `packages/queries/index.ts` to re-export

**Files to create:**
```
packages/queries/tasks.ts
```

**Verification:**
```bash
cat packages/queries/tasks.ts | grep "taskQueries"
cat packages/queries/index.ts | grep "tasks"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/queries/ && git commit -m "feat: add task queries"`

---

### [x] Step: Create packages/queries - Chats, Messages
<!-- chat-id: 9f61b052-913f-4f94-8d27-6f14b9851a01 -->

Add chat and message queries modules.

**Tasks:**
1. Create `packages/queries/chats.ts` with chatQueries object:
   - list(taskId): Promise<Chat[]>
   - get(id): Promise<ChatWithMessages>
   - create(request): Promise<Chat>
   - startWorkflowStep(chatId): Promise<ExecutionProcess>

2. Create `packages/queries/messages.ts` with messageQueries object:
   - list(chatId): Promise<Message[]>
   - create(request): Promise<Message>

3. Update `packages/queries/index.ts` to re-export all

**Files to create:**
```
packages/queries/chats.ts
packages/queries/messages.ts
```

**Verification:**
```bash
cat packages/queries/chats.ts | grep "chatQueries"
cat packages/queries/messages.ts | grep "messageQueries"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/queries/ && git commit -m "feat: add chat and message queries"`

---

### [x] Step: Create packages/queries - Processes, Executor, Settings
<!-- chat-id: 83ea7e6e-7916-44c2-bc4a-392e16dd4468 -->

Add remaining query modules.

**Tasks:**
1. Create `packages/queries/processes.ts` with processQueries object:
   - get(id): Promise<ExecutionProcess>
   - kill(id): Promise<ExecutionProcess>
   - sendInput(processId, input): Promise<void>

2. Create `packages/queries/executor-profiles.ts` with executorProfileQueries object:
   - list(): Promise<ExecutorProfile[]>
   - create(request): Promise<ExecutorProfile>
   - update(id, request): Promise<ExecutorProfile>
   - delete(id): Promise<void>
   - runExecutor(chatId, prompt): Promise<ExecutionProcess>

3. Create `packages/queries/settings.ts` with settingsQueries object:
   - get(key): Promise<string | null>
   - set(key, value): Promise<void>
   - getAll(): Promise<Record<string, string>>

4. Update `packages/queries/index.ts` to re-export all

**Files to create:**
```
packages/queries/processes.ts
packages/queries/executor-profiles.ts
packages/queries/settings.ts
```

**Verification:**
```bash
cat packages/queries/index.ts | grep "processes"
cat packages/queries/index.ts | grep "executorProfile"
cat packages/queries/index.ts | grep "settings"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/queries/ && git commit -m "feat: add process, executor, and settings queries"`

---

### [x] Step: Create packages/queries - Git and Search
<!-- chat-id: f2bfcc82-e08d-4437-adc2-4e6ef5810c2e -->

Add git and search query modules.

**Tasks:**
1. Create `packages/queries/git.ts` with gitQueries object:
   - createWorktree(chatId, branchName, baseBranch): Promise<string>
   - deleteWorktree(chatId): Promise<void>
   - getDiff(chatId): Promise<FileDiff[]>
   - getCommits(chatId, limit?): Promise<Commit[]>
   - pushBranch(chatId): Promise<void>

2. Create `packages/queries/search.ts` with searchQueries object:
   - search(query, projectId?, resultTypes?, limit?): Promise<SearchResult[]>

3. Update `packages/queries/index.ts` to re-export all

**Files to create:**
```
packages/queries/git.ts
packages/queries/search.ts
```

**Verification:**
```bash
cat packages/queries/git.ts | grep "gitQueries"
cat packages/queries/search.ts | grep "searchQueries"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/queries/ && git commit -m "feat: add git and search queries"`

---

### [x] Step: Create packages/hooks - Projects
<!-- chat-id: 8712a4ab-98f4-4de6-86a0-9d45ca4f5c0c -->

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

### [x] Step: Create packages/hooks - Tasks
<!-- chat-id: 78a0536b-65ef-48d5-9c71-d9f64b61c79d -->

Add task hooks module.

**Tasks:**
1. Create `packages/hooks/useTasks.ts` with:
   - taskKeys factory
   - useTasks(projectId, status?)
   - useTask(id)
   - useCreateTask()
   - useUpdateTask()
   - useArchiveTask()
   - useDeleteTask()

2. Update `packages/hooks/index.ts` to re-export

**Files to create:**
```
packages/hooks/useTasks.ts
```

**Verification:**
```bash
cat packages/hooks/useTasks.ts | grep "taskKeys"
cat packages/hooks/index.ts | grep "useTasks"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add task hooks"`

---

### [x] Step: Create packages/hooks - Chats, Messages
<!-- chat-id: 196088d5-de26-4caa-ac9a-44948245ca67 -->

Add chat and message hooks modules.

**Tasks:**
1. Create `packages/hooks/useChats.ts` with:
   - chatKeys factory
   - useChats(taskId)
   - useChat(id)
   - useCreateChat()
   - useStartWorkflowStep()

2. Create `packages/hooks/useMessages.ts` with:
   - messageKeys factory
   - useMessages(chatId)
   - useCreateMessage()

3. Update `packages/hooks/index.ts` to re-export all

**Files to create:**
```
packages/hooks/useChats.ts
packages/hooks/useMessages.ts
```

**Verification:**
```bash
cat packages/hooks/useChats.ts | grep "chatKeys"
cat packages/hooks/useMessages.ts | grep "messageKeys"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add chat and message hooks"`

---

### [x] Step: Create packages/hooks - Processes, Executor, Settings
<!-- chat-id: 106d0100-fd73-4297-a934-fa6def0a5ec9 -->

Add remaining hook modules.

**Tasks:**
1. Create `packages/hooks/useProcesses.ts` with:
   - processKeys factory
   - useProcess(id)
   - useKillProcess()
   - useSendInput()

2. Create `packages/hooks/useExecutorProfiles.ts` with:
   - executorProfileKeys factory
   - useExecutorProfiles()
   - useCreateExecutorProfile()
   - useUpdateExecutorProfile()
   - useDeleteExecutorProfile()
   - useRunExecutor()

3. Create `packages/hooks/useSettings.ts` with:
   - settingsKeys factory
   - useSetting(key)
   - useAllSettings()
   - useSetSetting()

4. Update `packages/hooks/index.ts` to re-export all

**Files to create:**
```
packages/hooks/useProcesses.ts
packages/hooks/useExecutorProfiles.ts
packages/hooks/useSettings.ts
```

**Verification:**
```bash
cat packages/hooks/useProcesses.ts | grep "processKeys"
cat packages/hooks/useExecutorProfiles.ts | grep "executorProfileKeys"
cat packages/hooks/useSettings.ts | grep "settingsKeys"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add process, executor, and settings hooks"`

---

### [x] Step: Create packages/hooks - Process Output (Event Subscription)
<!-- chat-id: 1c5b37a4-5e66-47c6-a4ef-ef1af4002e14 -->

Add real-time process output subscription hook.

**Context:**
Uses Tauri events for real-time streaming from CLI processes.

**Tasks:**
1. Create `packages/hooks/useProcessOutput.ts` with:
   - useProcessOutput(processId) - subscribes to Tauri events
   - Returns output array and status
   - Cleanup on unmount

2. Update `packages/hooks/index.ts` to re-export

**Files to create:**
```
packages/hooks/useProcessOutput.ts
```

**Code pattern (from spec 8.3):**
```typescript
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { ProcessOutputEvent } from '@openflow/generated';

export function useProcessOutput(processId: string) {
  const [output, setOutput] = useState<string[]>([]);

  useEffect(() => {
    const unlisten = listen<ProcessOutputEvent>(
      `process-output-${processId}`,
      (event) => {
        setOutput((prev) => [...prev, event.payload.content]);
      }
    );

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [processId]);

  return output;
}
```

**Verification:**
```bash
cat packages/hooks/useProcessOutput.ts | grep "listen"
cat packages/hooks/useProcessOutput.ts | grep "useEffect"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add useProcessOutput event subscription hook"`

---

### [x] Step: Create packages/hooks - Keyboard Shortcuts
<!-- chat-id: 4c12ebfc-b22e-4e59-81ae-4b5ce38b6e74 -->

Add keyboard shortcuts hook.

**Context:**
Centralized keyboard shortcut handling from spec section 11.

**Tasks:**
1. Create `packages/hooks/useKeyboardShortcuts.ts` with:
   - ShortcutConfig interface
   - useKeyboardShortcuts(shortcuts) hook
   - Handle meta/ctrl key normalization for cross-platform

2. Update `packages/hooks/index.ts` to re-export

**Files to create:**
```
packages/hooks/useKeyboardShortcuts.ts
```

**Verification:**
```bash
cat packages/hooks/useKeyboardShortcuts.ts | grep "ShortcutConfig"
cat packages/hooks/useKeyboardShortcuts.ts | grep "useEffect"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/hooks/ && git commit -m "feat: add useKeyboardShortcuts hook"`

---

### [x] Step: Create packages/ui Structure
<!-- chat-id: 0c35e49d-3421-4552-a949-c8fcc1a5108c -->

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

### [x] Step: Verify Package Resolution
<!-- chat-id: 2910d35e-6654-4679-907a-44ad52a0c1cc -->

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

### [x] Step: Create Rust Types Module Structure
<!-- chat-id: 7198ccbc-9338-4913-8062-9f3acf3883a7 -->

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
pub mod workflow;

pub use project::*;
pub use task::*;
pub use chat::*;
pub use message::*;
pub use process::*;
pub use executor::*;
pub use workflow::*;
```

**Verification:**
```bash
cat src-tauri/src/types/mod.rs | grep "pub mod"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/ && git commit -m "feat: add Rust types module structure"`

---

### [x] Step: Create Rust Project Types
<!-- chat-id: 54378301-8f1b-4fbf-9a1e-a44801c0aabd -->

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

### [x] Step: Create Rust Task Types
<!-- chat-id: 2bfd62f0-a241-446f-b2cf-fe9d27bff09c -->

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

### [x] Step: Create Rust Chat Types
<!-- chat-id: 1efbb034-3045-40fa-832d-444c3cf81f0d -->

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

### [x] Step: Create Rust Message Types
<!-- chat-id: 8d669907-9d37-4f25-be23-c3526cd4900c -->

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

### [x] Step: Create Rust Process Types
<!-- chat-id: a894b7b9-aa2e-4fb7-8596-38be7278f083 -->

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

### [x] Step: Create Rust Executor Types
<!-- chat-id: 9e6993b9-f081-4183-8d16-5c04a2d66836 -->

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

### [x] Step: Create Rust Workflow Types
<!-- chat-id: 43b4e3bb-084f-40f0-bd00-0520cc097624 -->

Create workflow.rs with Workflow types.

**Tasks:**
1. Create `src-tauri/src/types/workflow.rs` with:
   - WorkflowTemplate struct
   - WorkflowStep struct
   - WorkflowVariable enum

**File to create:**
```
src-tauri/src/types/workflow.rs
```

**Verification:**
```bash
cat src-tauri/src/types/workflow.rs | grep "WorkflowTemplate"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/workflow.rs && git commit -m "feat: add Rust Workflow types"`

---

### [x] Step: Create Rust Git Types
<!-- chat-id: 0b37b2da-67a2-4ac7-b69d-bcc1d302db8c -->

Create git.rs with Git-related types.

**Tasks:**
1. Create `src-tauri/src/types/git.rs` with:
   - FileDiff struct
   - DiffHunk struct
   - Commit struct
   - SearchResult struct
   - SearchResultType enum

2. Update `src-tauri/src/types/mod.rs` to include git module

**File to create:**
```
src-tauri/src/types/git.rs
```

**Verification:**
```bash
cat src-tauri/src/types/git.rs | grep "FileDiff"
cat src-tauri/src/types/git.rs | grep "Commit"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/types/ && git commit -m "feat: add Rust Git types"`

---

### [x] Step: Create TypeShare Generation Script
<!-- chat-id: 06a7e158-ca83-4850-8cb4-3f5d43b5f3e1 -->

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

### [x] Step: Create Database Module
<!-- chat-id: 962f5808-0d37-4949-9ca2-85d0ec5c14ea -->

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

### [x] Step: Create Initial Database Migration
<!-- chat-id: 650ee0ed-93ba-41b9-b24d-193f379d7887 -->

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

### [x] Step: Create Search Index Migration
<!-- chat-id: e1b7ce24-2bb0-4bcc-a8f1-045173e93fe8 -->

Create FTS5 migration for full-text search.

**Context:**
SQLite FTS5 for efficient search from spec section 12.2.

**Tasks:**
1. Create `src-tauri/migrations/002_search_index.sql` with:
   - FTS5 virtual table for search_index
   - Triggers for task insert/update/delete
   - Triggers for project insert/update/delete

**File to create:**
```
src-tauri/migrations/002_search_index.sql
```

**Verification:**
```bash
cat src-tauri/migrations/002_search_index.sql | grep "fts5"
cat src-tauri/migrations/002_search_index.sql | grep "TRIGGER"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/migrations/ && git commit -m "feat: add search index migration with FTS5"`

---

## Phase 3: Rust Services (TDD)

**Goal:** Implement business logic services with tests first.

### [x] Step: Create Services Module Structure
<!-- chat-id: 546b1293-a2e8-4e43-86d4-f1173cdf04a1 -->

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
pub mod chat_service;
pub mod message_service;
pub mod executor_profile_service;
pub mod settings_service;
pub mod process_service;
pub mod git_service;
pub mod workflow_service;
pub mod search_service;

pub use project_service::ProjectService;
pub use task_service::TaskService;
pub use chat_service::ChatService;
pub use message_service::MessageService;
pub use executor_profile_service::ExecutorProfileService;
pub use settings_service::SettingsService;
pub use process_service::ProcessService;
pub use git_service::GitService;
pub use workflow_service::WorkflowService;
pub use search_service::SearchService;
```

**Verification:**
```bash
cat src-tauri/src/services/mod.rs | grep "pub mod"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/mod.rs && git commit -m "feat: add services module structure"`

---

### [x] Step: Create ProjectService - Tests First
<!-- chat-id: f345de55-7480-47cb-b1bd-d74a0d0587dd -->

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

### [x] Step: Create TaskService - Tests First
<!-- chat-id: 8e398284-c2db-433b-abdb-c6d6d2863817 -->

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

### [x] Step: Create ChatService - Tests First
<!-- chat-id: 7291ca8a-50bc-4fbe-a2a8-4a781da3eeac -->

Create chat service with TDD approach.

**Tasks:**
1. Create `src-tauri/src/services/chat_service.rs`:
   - Write tests first
   - Implement ChatService with:
     - list(pool, task_id) -> Result<Vec<Chat>>
     - get(pool, id) -> Result<ChatWithMessages>
     - create(pool, request) -> Result<Chat>
     - update(pool, id, request) -> Result<Chat>

**File to create:**
```
src-tauri/src/services/chat_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test chat
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/chat_service.rs && git commit -m "feat: add ChatService with tests"`

---

### [x] Step: Create MessageService - Tests First
<!-- chat-id: 74ba9223-dba3-4406-91ed-9dbf1da169f1 -->

Create message service with TDD approach.

**Tasks:**
1. Create `src-tauri/src/services/message_service.rs`:
   - Write tests first
   - Implement MessageService with:
     - list(pool, chat_id) -> Result<Vec<Message>>
     - create(pool, request) -> Result<Message>

**File to create:**
```
src-tauri/src/services/message_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test message
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/message_service.rs && git commit -m "feat: add MessageService with tests"`

---

### [x] Step: Create ExecutorProfileService
<!-- chat-id: 1d473aa4-eced-468a-a5cc-b83a8f68a03e -->

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

### [x] Step: Create SettingsService
<!-- chat-id: e952580d-803a-446e-bd8c-b099c34bd2ab -->

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

### [x] Step: Create WorkflowService
<!-- chat-id: 0e36e656-de16-47f7-b4d6-1230f3076323 -->

Create workflow parsing and management service.

**Context:**
Parses markdown workflow files from spec section 3.2.1.

**Tasks:**
1. Create `src-tauri/src/services/workflow_service.rs`:
   - parse_workflow(content) -> Result<Vec<WorkflowStep>>
   - list_templates(folder_path) -> Result<Vec<WorkflowTemplate>>
   - get_builtin_templates() -> Vec<WorkflowTemplate>
   - substitute_variables(content, vars) -> String

**File to create:**
```
src-tauri/src/services/workflow_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test workflow
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/workflow_service.rs && git commit -m "feat: add WorkflowService with markdown parsing"`

---

### [x] Step: Create SearchService
<!-- chat-id: 9215bb9e-419a-40bc-931b-1d1ff69c9a3c -->

Create full-text search service.

**Context:**
Uses FTS5 from spec section 12.2.

**Tasks:**
1. Create `src-tauri/src/services/search_service.rs`:
   - search(pool, query, project_id?, result_types?, limit?) -> Result<Vec<SearchResult>>

**File to create:**
```
src-tauri/src/services/search_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test search
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/search_service.rs && git commit -m "feat: add SearchService with FTS5"`

---

## Phase 4: Tauri Commands

**Goal:** Create IPC command handlers that call services.

### [x] Step: Create Commands Module Structure
<!-- chat-id: bf9bb7d4-0af0-462d-806a-1abe64ba9274 -->

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
pub mod chats;
pub mod messages;
pub mod executor;
pub mod settings;
pub mod processes;
pub mod git;
pub mod search;

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

### [x] Step: Create Project Commands
<!-- chat-id: 956527a8-0284-46ef-acdd-161378ae1980 -->

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

### [x] Step: Create Task Commands
<!-- chat-id: 1f78b352-f302-4942-911f-d0adbdeea37f -->

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

### [x] Step: Create Chat Commands
<!-- chat-id: 2937e4cd-a893-4bd8-a726-a43e72d1ede2 -->

Create Tauri commands for chats.

**Tasks:**
1. Create `src-tauri/src/commands/chats.rs`:
   - list_chats, get_chat, create_chat, start_workflow_step

**File to create:**
```
src-tauri/src/commands/chats.rs
```

**Verification:**
```bash
cat src-tauri/src/commands/chats.rs | grep "#\[tauri::command\]"
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/chats.rs && git commit -m "feat: add chat commands"`

---

### [x] Step: Create Message Commands
<!-- chat-id: e15c7627-3f0f-4573-8a9a-43854f0a721b -->

Create Tauri commands for messages.

**Tasks:**
1. Create `src-tauri/src/commands/messages.rs`:
   - list_messages, create_message

**File to create:**
```
src-tauri/src/commands/messages.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/messages.rs && git commit -m "feat: add message commands"`

---

### [x] Step: Create Executor Commands
<!-- chat-id: 7b5bfa4a-1dfc-4d06-ae02-1636614e71bb -->

Create Tauri commands for executor profiles.

**Tasks:**
1. Create `src-tauri/src/commands/executor.rs`:
   - list_executor_profiles, create_executor_profile, update_executor_profile, delete_executor_profile, run_executor

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

### [x] Step: Create Settings Commands
<!-- chat-id: 65106503-49f0-4801-a550-a27ec302516b -->

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

### [x] Step: Create Search Commands
<!-- chat-id: 42aa91cf-5929-4ba3-a991-daee8eac3fac -->

Create Tauri commands for search.

**Tasks:**
1. Create `src-tauri/src/commands/search.rs`:
   - search(query, project_id?, result_types?, limit?)

**File to create:**
```
src-tauri/src/commands/search.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/search.rs && git commit -m "feat: add search commands"`

---

### [x] Step: Register Commands in lib.rs
<!-- chat-id: fcf16fb0-a14a-498d-b97c-3f5f04f5accf -->

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

### [x] Step: Verify Full Rust Backend
<!-- chat-id: 9c20c0f7-61a6-4d90-8f7b-d2f95b06f70b -->

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

### [x] Step: Create Button Component
<!-- chat-id: d49c1c6d-511f-4561-aba3-aa459c5e07da -->

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

### [x] Step: Create Input Component
<!-- chat-id: f4bad305-99bf-4d95-a280-05c79aabae9c -->

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

### [x] Step: Create Textarea Component
<!-- chat-id: fccc8f9f-50e9-41bc-8b17-5bfd8f41147f -->

Create Textarea atom.

**Tasks:**
1. Create `packages/ui/atoms/Textarea.tsx`:
   - TextareaProps extending React TextareaHTMLAttributes
   - Error state styling
   - Resizable control

2. Create `packages/ui/atoms/Textarea.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/atoms/Textarea.tsx
packages/ui/atoms/Textarea.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/atoms/Textarea* && git commit -m "feat: add Textarea component"`

---

### [x] Step: Create Badge Component
<!-- chat-id: be2e7244-e66a-434b-901a-3a46b6e991a7 -->

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

### [x] Step: Create Icon and Spinner Components
<!-- chat-id: bf9cf6b7-a6e8-48b5-b00c-f5425c21bdfe -->

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

### [x] Step: Create Label and Checkbox Components
<!-- chat-id: 94848543-877b-4f25-946e-cb6cd4031e5e -->

Create form-related atom components.

**Tasks:**
1. Create `packages/ui/atoms/Label.tsx`:
   - LabelProps extending React LabelHTMLAttributes
   - Required indicator

2. Create `packages/ui/atoms/Checkbox.tsx`:
   - CheckboxProps with checked, onChange, disabled
   - Custom styling

3. Update index.ts

**Files to create:**
```
packages/ui/atoms/Label.tsx
packages/ui/atoms/Checkbox.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/atoms/ && git commit -m "feat: add Label and Checkbox components"`

---

## Phase 6: UI Molecules

**Goal:** Create composite UI components from atoms.

### [x] Step: Create FormField Component
<!-- chat-id: ebf56c39-432b-4919-8d89-e4c0f06a98d3 -->

Create FormField molecule combining Label + Input + error.

**Tasks:**
1. Create `packages/ui/molecules/FormField.tsx`:
   - FormFieldProps (label, error, required, children)
   - Composes Label + any input + error message
   - Accessibility: label htmlFor, error aria

2. Create `packages/ui/molecules/FormField.stories.tsx`

3. Update `packages/ui/molecules/index.ts`

**Files to create:**
```
packages/ui/molecules/FormField.tsx
packages/ui/molecules/FormField.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
cat packages/ui/molecules/FormField.tsx | grep "FormFieldProps"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/FormField* && git commit -m "feat: add FormField component"`

---

### [x] Step: Create Card Component
<!-- chat-id: 72963d77-5dfc-4658-a88d-ea2f22fa8b79 -->

Create Card molecule for content containers.

**Tasks:**
1. Create `packages/ui/molecules/Card.tsx`:
   - CardProps (children, className, onClick, isSelected)
   - CardHeader, CardContent, CardFooter sub-components
   - Hover and selected states

2. Create `packages/ui/molecules/Card.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/molecules/Card.tsx
packages/ui/molecules/Card.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/Card* && git commit -m "feat: add Card component"`

---

### [x] Step: Create Dropdown Component
<!-- chat-id: 75e5bf37-aa11-43fa-90bb-4002c64dc906 -->

Create Dropdown molecule for selection.

**Tasks:**
1. Create `packages/ui/molecules/Dropdown.tsx`:
   - DropdownProps (options, value, onChange, placeholder)
   - DropdownOption type { value, label, icon? }
   - Open/closed state styling
   - Keyboard navigation

2. Create `packages/ui/molecules/Dropdown.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/molecules/Dropdown.tsx
packages/ui/molecules/Dropdown.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/Dropdown* && git commit -m "feat: add Dropdown component"`

---

### [x] Step: Create Dialog Component
<!-- chat-id: 22187723-5dd8-4fa4-8ce3-e841dc54d038 -->

Create Dialog molecule for modals.

**Tasks:**
1. Create `packages/ui/molecules/Dialog.tsx`:
   - DialogProps (isOpen, onClose, title, children)
   - Backdrop with click-to-close
   - Header, content, footer sections
   - Escape key handling (via callback)

2. Create `packages/ui/molecules/Dialog.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/molecules/Dialog.tsx
packages/ui/molecules/Dialog.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/Dialog* && git commit -m "feat: add Dialog component"`

---

### [x] Step: Create Tabs Component
<!-- chat-id: 02ecd6cd-85b4-43b5-8a88-df80fed94853 -->

Create Tabs molecule for tabbed interfaces.

**Tasks:**
1. Create `packages/ui/molecules/Tabs.tsx`:
   - TabsProps (tabs, activeTab, onTabChange)
   - Tab type { id, label, icon?, badge? }
   - Active tab indicator
   - Keyboard navigation

2. Create `packages/ui/molecules/Tabs.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/molecules/Tabs.tsx
packages/ui/molecules/Tabs.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/Tabs* && git commit -m "feat: add Tabs component"`

---

### [x] Step: Create Tooltip Component
<!-- chat-id: f7a81c5e-d56e-4d2a-b998-6027afc234f9 -->

Create Tooltip molecule for hints.

**Tasks:**
1. Create `packages/ui/molecules/Tooltip.tsx`:
   - TooltipProps (content, position, children)
   - Positions: top, bottom, left, right
   - Hover trigger

2. Create `packages/ui/molecules/Tooltip.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/molecules/Tooltip.tsx
packages/ui/molecules/Tooltip.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/Tooltip* && git commit -m "feat: add Tooltip component"`

---

### [x] Step: Create Menu Component
<!-- chat-id: a99a5d86-eb1b-4df4-917c-c5043661a189 -->

Create Menu molecule for context menus.

**Tasks:**
1. Create `packages/ui/molecules/Menu.tsx`:
   - MenuProps (items, isOpen, onClose, position)
   - MenuItem type { label, icon?, onClick, divider?, disabled? }
   - Keyboard navigation
   - Click outside handling

2. Create `packages/ui/molecules/Menu.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/molecules/Menu.tsx
packages/ui/molecules/Menu.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/molecules/Menu* && git commit -m "feat: add Menu component"`

---

## Phase 7: UI Organisms

**Goal:** Create complex UI components composed of molecules and atoms.

### [x] Step: Create TaskCard Component
<!-- chat-id: e9a346bf-d972-466d-ba09-69123c488d19 -->

Create TaskCard organism for task display.

**Context:**
Pattern from spec section 8.1 - stateless UI components.

**Tasks:**
1. Create `packages/ui/organisms/TaskCard.tsx`:
   - TaskCardProps (task, isSelected?, onSelect?, onStatusChange?)
   - Display title, status badge, description preview
   - Actions required badge when count > 0
   - Status dropdown integration

2. Create `packages/ui/organisms/TaskCard.stories.tsx`

3. Update `packages/ui/organisms/index.ts`

**Files to create:**
```
packages/ui/organisms/TaskCard.tsx
packages/ui/organisms/TaskCard.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
cat packages/ui/organisms/TaskCard.tsx | grep "TaskCardProps"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/TaskCard* && git commit -m "feat: add TaskCard component"`

---

### [x] Step: Create TaskList Component
<!-- chat-id: a843e19f-1346-4a0c-b144-a5e7d1a009d6 -->

Create TaskList organism for displaying task columns.

**Tasks:**
1. Create `packages/ui/organisms/TaskList.tsx`:
   - TaskListProps (tasks, selectedTaskId?, onSelectTask?, onStatusChange?)
   - Groups tasks by status for kanban view
   - Empty state handling

2. Create `packages/ui/organisms/TaskList.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/TaskList.tsx
packages/ui/organisms/TaskList.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/TaskList* && git commit -m "feat: add TaskList component"`

---

### [x] Step: Create ProjectSelector Component
<!-- chat-id: 5043a03a-0b18-4258-b5e6-429ac89147fc -->

Create ProjectSelector organism for project switching.

**Tasks:**
1. Create `packages/ui/organisms/ProjectSelector.tsx`:
   - ProjectSelectorProps (projects, selectedProjectId, onSelectProject, onNewProject)
   - Project icons
   - New project button

2. Create `packages/ui/organisms/ProjectSelector.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/ProjectSelector.tsx
packages/ui/organisms/ProjectSelector.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/ProjectSelector* && git commit -m "feat: add ProjectSelector component"`

---

### [x] Step: Create ChatMessage Component
<!-- chat-id: a2a66abd-7dc3-42b4-9cf0-eb9f4c3f2588 -->

Create ChatMessage organism for message display.

**Tasks:**
1. Create `packages/ui/organisms/ChatMessage.tsx`:
   - ChatMessageProps (message, isStreaming?)
   - Role-based styling (user, assistant, system)
   - Markdown content rendering
   - Tool calls display
   - Timestamp

2. Create `packages/ui/organisms/ChatMessage.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/ChatMessage.tsx
packages/ui/organisms/ChatMessage.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/ChatMessage* && git commit -m "feat: add ChatMessage component"`

---

### [x] Step: Create ChatPanel Component
<!-- chat-id: 3c8ff42a-1352-4c9f-979a-0aeb6982126c -->

Create ChatPanel organism for chat interface.

**Tasks:**
1. Create `packages/ui/organisms/ChatPanel.tsx`:
   - ChatPanelProps (messages, onSendMessage, isProcessing?, executorProfile?)
   - Message list with ChatMessage
   - Input area with send button
   - Executor profile selector
   - Auto-scroll behavior

2. Create `packages/ui/organisms/ChatPanel.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/ChatPanel.tsx
packages/ui/organisms/ChatPanel.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/ChatPanel* && git commit -m "feat: add ChatPanel component"`

---

### [x] Step: Create StepsPanel Component
<!-- chat-id: 75c43076-2376-45f0-a123-6c3d4ce2fd15 -->

Create StepsPanel organism for workflow steps.

**Tasks:**
1. Create `packages/ui/organisms/StepsPanel.tsx`:
   - StepsPanelProps (steps, activeStepIndex?, onStartStep?, onAddStep?, autoStart?, onAutoStartChange?)
   - Step list with checkboxes and status
   - Start button per step
   - Add step button
   - Auto-start toggle

2. Create `packages/ui/organisms/StepsPanel.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/StepsPanel.tsx
packages/ui/organisms/StepsPanel.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/StepsPanel* && git commit -m "feat: add StepsPanel component"`

---

### [ ] Step: Create DiffViewer Component

Create DiffViewer organism for git diffs.

**Tasks:**
1. Create `packages/ui/organisms/DiffViewer.tsx`:
   - DiffViewerProps (diffs, expandedFiles?, onFileToggle?)
   - File-by-file diff display
   - Collapsible file sections
   - Line numbers
   - Add/remove highlighting

2. Create `packages/ui/organisms/DiffViewer.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/DiffViewer.tsx
packages/ui/organisms/DiffViewer.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/DiffViewer* && git commit -m "feat: add DiffViewer component"`

---

### [ ] Step: Create CommitList Component

Create CommitList organism for git history.

**Tasks:**
1. Create `packages/ui/organisms/CommitList.tsx`:
   - CommitListProps (commits, onViewCommit?)
   - Commit hash, message, author, date
   - Expandable commit details

2. Create `packages/ui/organisms/CommitList.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/CommitList.tsx
packages/ui/organisms/CommitList.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/CommitList* && git commit -m "feat: add CommitList component"`

---

### [ ] Step: Create CommandPalette Component

Create CommandPalette organism for quick search (Cmd+K).

**Tasks:**
1. Create `packages/ui/organisms/CommandPalette.tsx`:
   - CommandPaletteProps (isOpen, onClose, onSearch, searchResults?, recentItems?)
   - Search input with keyboard navigation
   - Result groups (tasks, projects, actions)
   - Recent items section

2. Create `packages/ui/organisms/CommandPalette.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/CommandPalette.tsx
packages/ui/organisms/CommandPalette.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/CommandPalette* && git commit -m "feat: add CommandPalette component"`

---

### [ ] Step: Create Sidebar Component

Create Sidebar organism for navigation.

**Tasks:**
1. Create `packages/ui/organisms/Sidebar.tsx`:
   - SidebarProps (projects, tasks, selectedProjectId, selectedTaskId, statusFilter, onSelectProject, onSelectTask, onNewTask, onStatusFilter, isCollapsed?, onToggleCollapse?)
   - Project selector
   - New task button
   - Status filter
   - Task list
   - Settings/Archive links

2. Create `packages/ui/organisms/Sidebar.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/Sidebar.tsx
packages/ui/organisms/Sidebar.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/Sidebar* && git commit -m "feat: add Sidebar component"`

---

### [ ] Step: Create Header Component

Create Header organism for top navigation.

**Tasks:**
1. Create `packages/ui/organisms/Header.tsx`:
   - HeaderProps (onSearch, onNewChat?, onNewTerminal?)
   - Search button (opens CommandPalette)
   - New chat button
   - New terminal button

2. Create `packages/ui/organisms/Header.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/organisms/Header.tsx
packages/ui/organisms/Header.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/organisms/Header* && git commit -m "feat: add Header component"`

---

## Phase 8: UI Templates

**Goal:** Create page layout templates.

### [ ] Step: Create AppLayout Template

Create main application layout template.

**Tasks:**
1. Create `packages/ui/templates/AppLayout.tsx`:
   - AppLayoutProps (sidebar, header, children)
   - Sidebar with collapsible behavior
   - Header bar
   - Main content area
   - Dark mode by default

2. Create `packages/ui/templates/AppLayout.stories.tsx`

3. Update `packages/ui/templates/index.ts`

**Files to create:**
```
packages/ui/templates/AppLayout.tsx
packages/ui/templates/AppLayout.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
cat packages/ui/templates/AppLayout.tsx | grep "AppLayoutProps"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/templates/AppLayout* && git commit -m "feat: add AppLayout template"`

---

### [ ] Step: Create TaskLayout Template

Create task detail page layout template.

**Tasks:**
1. Create `packages/ui/templates/TaskLayout.tsx`:
   - TaskLayoutProps (task, chats, stepsPanel, mainPanel, tabs, activeTab, onTabChange, onStatusChange, onTitleChange, onCreatePR)
   - Task header with title and status
   - Branch indicator
   - Tabs (Steps, Changes, Commits)
   - Split pane layout

2. Create `packages/ui/templates/TaskLayout.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/templates/TaskLayout.tsx
packages/ui/templates/TaskLayout.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/templates/TaskLayout* && git commit -m "feat: add TaskLayout template"`

---

### [ ] Step: Create SettingsLayout Template

Create settings page layout template.

**Tasks:**
1. Create `packages/ui/templates/SettingsLayout.tsx`:
   - SettingsLayoutProps (navigation, children)
   - Settings navigation sidebar
   - Content area
   - Section headers

2. Create `packages/ui/templates/SettingsLayout.stories.tsx`

3. Update index.ts

**Files to create:**
```
packages/ui/templates/SettingsLayout.tsx
packages/ui/templates/SettingsLayout.stories.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/ui/templates/SettingsLayout* && git commit -m "feat: add SettingsLayout template"`

---

## Phase 9: Routing

**Goal:** Set up TanStack Router with file-based routes.

### [ ] Step: Create Route Configuration

Create TanStack Router configuration.

**Tasks:**
1. Create `src/routes/__root.tsx`:
   - Root layout component
   - Query client provider
   - Router devtools (dev only)

2. Create `src/routerContext.ts`:
   - Router context type
   - QueryClient integration

**Files to create:**
```
src/routes/__root.tsx
src/routerContext.ts
```

**Verification:**
```bash
pnpm typecheck
cat src/routes/__root.tsx | grep "createRootRoute"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/routes/ src/routerContext.ts && git commit -m "feat: add TanStack Router root configuration"`

---

### [ ] Step: Create Index Route (Dashboard)

Create home page route.

**Tasks:**
1. Create `src/routes/index.tsx`:
   - Dashboard/home page
   - Recent tasks
   - Project overview
   - Quick actions

**Files to create:**
```
src/routes/index.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/routes/index.tsx && git commit -m "feat: add dashboard route"`

---

### [ ] Step: Create Projects Routes

Create project-related routes.

**Tasks:**
1. Create `src/routes/projects.tsx`:
   - Projects list page
   - Create project button

2. Create `src/routes/projects.$projectId.tsx`:
   - Project detail page
   - Task board for project

**Files to create:**
```
src/routes/projects.tsx
src/routes/projects.$projectId.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/routes/projects* && git commit -m "feat: add project routes"`

---

### [ ] Step: Create Tasks Routes

Create task-related routes.

**Tasks:**
1. Create `src/routes/tasks.tsx`:
   - Task board layout
   - Status columns

2. Create `src/routes/tasks.$taskId.tsx`:
   - Task detail page with tabs
   - Steps, Changes, Commits tabs
   - Chat interface

**Files to create:**
```
src/routes/tasks.tsx
src/routes/tasks.$taskId.tsx
```

**Code pattern (from spec 8.2):**
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { TaskLayout } from '@openflow/ui';
import { useTask, useUpdateTask, useChats } from '@openflow/hooks';

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const { data: task, isLoading } = useTask(taskId);
  // ... orchestration logic
}
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/routes/tasks* && git commit -m "feat: add task routes"`

---

### [ ] Step: Create Settings Routes

Create settings-related routes.

**Tasks:**
1. Create `src/routes/settings.tsx`:
   - Settings layout

2. Create `src/routes/settings.profiles.tsx`:
   - Executor profiles management

3. Create `src/routes/settings.projects.tsx`:
   - Project settings

**Files to create:**
```
src/routes/settings.tsx
src/routes/settings.profiles.tsx
src/routes/settings.projects.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/routes/settings* && git commit -m "feat: add settings routes"`

---

### [ ] Step: Create Archive Route

Create archive page route.

**Tasks:**
1. Create `src/routes/archive.tsx`:
   - Archived tasks list
   - Restore functionality

**Files to create:**
```
src/routes/archive.tsx
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/routes/archive.tsx && git commit -m "feat: add archive route"`

---

### [ ] Step: Update main.tsx with Router

Update main.tsx to use TanStack Router.

**Tasks:**
1. Update `src/main.tsx`:
   - Import router
   - Wrap app with RouterProvider
   - Add QueryClientProvider

**Update file:**
```
src/main.tsx
```

**Verification:**
```bash
pnpm typecheck
pnpm dev  # Should start without errors
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src/main.tsx && git commit -m "feat: integrate TanStack Router"`

---

## Phase 10: Storybook Setup

**Goal:** Set up Storybook for component development.

### [ ] Step: Create Storybook Configuration

Create Storybook main configuration.

**Tasks:**
1. Create `.storybook/main.ts`:
   - Stories glob pattern
   - Addons configuration
   - Framework: @storybook/react-vite
   - Vite config reference

2. Create `.storybook/preview.ts`:
   - Global decorators
   - Dark theme default
   - Viewport configuration

**Files to create:**
```
.storybook/main.ts
.storybook/preview.ts
```

**Verification:**
```bash
pnpm storybook  # Should launch Storybook
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add .storybook/ && git commit -m "feat: add Storybook configuration"`

---

### [ ] Step: Add Storybook Dependencies

Add Storybook packages to package.json.

**Tasks:**
1. Update `package.json` devDependencies:
   - @storybook/react: ^8.4.0
   - @storybook/react-vite: ^8.4.0
   - @storybook/addon-essentials: ^8.4.0
   - @storybook/addon-interactions: ^8.4.0
   - @storybook/addon-a11y: ^8.4.0
   - storybook: ^8.4.0

2. Add scripts:
   - "storybook": "storybook dev -p 6006"
   - "build-storybook": "storybook build"

**Update file:**
```
package.json
```

**Verification:**
```bash
pnpm install
pnpm storybook
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add package.json pnpm-lock.yaml && git commit -m "chore: add Storybook dependencies"`

---

## Phase 11: Architecture Validation

**Goal:** Create architecture validation script.

### [ ] Step: Create Architecture Validation Script

Create script to enforce dependency hierarchy.

**Context:**
Enforces rules from spec section 2.3 and 7.3.

**Tasks:**
1. Create `scripts/validate-architecture.ts`:
   - Define RULES array with pattern and forbidden imports
   - Validate UI cannot import hooks/queries
   - Validate queries cannot import hooks
   - Validate packages cannot import from src/
   - Return exit code 1 on failure

2. Add script to package.json: "validate:arch": "tsx scripts/validate-architecture.ts"

**Files to create:**
```
scripts/validate-architecture.ts
```

**Verification:**
```bash
pnpm validate:arch
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add scripts/validate-architecture.ts package.json && git commit -m "feat: add architecture validation script"`

---

## Phase 12: Git Hooks

**Goal:** Set up Husky and lint-staged for pre-commit and pre-push.

### [ ] Step: Create Husky Configuration

Set up Husky for git hooks.

**Tasks:**
1. Initialize Husky: `pnpm exec husky init`

2. Create `.husky/pre-commit`:
   - Run lint-staged

3. Create `.husky/pre-push`:
   - Run full validation suite from spec 7.2

**Files to create:**
```
.husky/pre-commit
.husky/pre-push
```

**Verification:**
```bash
git add . && git commit -m "test"  # Should trigger pre-commit
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add .husky/ && git commit -m "feat: add Husky git hooks"`

---

## Phase 13: Process Execution

**Goal:** Implement process spawning and PTY management.

### [ ] Step: Create Process Module Structure

Create process management module structure.

**Tasks:**
1. Create `src-tauri/src/process/mod.rs`:
   - Declare submodules: pty, spawn, output
   - Re-export public types

**File to create:**
```
src-tauri/src/process/mod.rs
```

**Verification:**
```bash
cat src-tauri/src/process/mod.rs | grep "pub mod"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/process/ && git commit -m "feat: add process module structure"`

---

### [ ] Step: Create Process Spawn Module

Create process spawning functionality.

**Tasks:**
1. Create `src-tauri/src/process/spawn.rs`:
   - spawn_process(command, args, cwd, env) -> Result<Child>
   - Handle stdin/stdout/stderr pipes
   - Track PID

**File to create:**
```
src-tauri/src/process/spawn.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/process/spawn.rs && git commit -m "feat: add process spawning"`

---

### [ ] Step: Create PTY Module

Create PTY management for interactive processes.

**Tasks:**
1. Add portable-pty to Cargo.toml dependencies

2. Create `src-tauri/src/process/pty.rs`:
   - create_pty(command, args, cwd, env) -> Result<PtyPair>
   - Handle interactive mode
   - Window resize support

**File to create:**
```
src-tauri/src/process/pty.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/process/pty.rs src-tauri/Cargo.toml && git commit -m "feat: add PTY support"`

---

### [ ] Step: Create Output Streaming Module

Create output streaming with Tauri events.

**Tasks:**
1. Create `src-tauri/src/process/output.rs`:
   - stream_output(process_id, reader, output_type, app_handle)
   - Emit ProcessOutputEvent via Tauri events
   - Buffer management

**File to create:**
```
src-tauri/src/process/output.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/process/output.rs && git commit -m "feat: add output streaming"`

---

### [ ] Step: Create ProcessService

Create process management service.

**Tasks:**
1. Create `src-tauri/src/services/process_service.rs`:
   - start_process(pool, chat_id, executor_profile, prompt) -> Result<ExecutionProcess>
   - kill_process(pool, id) -> Result<ExecutionProcess>
   - send_input(id, input) -> Result<()>
   - Track running processes

**File to create:**
```
src-tauri/src/services/process_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test process
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/process_service.rs && git commit -m "feat: add ProcessService"`

---

### [ ] Step: Create Process Commands

Create Tauri commands for process management.

**Tasks:**
1. Create `src-tauri/src/commands/processes.rs`:
   - get_process, kill_process, send_input
   - Event emission for status changes

**File to create:**
```
src-tauri/src/commands/processes.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/processes.rs && git commit -m "feat: add process commands"`

---

## Phase 14: Git Integration

**Goal:** Implement git worktree management.

### [ ] Step: Create GitService

Create git operations service.

**Context:**
Git worktree conventions from spec section 13.

**Tasks:**
1. Create `src-tauri/src/services/git_service.rs`:
   - create_worktree(repo_path, branch_name, base_branch, worktree_path) -> Result<String>
   - delete_worktree(repo_path, worktree_path) -> Result<()>
   - get_diff(worktree_path) -> Result<Vec<FileDiff>>
   - get_commits(worktree_path, limit?) -> Result<Vec<Commit>>
   - push_branch(worktree_path, remote?) -> Result<()>
   - Branch naming: openflow/{task_id}/{chat_role}

**File to create:**
```
src-tauri/src/services/git_service.rs
```

**Verification:**
```bash
cd src-tauri && cargo test git
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/services/git_service.rs && git commit -m "feat: add GitService with worktree management"`

---

### [ ] Step: Create Git Commands

Create Tauri commands for git operations.

**Tasks:**
1. Create `src-tauri/src/commands/git.rs`:
   - create_worktree, delete_worktree
   - get_diff, get_commits
   - push_branch

**File to create:**
```
src-tauri/src/commands/git.rs
```

**Verification:**
```bash
cd src-tauri && cargo check
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/src/commands/git.rs && git commit -m "feat: add git commands"`

---

### [ ] Step: Register Git and Process Commands

Update lib.rs to register new commands.

**Tasks:**
1. Update `src-tauri/src/lib.rs`:
   - Import process and git modules
   - Register all new commands

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
- Commit: `git add src-tauri/src/lib.rs && git commit -m "feat: register git and process commands"`

---

## Phase 15: Workflow System

**Goal:** Implement workflow parsing and execution.

### [ ] Step: Create Built-in Workflows

Create built-in workflow templates.

**Tasks:**
1. Create `src-tauri/workflows/feature.md`:
   - Requirements → Spec → Planning → Implementation

2. Create `src-tauri/workflows/bugfix.md`:
   - Reproduce → Root Cause → Fix → Verify

3. Create `src-tauri/workflows/refactor.md`:
   - Analysis → Planning → Implementation → Verification

**Files to create:**
```
src-tauri/workflows/feature.md
src-tauri/workflows/bugfix.md
src-tauri/workflows/refactor.md
```

**Verification:**
```bash
cat src-tauri/workflows/feature.md | grep "### \[ \] Step:"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add src-tauri/workflows/ && git commit -m "feat: add built-in workflow templates"`

---

### [ ] Step: Integrate Workflow Parsing in Frontend

Add workflow parsing utilities to frontend.

**Tasks:**
1. Update `packages/utils/markdown.ts`:
   - Enhanced parseWorkflowSteps() function
   - Variable substitution support

2. Create `packages/hooks/useWorkflows.ts`:
   - useWorkflowTemplates(projectId)
   - useParseWorkflow(content)

**Update files:**
```
packages/utils/markdown.ts
packages/hooks/useWorkflows.ts
```

**Verification:**
```bash
pnpm typecheck
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add packages/utils/markdown.ts packages/hooks/useWorkflows.ts && git commit -m "feat: add workflow parsing to frontend"`

---

## Phase 16: Final Integration

**Goal:** Complete end-to-end integration and testing.

### [ ] Step: Create E2E Test Setup

Set up end-to-end testing with Vitest.

**Tasks:**
1. Create `tests/e2e/setup.ts`:
   - Test database setup
   - Mock Tauri invoke

2. Create `tests/e2e/project.test.ts`:
   - Project CRUD tests

3. Create `tests/e2e/task.test.ts`:
   - Task CRUD tests

**Files to create:**
```
tests/e2e/setup.ts
tests/e2e/project.test.ts
tests/e2e/task.test.ts
```

**Verification:**
```bash
pnpm test
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add tests/ && git commit -m "feat: add E2E test setup"`

---

### [ ] Step: Verify Full Application

Run complete verification suite.

**Tasks:**
1. Run all verification commands:
   - pnpm install
   - pnpm generate:types
   - pnpm typecheck
   - pnpm lint
   - pnpm test
   - pnpm validate:arch
   - cd src-tauri && cargo check
   - cd src-tauri && cargo test
   - cd src-tauri && cargo clippy -- -D warnings

2. Launch application:
   - pnpm tauri dev

**Verification:**
```bash
pnpm install && pnpm generate:types && pnpm typecheck && pnpm lint && pnpm test && pnpm validate:arch
cd src-tauri && cargo check && cargo test && cargo clippy -- -D warnings
pnpm tauri dev
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git commit -m "chore: verify full application builds and runs"`

---

## Phase 17: CI Pipeline

**Goal:** Set up GitHub Actions CI/CD.

### [ ] Step: Create CI Workflow

Create GitHub Actions workflow.

**Context:**
CI pipeline from spec section 7.4.

**Tasks:**
1. Create `.github/workflows/ci.yml`:
   - Trigger on push to main, PRs to main
   - Install Rust, pnpm, Node.js
   - Cache dependencies
   - Run all verification steps
   - Upload test results

**File to create:**
```
.github/workflows/ci.yml
```

**Verification:**
```bash
cat .github/workflows/ci.yml | grep "runs-on"
```

**After completion:**
- Edit this plan.md: Change `[ ]` to `[x]` for this step
- Commit: `git add .github/workflows/ && git commit -m "feat: add CI pipeline"`

---


### [ ] Step: test pre commit and pre push

### [ ] Step: remove .zenflow/tasks/* from git as shown in git ignore

### [ ] Step: create pull request template, and pull request using gh cli
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

---

## Summary

This plan contains **93 implementation steps** across **18 phases**:

| Phase | Name | Steps |
|-------|------|-------|
| 0 | Project Bootstrap | 10 |
| 1 | Tauri Backend Foundation | 5 |
| 1B | Frontend Package Structure | 16 |
| 2 | Rust Types and Database | 12 |
| 3 | Rust Services (TDD) | 10 |
| 4 | Tauri Commands | 10 |
| 5 | UI Atoms | 6 |
| 6 | UI Molecules | 7 |
| 7 | UI Organisms | 10 |
| 8 | UI Templates | 3 |
| 9 | Routing | 7 |
| 10 | Storybook Setup | 2 |
| 11 | Architecture Validation | 1 |
| 12 | Git Hooks | 1 |
| 13 | Process Execution | 5 |
| 14 | Git Integration | 3 |
| 15 | Workflow System | 2 |
| 16 | Final Integration | 2 |
| 17 | CI Pipeline | 1 |

Each step is designed to be completable by a single AI agent in one session without context compaction.
