# OpenFlow - Product Requirements Document (PRD)

> **Version:** 1.0
> **Date:** 2025-12-28
> **Status:** Draft

---

## 1. Executive Summary

OpenFlow is an AI agent orchestration platform for software engineering teams. It coordinates multiple AI coding CLI tools (Claude Code, Gemini CLI, Codex CLI, Cursor CLI) to build reliable software through spec-driven workflows, parallel execution, and built-in verification.

**Core Value Proposition:** "AI doesn't need better prompts. It needs orchestration."

OpenFlow wraps existing AI coding CLIs that developers already use and provides the orchestration layer to coordinate multiple agents working on tasks simultaneously with isolated git worktrees, automated testing, and multi-agent code review.

---

## 2. Product Vision

### 2.1 Problem Statement
- AI coding agents produce inconsistent results without proper orchestration
- Developers waste time managing context, branches, and coordination between tasks
- No standardized way to run multiple AI agents in parallel without conflicts
- Verification (tests, linting, type-checking) is manual and often skipped
- Existing solutions are IDE-specific or require proprietary agent implementations

### 2.2 Solution
OpenFlow is a standalone desktop application that:
1. **Orchestrates existing CLI tools** - Claude Code, Gemini CLI, Codex CLI, Cursor CLI
2. **Provides spec-driven workflows** - Agents read PRDs/specs before implementation
3. **Enables parallel execution** - Each task runs in isolated git worktrees
4. **Automates verification** - Runs project's existing test/lint/build commands
5. **Coordinates multi-agent work** - Agents review each other's work via docs and commits

### 2.3 Target Users
- **Senior Engineers:** Handle architecture while agents manage implementation
- **Technical Vibecoders:** PMs/designers thinking in outcomes, not syntax
- **Teams:** Standardize AI workflows and guarantee quality across projects

---

## 3. Core Features

### 3.1 Project Management

#### 3.1.1 Projects
- **Create/edit/delete projects** linked to local git repositories
- **Project settings:**
  - Git repository path (local)
  - Setup script (run when initializing a worktree)
  - Dev server script (optional background process)
  - Cleanup script (run when deleting worktree)
  - Files to copy to worktrees (e.g., `.env.local`)
  - Icon selection
  - Rule folders (for AI context files like `CLAUDE.md`)
  - Always-included rules
  - Workflows folder path (default: `.zenflow/workflows/`)

#### 3.1.2 Tasks
- **Kanban-style task board** with columns:
  - Todo
  - In Progress
  - In Review
  - Done
  - Cancelled
- **Task properties:**
  - Title and description
  - Parent task (for subtasks)
  - Actions required count (badge indicator)
  - Auto-start next step toggle
  - Default executor profile
  - Archive functionality
- **Task detail view:**
  - Steps panel (workflow progress)
  - Changes view (git diff)
  - Commits view (git log)
  - Edit steps in `plan.md`
  - Auto-start steps toggle

### 3.2 Workflow System

#### 3.2.1 Workflow Definition
Workflows are defined as markdown files in `.zenflow/workflows/`:

```markdown
# Feature Workflow

## Steps

### [ ] Step: Requirements
Create PRD based on feature description.
1. Review existing codebase
2. Analyze feature definition
3. Ask clarifications
4. Save to `{@artifacts_path}/requirements.md`

### [ ] Step: Technical Specification
Create technical spec based on PRD.
Save to `{@artifacts_path}/spec.md`

### [ ] Step: Planning
Create implementation plan.
Save to `{@artifacts_path}/plan.md`

### [ ] Step: Implementation
Execute tasks in plan.md
```

#### 3.2.2 Built-in Workflows
- **Feature:** Requirements → Spec → Planning → Implementation
- **Bug Fix:** Reproduce → Root Cause → Fix → Verify
- **Refactor:** Analysis → Planning → Implementation → Verification

