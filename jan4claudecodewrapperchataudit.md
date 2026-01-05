# Claude Code Wrapper Chat System Audit & Refactor Plan
**Date:** January 4, 2026
**Purpose:** Comprehensive audit of the chat/event streaming system with recommendations for refactoring and overhaul

---

## Executive Summary

The OpenFlow chat system, which wraps Claude Code CLI, has fundamental architectural issues causing:
- Tools stuck in "Running" state permanently
- Missing tool calls and responses
- Terminal showing "No output" despite data being received
- Poor developer experience with limited insight into what's happening

Root cause: **Dual emission sources with incompatible formats** and **mismatched channel names** between Tauri and HTTP modes.

This document provides both quick fixes and a long-term architectural overhaul plan.

---

## Part 1: Current Architecture Overview

### 1.1 System Flow

```
User Input → Tauri Command → PTY Process (Claude Code CLI)
                                    ↓
                            PTY Output (JSON stream)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            executor.rs                     ProcessService
         (direct parsing)                  (broadcaster pattern)
                    ↓                               ↓
            Raw ClaudeEvent                 Wrapped Event
         {type, message,...}            {event, process_id, timestamp}
                    ↓                               ↓
                    └───────────────┬───────────────┘
                                    ↓
                        claude-event-{processId}
                           (SAME CHANNEL!)
                                    ↓
                            Frontend Hook
                        (useClaudeEvents.ts)
                                    ↓
                         Only handles RAW format
                              ↓ BREAKS ↓
                    Most events show "unknown:no-type"
```

### 1.2 Key Files in Current System

**Backend (Rust):**
- `src-tauri/src/commands/executor.rs` - Tauri command, spawns PTY reader thread
- `src-tauri/src/broadcaster.rs` - Tauri event broadcaster implementation
- `crates/openflow-core/src/services/process.rs` - Process service with broadcaster
- `crates/openflow-core/src/services/process_buffer.rs` - Event buffering/parsing

**Frontend (TypeScript):**
- `packages/hooks/useClaudeEvents.ts` - Event subscription and state management
- `packages/hooks/useChatSession.ts` - Chat session orchestration
- `packages/hooks/useRawOutputStream.ts` - Terminal output streaming
- `packages/hooks/useProcessLifecycle.ts` - Process state machine
- `packages/ui/organisms/ChatTerminal.tsx` - Terminal display component
- `packages/ui/organisms/ChatBubbles.tsx` - Chat message rendering

---

## Part 2: Identified Issues

### 2.1 Critical: Dual Event Emission (BLOCKER)

**Problem:** Two different Rust code paths emit to the same `claude-event-{processId}` channel but with incompatible formats.

**Source A: executor.rs (Direct Emission)**
```rust
// src-tauri/src/commands/executor.rs:271
let _ = app_handle.emit(&event_channel, &event);  // Raw ClaudeEvent
```
Format: `{"type": "assistant", "message": {...}}`

**Source B: broadcaster.rs (Wrapped Emission)**
```rust
// src-tauri/src/broadcaster.rs:136-151
let payload = serde_json::json!({
    "process_id": process_id,
    "event": event,           // Wrapped!
    "timestamp": timestamp,
});
self.app_handle.emit(&channel, &payload)
```
Format: `{"event": {...}, "process_id": "...", "timestamp": "..."}`

**Evidence:**
```
Event 1: assistant (tool_use)     ← From executor.rs (correct)
Event 2: unknown:no-type          ← From broadcaster.rs (wrapped)
Event 3: unknown:no-type          ← From broadcaster.rs (wrapped)
...
```

**Impact:** Only the FIRST event parses correctly. All subsequent events fail.

### 2.2 Critical: Terminal Channel Mismatch

**Problem:** Terminal subscribes to wrong channel in Tauri mode.

- **Tauri executor emits on:** `raw-output-{processId}` (executor.rs:222)
- **Terminal listens on:** `process-output-{processId}` (useRawOutputStream.ts:112)

**Impact:** Terminal shows "No output" despite 8KB+ raw data being received.

### 2.3 High: Tool State Never Updates

**Problem:** Tool results can't find matching tool_use because most events fail to parse.

**Evidence from logs:**
```
Processing tool_result {"toolUseId":"toolu_0197...", "toolMapKeys":["toolu_013..."]}
```
Only 1 tool in the map, but 4 tools were actually used.

**Impact:**
- Tools permanently stuck in "Running" state
- `toolCallCount:1, toolResultCount:3` mismatch
- Poor UX - user sees spinning indicators forever

### 2.4 Medium: Inconsistent Transport Abstractions

**Problem:** The codebase has two different transport detection mechanisms:
1. `checkTauriContext()` from `@openflow/queries`
2. `typeof window !== 'undefined' && '__TAURI__' in window`

