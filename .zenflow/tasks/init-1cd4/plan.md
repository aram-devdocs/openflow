# OpenFlow Implementation Plan

> AI Task Orchestration App - Tauri + Rust + React/TypeScript

## Reference Documents
- **Requirements**: `.zenflow/tasks/init-1cd4/requirements.md`
- **Technical Spec**: `.zenflow/tasks/init-1cd4/spec.md`

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
Implementation plan created with 39 steps across 7 phases.

---

## Phase 1: Foundation (Core Infrastructure)

**Goal:** Working Tauri app with type-safe IPC and database.

### [ ] Step: Project Initialization

Initialize the Tauri project with React frontend and pnpm workspace.

**Tasks:**
1. Create `.gitignore` with standard exclusions (node_modules, dist, target, etc.)
2. Initialize pnpm workspace with `pnpm-workspace.yaml`
3. Create root `package.json` with workspace scripts
4. Scaffold Tauri 2.x structure manually
5. Configure Vite with React + TypeScript
6. Create `index.html` and `src/main.tsx` entry points

**Files to create:**
- `.gitignore`
- `pnpm-workspace.yaml`
- `package.json`
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/build.rs`
- `src-tauri/src/main.rs`
- `src-tauri/src/lib.rs`

**Verification:**
- `pnpm install` completes successfully
- `pnpm tauri dev` launches empty app window

### [ ] Step: TypeScript & Biome Configuration

Set up strict TypeScript and Biome for linting/formatting.

**Tasks:**
1. Create `tsconfig.json` with strict mode and path aliases
2. Create `biome.json` with recommended rules
3. Add lint/format scripts to `package.json`

**Files to create:**
- `tsconfig.json`
- `biome.json`

**Verification:**
- `pnpm lint` runs without errors
- `pnpm typecheck` passes

### [ ] Step: Package Structure Setup

Create the pnpm workspace package structure for frontend code.

**Tasks:**
1. Create `packages/generated/` with package.json and placeholder types
2. Create `packages/utils/` with cn.ts utility
3. Create `packages/validation/` with package.json
4. Create `packages/queries/` with package.json
5. Create `packages/hooks/` with package.json
6. Create `packages/ui/` with atomic design structure
7. Update root tsconfig to include all packages

**Files to create:**
- `packages/generated/package.json`
- `packages/generated/index.ts`
- `packages/generated/types.ts` (placeholder)
- `packages/utils/package.json`
- `packages/utils/index.ts`
- `packages/utils/cn.ts`
- `packages/validation/package.json`
- `packages/validation/index.ts`
- `packages/queries/package.json`
- `packages/queries/index.ts`
- `packages/hooks/package.json`
- `packages/hooks/index.ts`
- `packages/ui/package.json`
- `packages/ui/index.ts`
- `packages/ui/atoms/index.ts`
- `packages/ui/molecules/index.ts`
- `packages/ui/organisms/index.ts`
- `packages/ui/templates/index.ts`

**Verification:**
- `pnpm install` resolves workspace packages
- Imports between packages work correctly

### [ ] Step: Rust Types with TypeShare

Define core Rust types with `#[typeshare]` and set up generation script.

**Tasks:**
1. Add typeshare dependency to `Cargo.toml`
2. Create `src-tauri/src/types/mod.rs` with all type modules
3. Create `src-tauri/src/types/project.rs` with Project types
4. Create `src-tauri/src/types/task.rs` with Task types
5. Create `src-tauri/src/types/chat.rs` with Chat types
6. Create `src-tauri/src/types/message.rs` with Message types
7. Create `src-tauri/src/types/process.rs` with Process types
8. Create `src-tauri/src/types/executor.rs` with ExecutorProfile types
9. Create `scripts/generate-types.sh`
10. Add `generate:types` script to package.json

**Files to create:**
- `src-tauri/src/types/mod.rs`
- `src-tauri/src/types/project.rs`
- `src-tauri/src/types/task.rs`
- `src-tauri/src/types/chat.rs`
- `src-tauri/src/types/message.rs`
- `src-tauri/src/types/process.rs`
- `src-tauri/src/types/executor.rs`
- `scripts/generate-types.sh`

**Verification:**
- `cargo check` passes
- `pnpm generate:types` produces valid TypeScript in `packages/generated/types.ts`

### [ ] Step: SQLite Database Setup