#### 3.2.3 Workflow Variables
- `{@artifacts_path}` - Task-specific artifact folder (`.zenflow/tasks/{task_id}/`)
- `{@project_root}` - Project git repository root
- `{@worktree_path}` - Current worktree path

### 3.3 Chat & Execution System

#### 3.3.1 Chat Interface
- **Main chat panel** for interacting with AI agents
- **Message types:**
  - User messages
  - Agent responses (with tool calls rendered)
  - System messages (status updates)
  - Action required indicators
- **Chat roles:**
  - Main (primary implementation)
  - Review (code review)
  - Test (testing)
  - Terminal (manual terminal access)

#### 3.3.2 Executor Profiles
Configure which CLI tool to use:
- **Claude Code** (`claude`)
- **Gemini CLI** (`gemini`)
- **Codex CLI** (`codex`)
- **Cursor CLI** (`cursor`)
- Custom CLI command

Profile settings:
- CLI command path
- Default arguments
- Environment variables
- Model selection (if applicable)

#### 3.3.3 Execution Process Management
- **Process states:** Running, Completed, Failed, Killed
- **Process tracking:**
  - Exit code
  - Before/after HEAD commits
  - Run reason (setup, cleanup, coding agent, dev server, terminal)
  - Stdout/stderr streaming
- **Process actions:**
  - Kill running process
  - Restart failed process
  - View execution history

### 3.4 Git Worktree Management

#### 3.4.1 Worktree Lifecycle
1. **Create:** When task starts, create isolated worktree from base branch
2. **Setup:** Run project's setup script in worktree
3. **Execute:** All agent work happens in isolated worktree
4. **Cleanup:** Run cleanup script when task completes/cancels
5. **Delete:** Remove worktree (keep branch for reference)

#### 3.4.2 Worktree Features
- Each chat/task gets dedicated worktree
- Branch naming: `zenflow/{task_id}/{chat_role}`
- Base branch configurable (default: `main`)
- Track worktree_deleted state for cleanup

### 3.5 Verification System

#### 3.5.1 User-Configured Commands
Projects specify their verification commands:
```json
{
  "verification": {
    "test": "pnpm test",
    "typecheck": "pnpm typecheck",
    "lint": "pnpm lint",
    "build": "pnpm build"
  }
}
```

#### 3.5.2 Verification Triggers
- **Manual:** User clicks "Run Verification"
- **Auto:** Agent completes implementation step
- **Pre-merge:** Before creating PR

#### 3.5.3 Verification Results
- Pass/fail status per command
- Output streaming to chat
- Failed tests trigger agent to fix (if auto-start enabled)

### 3.6 Multi-Agent Coordination

#### 3.6.1 Agent Types (via Chat Roles)
- **Main Agent:** Primary implementation work
- **Review Agent:** Code review and feedback
- **Test Agent:** Test generation and execution
- **Terminal Agent:** Manual commands

#### 3.6.2 Agent Communication
Agents coordinate through:
- **Shared docs:** Artifacts in `.zenflow/tasks/{task_id}/`
- **Git commits:** Reviewing each other's changes
- **Chat context:** Reading other agents' conversations

#### 3.6.3 Multi-Agent Workflow Example
1. Main agent implements feature
2. Test agent writes tests
3. Review agent reviews code
4. Main agent addresses feedback
5. Verification runs on all changes

### 3.7 Parallel Execution

#### 3.7.1 Task-Level Parallelism
- Multiple tasks can run simultaneously
- Each task has isolated git worktree
- No code conflicts between parallel tasks

#### 3.7.2 Step-Level Parallelism
- Within a task, multiple agents can work in parallel
- Test and review can happen while implementation continues
- Merging handled via git

### 3.8 UI Components

#### 3.8.1 Global Layout
- **Left sidebar:**
  - Project selector dropdown
  - + New task button
  - Status filter
  - Task list with status indicators
  - Settings link
  - Feedback link
  - Archive link
  - User profile