These should be unified.

### 2.5 Low: Debug Logging Pollution

Several debug `console.log` statements were added during investigation:
- `useClaudeEvents.ts:204` - Assistant event content
- `useClaudeEvents.ts:211` - User event content
- `useChatSession.ts:265-270` - Block processing
- `useChatSession.ts:295-298` - Tool result processing

---

## Part 3: Quick Fixes (Tactical)

If you need to ship quickly, here are targeted fixes that don't require architectural changes:

### Fix 1: Add Event Unwrapping (useClaudeEvents.ts)

```typescript
// Add helper function
function unwrapClaudeEvent(payload: unknown): ClaudeEvent | null {
  const p = payload as Record<string, unknown>;

  // Already unwrapped (has type at top level)
  if (p.type && ['system', 'assistant', 'user', 'result'].includes(p.type as string)) {
    return p as ClaudeEvent;
  }

  // Wrapped format (event inside .event field)
  if (p.event && typeof p.event === 'object') {
    const inner = p.event as Record<string, unknown>;
    if (inner.type) {
      return inner as ClaudeEvent;
    }
  }

  return null;
}

// Modify listener in setupTauriModeListeners (around line 249)
const unlisten = await listen<unknown>(`claude-event-${processId}`, (event) => {
  if (!callbacks.isMounted()) return;

  const claudeEvent = unwrapClaudeEvent(event.payload);
  if (claudeEvent) {
    callbacks.onEvent(claudeEvent);
  }
});
```

### Fix 2: Subscribe to Both Terminal Channels (useRawOutputStream.ts)

```typescript
// Around line 95, modify setup function
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Subscribe to appropriate channel(s)
const channels = isTauri
  ? [`raw-output-${processId}`, `process-output-${processId}`]
  : [`process-output-${processId}`];

const unsubscribes: Array<() => void> = [];

for (const channel of channels) {
  logger.debug('Subscribing to channel', { channel });

  const unsub = transport.subscribe(channel, (event: unknown) => {
    if (!isMounted) return;

    // Handle both string (Tauri) and ProcessOutputEvent (HTTP)
    const content = typeof event === 'string'
      ? event
      : (event as ProcessOutputEvent)?.content || '';

    if (content) {
      handleData(content);
    }
  });
  unsubscribes.push(unsub);
}

unsubscribe = () => unsubscribes.forEach(fn => fn());
```

### Fix 3: Remove Debug Logging

Remove after fixes verified:
- `packages/hooks/useClaudeEvents.ts:204, 211`
- `packages/hooks/useChatSession.ts:265-270, 295-298`

---

## Part 4: Long-Term Architectural Overhaul

### 4.1 Design Principles for Refactor

1. **Single Source of Truth** - One emission path, one format
2. **Transport Agnostic Core** - Business logic shouldn't know about Tauri vs HTTP
3. **Clear Channel Naming** - Consistent, predictable channel names
4. **Typed Event Contracts** - Shared types between Rust and TypeScript
5. **Idempotent Event Processing** - Handle duplicates gracefully

### 4.2 Recommended Architecture

```
                    PTY Output (Claude Code CLI)
                              ↓
                    ProcessBuffer (parse JSON lines)
                              ↓
                    EventBroadcaster Interface
                              ↓
              ┌───────────────┴───────────────┐
              ↓                               ↓
        TauriBroadcaster              HttpBroadcaster
        (consistent format)           (consistent format)
              ↓                               ↓
    {type, payload, meta}           {type, payload, meta}
              ↓                               ↓
              └───────────────┬───────────────┘
                              ↓
                    Frontend Transport Layer
                    (auto-detects context)
                              ↓
                    useClaudeEvents hook
                    (single format expected)
```

### 4.3 Refactor Tasks

#### Phase 1: Unify Emission Format

**Task 1.1: Define Canonical Event Format**

Create a shared event envelope type in `openflow-contracts`:

```rust
// crates/openflow-contracts/src/events/mod.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[typeshare]
pub struct EventEnvelope<T> {
    pub event_type: String,
    pub payload: T,
    pub process_id: String,
    pub timestamp: DateTime<Utc>,
    pub sequence: u64,  // For ordering/deduplication
}
```

**Task 1.2: Remove Direct Emission from executor.rs**

The executor should NOT emit events directly. Instead:
1. Parse JSON lines in the PTY reader thread
2. Call a method on ProcessService to record the event
3. ProcessService broadcasts through the EventBroadcaster