Set up SQLite with SQLx and initial migrations.

**Tasks:**
1. Add sqlx dependencies to `Cargo.toml`
2. Create `src-tauri/src/db/mod.rs` with database pool setup
3. Create `src-tauri/src/db/pool.rs` with connection management
4. Create initial migration `001_initial.sql` with all tables
5. Configure SQLx for compile-time checking

**Files to create:**
- `src-tauri/src/db/mod.rs`
- `src-tauri/src/db/pool.rs`
- `src-tauri/migrations/001_initial.sql`

**Verification:**
- Database file creates on app start
- Tables exist after migration

### [ ] Step: Rust Services Layer

Implement business logic services for CRUD operations.

**Tasks:**
1. Create `src-tauri/src/services/mod.rs`
2. Create `src-tauri/src/services/project_service.rs` (CRUD)
3. Create `src-tauri/src/services/task_service.rs` (CRUD)
4. Create `src-tauri/src/services/executor_profile_service.rs` (CRUD)
5. Create `src-tauri/src/services/settings_service.rs`

**Files to create:**
- `src-tauri/src/services/mod.rs`
- `src-tauri/src/services/project_service.rs`
- `src-tauri/src/services/task_service.rs`
- `src-tauri/src/services/executor_profile_service.rs`
- `src-tauri/src/services/settings_service.rs`

**Verification:**
- `cargo check` passes
- `cargo test` passes for service unit tests

### [ ] Step: Tauri Commands

Create Tauri commands for frontend-backend communication.

**Tasks:**
1. Create AppState struct for shared state
2. Create `src-tauri/src/commands/mod.rs`
3. Create `src-tauri/src/commands/projects.rs` (list, get, create, update, delete)
4. Create `src-tauri/src/commands/tasks.rs` (list, get, create, update, archive, delete)
5. Create `src-tauri/src/commands/executor.rs` (list, create, update, delete)
6. Create `src-tauri/src/commands/settings.rs` (get, set, get_all)
7. Register all commands in `lib.rs`
8. Update `main.rs` with app state initialization

**Files to create:**
- `src-tauri/src/commands/mod.rs`
- `src-tauri/src/commands/projects.rs`
- `src-tauri/src/commands/tasks.rs`
- `src-tauri/src/commands/executor.rs`
- `src-tauri/src/commands/settings.rs`

**Verification:**
- `cargo check` passes
- App launches without errors
- Commands respond to frontend invocations

### [ ] Step: Git Hooks Setup

Configure Husky and lint-staged for pre-commit checks.

**Tasks:**
1. Install husky and lint-staged
2. Create `.husky/pre-commit` hook
3. Add lint-staged configuration to package.json
4. Test hook triggers on commit

**Files to create:**
- `.husky/pre-commit`

**Verification:**
- Committing triggers lint-staged
- Malformed code fails pre-commit

---

## Phase 2: UI Foundation

**Goal:** Stateless UI component library with Storybook.

### [ ] Step: Tailwind CSS Setup

Configure Tailwind CSS with dark theme support.

**Tasks:**
1. Install Tailwind and dependencies
2. Create `tailwind.config.js` with dark mode and design tokens
3. Create `src/styles/globals.css` with Tailwind directives
4. Import globals.css in main.tsx

**Files to create:**
- `tailwind.config.js`
- `postcss.config.js`
- `src/styles/globals.css`

**Verification:**
- Tailwind classes apply correctly
- Dark mode toggle works

### [ ] Step: Storybook Setup

Set up Storybook for isolated component development.

**Tasks:**
1. Install Storybook 8.4+
2. Create `.storybook/main.ts` configuration
3. Create `.storybook/preview.ts` with global decorators
4. Add storybook scripts to package.json

**Files to create:**
- `.storybook/main.ts`
- `.storybook/preview.ts`

**Verification:**
- `pnpm storybook` launches Storybook
- Tailwind styles work in Storybook

### [ ] Step: Atom Components

Create foundational atomic UI components.

**Tasks:**
1. Create `packages/ui/atoms/Button.tsx` with variants
2. Create `packages/ui/atoms/Input.tsx`
3. Create `packages/ui/atoms/Badge.tsx` with status variants
4. Create `packages/ui/atoms/Icon.tsx` (using Lucide icons)
5. Create `packages/ui/atoms/Spinner.tsx`
6. Create stories for each atom