- **Header:**
  - Search (Cmd+K)
  - + New chat button
  - + New terminal button

#### 3.8.2 Task View
- **Task header:**
  - Task title (editable)
  - Branch indicator
  - Status dropdown (In Progress, etc.)
  - Create PR button
  - More options menu

- **Steps panel (left side):**
  - Step list with checkboxes
  - Action required indicators
  - Start button per step
  - Add step button
  - Edit steps in plan.md link
  - Auto-start steps toggle

- **Main panel (right side):**
  - Tabs: Steps | Changes | Commits
  - Chat interface
  - Agent selector dropdown
  - Message input with send button

#### 3.8.3 Action Required States
- Visual indicator (orange badge) when agent needs user input
- "Action required" label in task list
- Count badge on task card

---

## 4. Technical Requirements

### 4.1 Platform
- **Desktop:** Tauri 2 (macOS, Windows, Linux)
- **Backend:** Rust
- **Frontend:** React 18 + TypeScript

### 4.2 CLI Tool Integration
Spawn CLI tools as subprocesses:
```rust
// Example: Spawning Claude Code
Command::new("claude")
    .args(["--print", "--output-format", "json"])
    .current_dir(&worktree_path)
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
```

Support for:
- Interactive mode (PTY)
- Non-interactive mode (pipes)
- Streaming output
- Process management (kill, restart)

### 4.3 Data Persistence
- **SQLite** database via SQLx
- File-based artifacts in `.zenflow/tasks/{task_id}/`

#### 4.3.1 Database Tables

**Core Tables (from existing schema in plan.md):**
- `projects` - Project configuration and git repo paths
- `tasks` - Task metadata, status, and workflow state
- `chats` - Chat sessions linked to tasks with executor config
- `execution_processes` - Process tracking for CLI executions

**Additional Tables Required:**

```sql
-- Messages table for chat content storage
CREATE TABLE messages (
    id              TEXT PRIMARY KEY,
    chat_id         TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    tool_calls      TEXT,  -- JSON array of tool call objects
    tool_results    TEXT,  -- JSON array of tool result objects
    tokens_used     INTEGER,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);

-- Executor profiles table for CLI tool configuration
CREATE TABLE executor_profiles (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    command         TEXT NOT NULL,  -- CLI command (claude, gemini, etc.)
    args            TEXT,           -- JSON array of default arguments
    env             TEXT,           -- JSON object of environment variables
    model           TEXT,           -- Model identifier if applicable
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Workflow templates table (optional, can also use file-based)
CREATE TABLE workflow_templates (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    content         TEXT NOT NULL,  -- Markdown workflow definition
    is_builtin      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);
```

#### 4.3.2 Schema Cross-Reference with plan.md

The existing schema in `plan.md` defines fields that map to PRD features:

| Schema Field | PRD Feature |
|--------------|-------------|
| `tasks.parent_chat_id` | Subtasks/parent task relationship |
| `tasks.auto_start_next_step` | Auto-start steps toggle (3.1.2) |
| `tasks.default_executor_profile_id` | Default executor per task (3.3.2) |
| `chats.is_plan_container` | Workflow step container tracking |
| `chats.chat_role` | Agent types: main, review, test (3.6.1) |
| `chats.worktree_deleted` | Worktree lifecycle tracking (3.4.1) |
| `execution_processes.run_reason` | Process categorization (3.3.3) |

### 4.4 Git Integration
- Git worktree commands via CLI
- Branch management
- Diff/log parsing for UI display

### 4.5 Real-time Updates
- Tauri events for process output streaming
- Live updates for task status changes
- Agent message streaming

---

## 5. User Flows

### 5.1 Create New Task
1. User clicks "+ New task"
2. User enters task title and description
3. User selects workflow (Feature, Bug Fix, etc.)
4. System creates task with workflow steps
5. System creates git worktree from base branch
6. System runs setup script
7. Task appears in "Todo" column