```rust
// executor.rs - BEFORE
match serde_json::from_str::<ClaudeEvent>(trimmed) {
    Ok(event) => {
        let _ = app_handle.emit(&event_channel, &event);  // Direct emit
    }
}

// executor.rs - AFTER
match serde_json::from_str::<ClaudeEvent>(trimmed) {
    Ok(event) => {
        // Send to process service which handles broadcasting
        process_service.record_claude_event(&process_id, event);
    }
}
```

**Task 1.3: Update TauriBroadcaster to Use Canonical Format**

```rust
// src-tauri/src/broadcaster.rs
impl EventBroadcaster for TauriBroadcaster {
    fn broadcast_claude_event(&self, process_id: &str, event: ClaudeEvent) {
        let envelope = EventEnvelope {
            event_type: "claude_event".to_string(),
            payload: event,  // Raw ClaudeEvent as payload
            process_id: process_id.to_string(),
            timestamp: Utc::now(),
            sequence: self.next_sequence(),
        };

        let channel = format!("claude-event-{}", process_id);
        self.app_handle.emit(&channel, &envelope);
    }
}
```

#### Phase 2: Unify Channel Names

**Task 2.1: Standardize Channel Naming Convention**

| Event Type | Channel Name | Payload |
|------------|-------------|---------|
| Claude Events | `process:claude-event:{processId}` | EventEnvelope<ClaudeEvent> |
| Raw Output | `process:output:{processId}` | EventEnvelope<RawOutput> |
| Status | `process:status:{processId}` | EventEnvelope<ProcessStatus> |
| Permission | `process:permission:{processId}` | EventEnvelope<PermissionRequest> |

**Task 2.2: Update All Emission Points**

- `executor.rs` - Remove (Phase 1)
- `broadcaster.rs` - Use new channel names
- `process.rs` - Use new channel names

**Task 2.3: Update All Subscription Points**

- `useClaudeEvents.ts` - Use new channel names
- `useRawOutputStream.ts` - Use new channel names
- `useProcessLifecycle.ts` - Use new channel names

#### Phase 3: Frontend Transport Unification

**Task 3.1: Create Unified Transport Layer**

```typescript
// packages/queries/transport/unified.ts
export interface TransportOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UnifiedTransport {
  subscribe<T>(channel: string, callback: (envelope: EventEnvelope<T>) => void): () => void;
  invoke<T>(command: string, args: Record<string, unknown>): Promise<T>;
}

export async function createTransport(options?: TransportOptions): Promise<UnifiedTransport> {
  const isTauri = checkTauriContext();

  if (isTauri) {
    return createTauriTransport(options);
  } else {
    return createHttpTransport(options);
  }
}
```

**Task 3.2: Rewrite useClaudeEvents with Unified Transport**

```typescript
export function useClaudeEvents(processId: string | null): ClaudeEventsState {
  const transport = useTransport();  // New unified hook

  useEffect(() => {
    if (!processId || !transport) return;

    const unsubscribe = transport.subscribe<ClaudeEvent>(
      `process:claude-event:${processId}`,
      (envelope) => {
        // envelope.payload is always ClaudeEvent
        // envelope.sequence enables deduplication
        addEvent(envelope.payload, envelope.sequence);
      }
    );

    return unsubscribe;
  }, [processId, transport]);
}
```

#### Phase 4: State Management Refactor

**Task 4.1: Create ProcessEventStore**

Instead of scattered state across multiple hooks, create a centralized store:

```typescript
// packages/hooks/stores/processEventStore.ts
interface ProcessEventState {
  events: Map<string, ClaudeEvent[]>;  // processId -> events
  toolStates: Map<string, ToolState[]>;  // processId -> tools
  rawOutput: Map<string, string[]>;  // processId -> output lines
  status: Map<string, ProcessStatus>;  // processId -> status
}

export const useProcessEventStore = create<ProcessEventState>((set, get) => ({
  // ... zustand store implementation
}));
```

**Task 4.2: Simplify Hook Composition**

```typescript
// Before: Complex hook dependencies
const useClaudeEvents = (processId) => {...}
const useRawOutputStream = (processId) => {...}
const useProcessLifecycle = () => {...}
const useChatSession = ({chatId}) => {
  const lifecycle = useProcessLifecycle();
  const events = useClaudeEvents(lifecycle.processId);
  const rawOutput = useRawOutputStream(lifecycle.processId);
  // ... complex orchestration
}

// After: Simple store access
const useChatSession = ({chatId}) => {
  const processId = useCurrentProcessId(chatId);
  const { events, tools, status } = useProcessEventStore(
    state => state.getProcessState(processId)
  );
  // ... straightforward rendering
}
```

---

## Part 5: Testing Strategy

### 5.1 Unit Tests to Add