**Files to create:**
- `packages/ui/atoms/Button.tsx`
- `packages/ui/atoms/Button.stories.tsx`
- `packages/ui/atoms/Input.tsx`
- `packages/ui/atoms/Input.stories.tsx`
- `packages/ui/atoms/Badge.tsx`
- `packages/ui/atoms/Badge.stories.tsx`
- `packages/ui/atoms/Icon.tsx`
- `packages/ui/atoms/Spinner.tsx`

**Verification:**
- All atoms render in Storybook
- No hooks or data fetching in atom components

### [ ] Step: Molecule Components

Create molecule components (combinations of atoms).

**Tasks:**
1. Create `packages/ui/molecules/FormField.tsx`
2. Create `packages/ui/molecules/Card.tsx`
3. Create `packages/ui/molecules/Dropdown.tsx`
4. Create `packages/ui/molecules/Dialog.tsx`
5. Create `packages/ui/molecules/Tabs.tsx`
6. Create stories for each molecule

**Files to create:**
- `packages/ui/molecules/FormField.tsx`
- `packages/ui/molecules/Card.tsx`
- `packages/ui/molecules/Dropdown.tsx`
- `packages/ui/molecules/Dialog.tsx`
- `packages/ui/molecules/Tabs.tsx`
- Stories for each

**Verification:**
- All molecules render in Storybook
- Molecules only use atoms and primitives

### [ ] Step: Organism Components

Create organism components for domain-specific UI.

**Tasks:**
1. Create `packages/ui/organisms/TaskCard.tsx`
2. Create `packages/ui/organisms/TaskList.tsx`
3. Create `packages/ui/organisms/ProjectSelector.tsx`
4. Create stories for each organism

**Files to create:**
- `packages/ui/organisms/TaskCard.tsx`
- `packages/ui/organisms/TaskCard.stories.tsx`
- `packages/ui/organisms/TaskList.tsx`
- `packages/ui/organisms/TaskList.stories.tsx`
- `packages/ui/organisms/ProjectSelector.tsx`
- `packages/ui/organisms/ProjectSelector.stories.tsx`

**Verification:**
- Organisms render with mock data in Storybook
- No invoke() calls or hooks in organisms

### [ ] Step: Template Components

Create layout templates for pages.

**Tasks:**
1. Create `packages/ui/templates/AppLayout.tsx` (sidebar + main)
2. Create `packages/ui/templates/TaskLayout.tsx` (task detail view)
3. Create stories for templates

**Files to create:**
- `packages/ui/templates/AppLayout.tsx`
- `packages/ui/templates/TaskLayout.tsx`

**Verification:**
- Templates render in Storybook
- Layouts accept children as slots

### [ ] Step: Architecture Validation Script

Create script to enforce dependency hierarchy.

**Tasks:**
1. Create `scripts/validate-architecture.ts`
2. Add `validate:arch` script to package.json
3. Add to pre-push hook

**Files to create:**
- `scripts/validate-architecture.ts`

**Verification:**
- `pnpm validate:arch` passes
- Violating imports fail validation

---

## Phase 3: Task Management

**Goal:** Full task board with kanban and routing.

### [ ] Step: Query Layer

Create Tauri invoke wrappers for all entities.

**Tasks:**
1. Create `packages/queries/projects.ts`
2. Create `packages/queries/tasks.ts`
3. Create `packages/queries/executor-profiles.ts`
4. Create `packages/queries/settings.ts`

**Files to create:**
- `packages/queries/projects.ts`
- `packages/queries/tasks.ts`
- `packages/queries/executor-profiles.ts`
- `packages/queries/settings.ts`

**Verification:**
- TypeScript compiles without errors
- Invoke calls match Tauri command signatures

### [ ] Step: Hooks Layer

Create TanStack Query hooks for data fetching.

**Tasks:**
1. Set up QueryClient provider in main.tsx
2. Create `packages/hooks/useProjects.ts`
3. Create `packages/hooks/useTasks.ts`
4. Create `packages/hooks/useExecutorProfiles.ts`
5. Create `packages/hooks/useSettings.ts`

**Files to create:**
- `packages/hooks/useProjects.ts`
- `packages/hooks/useTasks.ts`
- `packages/hooks/useExecutorProfiles.ts`
- `packages/hooks/useSettings.ts`