### 5.2 Start Workflow Step
1. User clicks "Start" on workflow step
2. System opens chat panel for that step
3. System sends initial prompt to agent (based on workflow definition)
4. Agent executes, streaming output to chat
5. Agent completes or requests action
6. If action required, user provides input
7. Step marked complete, next step available

### 5.3 Auto-Start Steps
1. User enables "Auto-start steps" toggle
2. When step completes successfully:
   - Verification runs (if configured)
   - If passes, next step starts automatically
   - If fails, agent attempts fix
3. Continues until workflow complete or action required

### 5.4 Review Changes
1. User clicks "Changes" tab
2. System shows git diff of worktree vs base branch
3. User can view file-by-file changes
4. User can add comments for agent

### 5.5 Create Pull Request
1. User clicks "Create PR"
2. System pushes worktree branch to remote
3. System opens GitHub/GitLab PR creation
4. User reviews and submits PR

---

## 6. Non-Functional Requirements

### 6.1 Performance
- App startup < 2 seconds
- Task creation < 500ms
- Agent response streaming with < 100ms latency
- Handle 100+ tasks per project

### 6.2 Security
- No cloud storage of code
- CLI tools run with user's local permissions
- API keys stored securely (keychain/credential manager)
- Optional: BYOK (Bring Your Own Key) for AI services

### 6.3 Reliability
- Graceful handling of CLI tool crashes
- Process state recovery on app restart
- Git worktree cleanup on task completion

### 6.4 Usability
- Dark mode by default (matches screenshot)
- Keyboard shortcuts for common actions
- Responsive layout (minimum 1024x768)

---

## 7. Success Metrics

### 7.1 Core Metrics
- Tasks completed per day
- Time from task creation to PR
- Verification pass rate on first try
- Agent action required rate (lower is better)

### 7.2 User Experience Metrics
- Time to first task creation
- Workflow completion rate
- Multi-agent usage rate

---

## 8. Out of Scope (v1.0)

- Multi-repository support (single repo per project for now)
- Cloud deployment / team collaboration
- Custom agent training
- IDE plugins
- Mobile app
- Real-time collaboration between users

---

## 9. Assumptions & Dependencies

### 9.1 Assumptions
- Users have CLI tools installed (claude, gemini, etc.)
- Projects have existing test/lint/build commands
- Users have git configured locally
- Projects use standard git workflows

### 9.2 Dependencies
- Tauri 2 for desktop framework
- SQLite for local database
- Git CLI for version control operations
- Supported AI CLI tools installed by user

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **Task** | A unit of work with a workflow (feature, bug fix, etc.) |
| **Chat** | A conversation session with an AI agent |
| **Executor** | The AI CLI tool used (Claude Code, Gemini, etc.) |
| **Worktree** | Isolated git working directory for a task |
| **Workflow** | Sequence of steps to complete a task |
| **Step** | Single phase in a workflow (Requirements, Spec, etc.) |
| **Artifact** | File produced during workflow (PRD, spec, plan) |
| **Verification** | Running project's test/lint/build commands |
| **Action Required** | State where agent needs user input to continue |

---

## 11. Appendix

### 11.1 UI Reference
See ZenFlow UI for reference implementation:
- Dark theme with subtle borders
- Orange accent for action required states
- Sidebar navigation with project/task hierarchy
- Split-pane layout for steps and chat
- Inline step management with checkboxes

### 11.2 Workflow File Format
```markdown
# {Workflow Name}

## Configuration
- **Artifacts Path**: {@artifacts_path}

## Steps

### [ ] Step: {Step Name}
{Step description}

1. {Instruction 1}
2. {Instruction 2}

Save to `{@artifacts_path}/{filename}.md`
```

### 11.3 Executor Profile Format
```json
{
  "id": "claude-code-default",
  "name": "Claude Code",
  "command": "claude",
  "args": ["--print", "--output-format", "stream-json"],
  "env": {},
  "model": "claude-sonnet-4-20250514"
}
```