```typescript
// packages/hooks/__tests__/useClaudeEvents.test.ts
describe('useClaudeEvents', () => {
  it('should unwrap wrapped events', () => {...});
  it('should handle raw events', () => {...});
  it('should deduplicate by sequence number', () => {...});
  it('should match tool_results with tool_use', () => {...});
});

// packages/hooks/__tests__/useRawOutputStream.test.ts
describe('useRawOutputStream', () => {
  it('should subscribe to correct channel in Tauri mode', () => {...});
  it('should subscribe to correct channel in HTTP mode', () => {...});
  it('should handle both string and object events', () => {...});
});
```

### 5.2 Integration Tests

```typescript
// tests/integration/chat-flow.test.ts
describe('Chat Flow', () => {
  it('should display all tool calls from Claude', async () => {
    // Simulate Claude using 4 tools
    // Verify all 4 appear in UI
    // Verify all 4 transition from Running to Complete
  });

  it('should show terminal output during execution', async () => {
    // Send message
    // Verify terminal receives raw output
    // Verify byte counter increases
  });

  it('should persist correct tool counts', async () => {
    // Execute flow with multiple tools
    // Verify toolCallCount === toolResultCount
  });
});
```

### 5.3 E2E Test Scenarios

1. **Happy Path:** Send message → See tools running → See tools complete → See final response
2. **Multi-tool:** Message triggers 4+ tools → All appear → All complete
3. **Terminal View:** Switch to terminal → See raw output → See live updates
4. **Resume Session:** Start chat → Refresh page → See persisted state
5. **Error Case:** Tool fails → Shows error state → Conversation continues

---

## Part 6: Migration Strategy

### 6.1 Phase Rollout

| Phase | Scope | Risk | Duration |
|-------|-------|------|----------|
| 0 | Quick fixes (Part 3) | Low | 1-2 hours |
| 1 | Unify emission format | Medium | 2-3 days |
| 2 | Unify channel names | Medium | 1-2 days |
| 3 | Frontend transport | High | 3-4 days |
| 4 | State management | High | 3-4 days |

### 6.2 Feature Flags

Consider implementing feature flags for gradual rollout:

```typescript
const FEATURES = {
  USE_UNIFIED_TRANSPORT: process.env.FF_UNIFIED_TRANSPORT === 'true',
  USE_NEW_CHANNEL_NAMES: process.env.FF_NEW_CHANNELS === 'true',
  USE_EVENT_STORE: process.env.FF_EVENT_STORE === 'true',
};
```

### 6.3 Rollback Plan

Each phase should be independently rollback-able:
- Keep old code paths behind feature flags
- Monitor error rates after each deployment
- Have clear criteria for rollback triggers

---

## Part 7: Success Metrics

After refactor, verify:

1. **All tools visible** - 4 tools triggered = 4 tools displayed
2. **Tool state accurate** - Running → Complete/Error transitions work
3. **Terminal functional** - Shows live output, not "No output"
4. **Persistence correct** - `toolCallCount === toolResultCount` in database
5. **No console errors** - No "unknown:no-type" warnings
6. **Performance maintained** - No regression in event processing latency

---

## Appendix A: Debug Log Analysis

From the January 4 debug session, key findings:

```
00:32:49.589 - Event 1: assistant (tool_use) ← WORKS (from executor.rs)
00:32:50.560 - Event 2: unknown:no-type ← BROKEN (from broadcaster.rs)
00:32:55.703 - Event 3: unknown:no-type ← BROKEN
...
00:33:14.012 - Persisting: toolCallCount:1, toolResultCount:3 ← MISMATCH
```

The first `tool_use` event parses correctly because it comes from `executor.rs` (direct format).
All subsequent events come wrapped from `broadcaster.rs` and fail to parse.

## Appendix B: File Reference

### Must Modify (Quick Fix)
- `packages/hooks/useClaudeEvents.ts` - Add unwrapping
- `packages/hooks/useRawOutputStream.ts` - Add dual channel

### Must Modify (Full Refactor)
- `src-tauri/src/commands/executor.rs` - Remove direct emission
- `src-tauri/src/broadcaster.rs` - Standardize format
- `crates/openflow-core/src/services/process.rs` - Centralize event handling
- `crates/openflow-contracts/src/events/mod.rs` - Add EventEnvelope
- `packages/queries/transport/` - Create unified transport
- `packages/hooks/stores/` - Create event store

### Remove Debug Logging
- `packages/hooks/useClaudeEvents.ts:204, 211`
- `packages/hooks/useChatSession.ts:265-270, 295-298`

---

**Document prepared by:** Claude (AI Assistant)
**For:** OpenFlow Development Team
**Next Action:** Begin with Part 3 (Quick Fixes) for immediate relief, then plan Part 4 (Full Refactor) sprint