**Verification:**
- Hooks work with TanStack Query
- Query invalidation works on mutations

### [ ] Step: TanStack Router Setup

Configure file-based routing with TanStack Router.

**Tasks:**
1. Install TanStack Router
2. Create `src/routes/__root.tsx` with QueryClientProvider
3. Create `src/routes/index.tsx` (home/dashboard)
4. Create `src/routeTree.gen.ts` (auto-generated)
5. Update `src/main.tsx` with router setup

**Files to create:**
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/main.tsx` (update)

**Verification:**
- App renders with router
- Navigation works

### [ ] Step: Project List Page

Create project list and management page.

**Tasks:**
1. Create `src/routes/projects.tsx` (list view)
2. Create `src/routes/projects.$projectId.tsx` (detail view)
3. Add project creation dialog

**Files to create:**
- `src/routes/projects.tsx`
- `src/routes/projects.$projectId.tsx`

**Verification:**
- Projects list renders
- Can create and view projects

### [ ] Step: Task Board Page

Create task board with kanban columns.

**Tasks:**
1. Create `packages/ui/organisms/TaskBoard.tsx` (kanban layout)
2. Create `src/routes/tasks.tsx` (board view)
3. Create task status columns (Todo, In Progress, In Review, Done)
4. Add task creation dialog

**Files to create:**
- `packages/ui/organisms/TaskBoard.tsx`
- `src/routes/tasks.tsx`

**Verification:**
- Task board renders with columns
- Tasks display in correct columns
- Can create new tasks

### [ ] Step: Task Detail Page

Create task detail page with tabs.

**Tasks:**
1. Create `src/routes/tasks.$taskId.tsx`
2. Add tabs: Steps, Changes, Commits, Terminal
3. Wire up task updates

**Files to create:**
- `src/routes/tasks.$taskId.tsx`

**Verification:**
- Task detail renders
- Tabs switch correctly
- Task updates persist

### [ ] Step: Zod Validation Schemas

Create Zod schemas for form validation.

**Tasks:**
1. Create `packages/validation/schemas.ts`
2. Add schemas for CreateProjectRequest, CreateTaskRequest, etc.
3. Integrate with form components

**Files to create:**
- `packages/validation/schemas.ts`

**Verification:**
- Form validation works
- Invalid data shows errors

---

## Phase 4: Chat & Workflow System

**Goal:** Workflow parsing and chat interface.

### [ ] Step: Chat Services & Commands

Implement chat backend in Rust.

**Tasks:**
1. Create `src-tauri/src/services/chat_service.rs`
2. Create `src-tauri/src/services/message_service.rs`
3. Create `src-tauri/src/commands/chats.rs`
4. Create `src-tauri/src/commands/messages.rs`
5. Add migration for messages table (if not in 001)

**Files to create:**
- `src-tauri/src/services/chat_service.rs`
- `src-tauri/src/services/message_service.rs`
- `src-tauri/src/commands/chats.rs`
- `src-tauri/src/commands/messages.rs`

**Verification:**
- Chat CRUD works via Tauri commands
- Messages persist and retrieve

### [ ] Step: Workflow Parser

Create markdown workflow parser.

**Tasks:**
1. Create `src-tauri/src/types/workflow.rs`
2. Create `src-tauri/src/services/workflow_service.rs`
3. Parse workflow markdown into structured steps
4. Create built-in workflow templates (Feature, Bug Fix, Refactor)

**Files to create:**
- `src-tauri/src/types/workflow.rs`
- `src-tauri/src/services/workflow_service.rs`

**Verification:**
- Workflows parse correctly from markdown
- Built-in templates load

### [ ] Step: Chat Panel UI

Create chat interface components.

**Tasks:**
1. Create `packages/ui/organisms/ChatMessage.tsx`
2. Create `packages/ui/organisms/ChatPanel.tsx`
3. Create `packages/hooks/useChats.ts`
4. Create `packages/hooks/useMessages.ts`
5. Create `packages/queries/chats.ts`
6. Create `packages/queries/messages.ts`

**Files to create:**
- `packages/ui/organisms/ChatMessage.tsx`
- `packages/ui/organisms/ChatPanel.tsx`
- `packages/hooks/useChats.ts`
- `packages/hooks/useMessages.ts`
- `packages/queries/chats.ts`
- `packages/queries/messages.ts`

**Verification:**
- Chat panel renders messages
- Messages scroll correctly

### [ ] Step: Steps Panel UI

Create workflow steps panel.

**Tasks:**
1. Create `packages/ui/organisms/StepsPanel.tsx`
2. Display workflow steps with status indicators
3. Allow step selection and start trigger

**Files to create:**
- `packages/ui/organisms/StepsPanel.tsx`

**Verification:**
- Steps panel shows workflow steps
- Steps can be selected
- Current step highlighted

---

## Phase 5: Process Execution

**Goal:** Spawn and manage CLI tool processes.

### [ ] Step: Process Manager Core

Implement process spawning and management in Rust.

**Tasks:**
1. Create `src-tauri/src/process/mod.rs`
2. Create `src-tauri/src/process/spawn.rs`
3. Create `src-tauri/src/process/output.rs`
4. Create `src-tauri/src/services/process_service.rs`
5. Create `src-tauri/src/commands/processes.rs`

**Files to create:**
- `src-tauri/src/process/mod.rs`
- `src-tauri/src/process/spawn.rs`
- `src-tauri/src/process/output.rs`
- `src-tauri/src/services/process_service.rs`
- `src-tauri/src/commands/processes.rs`

**Verification:**
- Processes spawn correctly
- Exit codes captured

### [ ] Step: PTY Support

Add pseudo-terminal support for interactive processes.

**Tasks:**
1. Add `portable-pty` dependency
2. Create `src-tauri/src/process/pty.rs`
3. Handle PTY input/output streaming
4. Support interactive CLI tools

**Files to create:**
- `src-tauri/src/process/pty.rs`

**Verification:**
- Interactive processes work
- Terminal input/output streams

### [ ] Step: Tauri Event Streaming

Stream process output to frontend via Tauri events.

**Tasks:**
1. Define event types (ProcessOutputEvent, ProcessStatusEvent)
2. Emit events from process manager
3. Create `packages/hooks/useProcessOutput.ts`
4. Subscribe to events in frontend

**Files to create:**
- `packages/hooks/useProcessOutput.ts`
- `packages/hooks/useProcessStatus.ts`

**Verification:**
- Output streams to frontend in real-time
- Status changes emit events

### [ ] Step: Process Output Display

Display process output in chat panel.

**Tasks:**
1. Create `packages/ui/organisms/ProcessOutput.tsx`
2. Create `packages/ui/organisms/TerminalPanel.tsx`
3. Add terminal tab to task detail page
4. Style output with ANSI color support

**Files to create:**
- `packages/ui/organisms/ProcessOutput.tsx`
- `packages/ui/organisms/TerminalPanel.tsx`

**Verification:**
- Output displays in real-time
- ANSI colors render correctly

### [ ] Step: Executor Integration

Connect executor profiles to process spawning.

**Tasks:**
1. Create `src-tauri/src/services/executor_service.rs`
2. Build command from executor profile + prompt
3. Create `packages/hooks/useRunExecutor.ts`
4. Add "Run" button to chat panel

**Files to create:**
- `src-tauri/src/services/executor_service.rs`
- `packages/hooks/useRunExecutor.ts`

**Verification:**
- Executor profiles spawn correct CLI tool
- Process runs with configured args/env

---

## Phase 6: Git Integration

**Goal:** Full git worktree lifecycle management.

### [ ] Step: Git Service

Implement git operations in Rust.

**Tasks:**
1. Create `src-tauri/src/services/git_service.rs`
2. Implement worktree create/delete
3. Implement branch operations
4. Implement diff generation
5. Implement commit log retrieval

**Files to create:**
- `src-tauri/src/services/git_service.rs`

**Verification:**
- Git operations work via service
- Worktrees create in correct location

### [ ] Step: Git Commands

Create Tauri commands for git operations.

**Tasks:**
1. Create `src-tauri/src/commands/git.rs`
2. Implement create_worktree, delete_worktree
3. Implement get_diff, get_commits
4. Implement push_branch

**Files to create:**
- `src-tauri/src/commands/git.rs`

**Verification:**
- Commands callable from frontend
- Worktrees create/delete correctly

### [ ] Step: Diff Viewer Component

Create diff viewer UI.

**Tasks:**
1. Create `packages/ui/organisms/DiffViewer.tsx`
2. Support unified diff display
3. Syntax highlighting for code
4. File tree navigation

**Files to create:**
- `packages/ui/organisms/DiffViewer.tsx`

**Verification:**
- Diffs display correctly
- Syntax highlighting works

### [ ] Step: Commit List Component

Create commit history UI.

**Tasks:**
1. Create `packages/ui/organisms/CommitList.tsx`
2. Create `packages/hooks/useCommits.ts`
3. Create `packages/queries/git.ts`

**Files to create:**
- `packages/ui/organisms/CommitList.tsx`
- `packages/hooks/useCommits.ts`
- `packages/queries/git.ts`

**Verification:**
- Commit list renders
- Can view commit details

### [ ] Step: Changes Tab Integration

Integrate git components into task detail.

**Tasks:**
1. Add DiffViewer to Changes tab
2. Add CommitList to Commits tab
3. Wire up worktree creation on task start

**Verification:**
- Changes tab shows diffs
- Commits tab shows history
- Worktree creates on task start

---

## Phase 7: Multi-Agent & Verification

**Goal:** Complete agent orchestration and verification.

### [ ] Step: Multiple Chat Roles

Support multiple agents per task.

**Tasks:**
1. Add chat role support (main, review, test, terminal)
2. Create chat for each workflow step
3. Allow switching between chats

**Verification:**
- Multiple chats per task work
- Chat roles display correctly

### [ ] Step: Verification Commands

Run verification (test, lint) commands.

**Tasks:**
1. Add verification_config to projects
2. Create verification run logic in process service
3. Display verification results in UI

**Verification:**
- Verification commands run
- Results display correctly

### [ ] Step: Auto-Start Next Step

Implement auto-start workflow progression.

**Tasks:**
1. Add auto_start_next_step logic
2. Chain workflow steps automatically
3. UI indicator for auto-start mode

**Verification:**
- Steps auto-start when enabled
- Can disable auto-start

### [ ] Step: Action Required State

Track and display action required count.

**Tasks:**
1. Increment/decrement actions_required_count
2. Display badge on task cards
3. Filter tasks by action required

**Verification:**
- Action required count updates
- Badge displays correctly

### [ ] Step: Settings Pages

Create settings UI.

**Tasks:**
1. Create `src/routes/settings.tsx` (layout)
2. Create `src/routes/settings.profiles.tsx`
3. Create `src/routes/settings.projects.tsx`
4. Create `packages/ui/templates/SettingsLayout.tsx`

**Files to create:**
- `src/routes/settings.tsx`
- `src/routes/settings.profiles.tsx`
- `src/routes/settings.projects.tsx`
- `packages/ui/templates/SettingsLayout.tsx`

**Verification:**
- Settings pages render
- Can manage executor profiles
- Can configure projects

### [ ] Step: Search & Command Palette

Implement global search and command palette.

**Tasks:**
1. Create `src-tauri/src/services/search_service.rs`
2. Create `src-tauri/src/commands/search.rs`
3. Create `packages/ui/organisms/CommandPalette.tsx`
4. Add keyboard shortcut (Cmd+K)

**Files to create:**
- `src-tauri/src/services/search_service.rs`
- `src-tauri/src/commands/search.rs`
- `packages/ui/organisms/CommandPalette.tsx`
- `packages/hooks/useKeyboardShortcuts.ts`

**Verification:**
- Cmd+K opens command palette
- Search returns results
- Actions execute from palette

### [ ] Step: Archive Page

Create archive view for completed tasks.

**Tasks:**
1. Create `src/routes/archive.tsx`
2. List archived tasks
3. Allow restoring tasks

**Files to create:**
- `src/routes/archive.tsx`

**Verification:**
- Archived tasks display
- Can restore tasks

### [ ] Step: CI Pipeline

Set up GitHub Actions CI.

**Tasks:**
1. Create `.github/workflows/ci.yml`
2. Run typecheck, lint, test, validate:arch
3. Run Rust check, test, clippy

**Files to create:**
- `.github/workflows/ci.yml`

**Verification:**
- CI runs on push/PR
- All checks pass

---

## Verification Checklist

After each phase, verify:

- [ ] `pnpm install` succeeds
- [ ] `pnpm generate:types` produces valid TypeScript
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm validate:arch` passes
- [ ] `cargo check` passes
- [ ] `cargo test` passes
- [ ] `pnpm tauri dev` launches app without errors
