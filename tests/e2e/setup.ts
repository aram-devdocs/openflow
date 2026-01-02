/**
 * E2E Test Setup
 *
 * This file sets up the test environment for E2E tests:
 * - Mocks Tauri invoke for testing without the Rust backend
 * - Provides in-memory database simulation for testing CRUD operations
 * - Sets up test utilities and helpers
 */

import type {
  Chat,
  ChatRole,
  ChatWithMessages,
  CreateChatRequest,
  CreateMessageRequest,
  CreateProjectRequest,
  CreateTaskRequest,
  ExecutorProfile,
  Message,
  Project,
  Task,
  TaskStatus,
  TaskWithChats,
  UpdateProjectRequest,
  UpdateTaskRequest,
} from '@openflow/generated';
import { afterEach, beforeEach, vi } from 'vitest';

// ============================================================================
// In-Memory Test Database
// ============================================================================

/**
 * Simple in-memory storage for test data.
 * Simulates the SQLite database for E2E tests.
 */
export interface TestDatabase {
  projects: Map<string, Project>;
  tasks: Map<string, Task>;
  chats: Map<string, Chat>;
  messages: Map<string, Message>;
  executorProfiles: Map<string, ExecutorProfile>;
  settings: Map<string, string>;
}

let testDb: TestDatabase;

/**
 * Initialize a fresh test database.
 */
export function createTestDatabase(): TestDatabase {
  return {
    projects: new Map(),
    tasks: new Map(),
    chats: new Map(),
    messages: new Map(),
    executorProfiles: new Map(),
    settings: new Map(),
  };
}

/**
 * Get the current test database instance.
 */
export function getTestDatabase(): TestDatabase {
  return testDb;
}

/**
 * Generate a UUID for test entities.
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp.
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * Helper to build objects without explicit undefined values.
 */
function buildObject<T>(base: Partial<T>, additions: Partial<T>): T {
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(additions as Record<string, unknown>)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

// ============================================================================
// Mock Command Handlers
// ============================================================================

type InvokeArgs = Record<string, unknown>;

/**
 * Map of Tauri command names to their mock implementations.
 */
const mockCommands: Record<string, (args: InvokeArgs) => unknown> = {
  // Project Commands
  list_projects: () => Array.from(testDb.projects.values()),

  get_project: (args) => {
    const id = args.id as string;
    const project = testDb.projects.get(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    return project;
  },

  create_project: (args) => {
    const request = args.request as CreateProjectRequest;
    const project = buildObject<Project>(
      {
        id: generateId(),
        name: request.name,
        gitRepoPath: request.gitRepoPath,
        baseBranch: request.baseBranch ?? 'main',
        setupScript: request.setupScript ?? '',
        devScript: request.devScript ?? '',
        icon: request.icon ?? 'folder',
        workflowsFolder: request.workflowsFolder ?? '.openflow/workflows',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        cleanupScript: request.cleanupScript,
        copyFiles: request.copyFiles,
        ruleFolders: request.ruleFolders,
        alwaysIncludedRules: request.alwaysIncludedRules,
        verificationConfig: request.verificationConfig,
      }
    );
    testDb.projects.set(project.id, project);
    return project;
  },

  update_project: (args) => {
    const id = args.id as string;
    const request = args.request as UpdateProjectRequest;
    const project = testDb.projects.get(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    const updated = buildObject<Project>(
      { ...project, updatedAt: now() },
      Object.fromEntries(Object.entries(request).filter(([, v]) => v !== undefined))
    );
    testDb.projects.set(id, updated);
    return updated;
  },

  delete_project: (args) => {
    const id = args.id as string;
    if (!testDb.projects.has(id)) {
      throw new Error(`Project not found: ${id}`);
    }
    testDb.projects.delete(id);
    // Cascade delete tasks
    for (const [taskId, task] of testDb.tasks) {
      if (task.projectId === id) {
        testDb.tasks.delete(taskId);
      }
    }
  },

  // Task Commands
  list_tasks: (args) => {
    const projectId = args.projectId as string;
    const status = args.status as TaskStatus | undefined;
    const includeArchived = args.includeArchived as boolean | undefined;

    return Array.from(testDb.tasks.values()).filter((task) => {
      if (task.projectId !== projectId) return false;
      if (status && task.status !== status) return false;
      if (!includeArchived && task.archivedAt) return false;
      return true;
    });
  },

  get_task: (args) => {
    const id = args.id as string;
    const task = testDb.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    const chats = Array.from(testDb.chats.values()).filter((chat) => chat.taskId === id);
    const result: TaskWithChats = { task, chats };
    return result;
  },

  create_task: (args) => {
    const request = args.request as CreateTaskRequest;
    // Verify project exists
    if (!testDb.projects.has(request.projectId)) {
      throw new Error(`Project not found: ${request.projectId}`);
    }
    const task = buildObject<Task>(
      {
        id: generateId(),
        projectId: request.projectId,
        title: request.title,
        status: 'todo' as TaskStatus,
        actionsRequiredCount: 0,
        autoStartNextStep: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: request.description,
        workflowTemplate: request.workflowTemplate,
        parentTaskId: request.parentTaskId,
        baseBranch: request.baseBranch,
      }
    );
    testDb.tasks.set(task.id, task);
    return task;
  },

  update_task: (args) => {
    const id = args.id as string;
    const request = args.request as UpdateTaskRequest;
    const task = testDb.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    const updated = buildObject<Task>(
      { ...task, updatedAt: now() },
      Object.fromEntries(Object.entries(request).filter(([, v]) => v !== undefined))
    );
    testDb.tasks.set(id, updated);
    return updated;
  },

  archive_task: (args) => {
    const id = args.id as string;
    const task = testDb.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    const updated: Task = {
      ...task,
      archivedAt: now(),
      updatedAt: now(),
    };
    testDb.tasks.set(id, updated);
    return updated;
  },

  unarchive_task: (args) => {
    const id = args.id as string;
    const task = testDb.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    // Remove archivedAt by creating new object without it
    const { archivedAt: _, ...taskWithoutArchived } = task;
    const updated: Task = {
      ...taskWithoutArchived,
      updatedAt: now(),
    };
    testDb.tasks.set(id, updated);
    return updated;
  },

  delete_task: (args) => {
    const id = args.id as string;
    if (!testDb.tasks.has(id)) {
      throw new Error(`Task not found: ${id}`);
    }
    testDb.tasks.delete(id);
    // Cascade delete chats
    for (const [chatId, chat] of testDb.chats) {
      if (chat.taskId === id) {
        testDb.chats.delete(chatId);
      }
    }
  },

  // Chat Commands
  list_chats: (args) => {
    const taskId = args.taskId as string;
    return Array.from(testDb.chats.values()).filter((chat) => chat.taskId === taskId);
  },

  get_chat: (args) => {
    const id = args.id as string;
    const chat = testDb.chats.get(id);
    if (!chat) {
      throw new Error(`Chat not found: ${id}`);
    }
    const messages = Array.from(testDb.messages.values()).filter((msg) => msg.chatId === id);
    // ChatWithMessages extends Chat, so spread chat properties and add messages
    const result: ChatWithMessages = { ...chat, messages };
    return result;
  },

  create_chat: (args) => {
    const request = args.request as CreateChatRequest;
    // Verify task exists if taskId is provided
    if (request.taskId && !testDb.tasks.has(request.taskId)) {
      throw new Error(`Task not found: ${request.taskId}`);
    }
    // Verify project exists
    if (!testDb.projects.has(request.projectId)) {
      throw new Error(`Project not found: ${request.projectId}`);
    }
    const chat = buildObject<Chat>(
      {
        id: generateId(),
        taskId: request.taskId,
        projectId: request.projectId,
        chatRole: request.chatRole ?? ('main' as ChatRole),
        baseBranch: request.baseBranch ?? 'main',
        worktreeDeleted: false,
        isPlanContainer: request.isPlanContainer ?? false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        title: request.title,
        executorProfileId: request.executorProfileId,
        initialPrompt: request.initialPrompt,
        hiddenPrompt: request.hiddenPrompt,
        mainChatId: request.mainChatId,
        workflowStepIndex: request.workflowStepIndex,
      }
    );
    testDb.chats.set(chat.id, chat);
    return chat;
  },

  // Message Commands
  list_messages: (args) => {
    const chatId = args.chatId as string;
    return Array.from(testDb.messages.values()).filter((msg) => msg.chatId === chatId);
  },

  create_message: (args) => {
    const request = args.request as CreateMessageRequest;
    // Verify chat exists
    if (!testDb.chats.has(request.chatId)) {
      throw new Error(`Chat not found: ${request.chatId}`);
    }
    const message = buildObject<Message>(
      {
        id: generateId(),
        chatId: request.chatId,
        role: request.role,
        content: request.content,
        isStreaming: false,
        createdAt: now(),
      },
      {
        toolCalls: request.toolCalls,
        toolResults: request.toolResults,
        model: request.model,
      }
    );
    testDb.messages.set(message.id, message);
    return message;
  },

  // Settings Commands
  get_setting: (args) => {
    const key = args.key as string;
    return testDb.settings.get(key) ?? null;
  },

  set_setting: (args) => {
    const key = args.key as string;
    const value = args.value as string;
    testDb.settings.set(key, value);
  },

  get_all_settings: () => {
    return Object.fromEntries(testDb.settings);
  },

  // Executor Profile Commands
  list_executor_profiles: () => Array.from(testDb.executorProfiles.values()),

  create_executor_profile: (args) => {
    const request = args.request as {
      name: string;
      command: string;
      args?: string;
      env?: string;
      description?: string;
      isDefault?: boolean;
    };
    const profile = buildObject<ExecutorProfile>(
      {
        id: generateId(),
        name: request.name,
        command: request.command,
        isDefault: request.isDefault ?? false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        args: request.args,
        env: request.env,
        description: request.description,
      }
    );
    testDb.executorProfiles.set(profile.id, profile);
    return profile;
  },
};

// ============================================================================
// Tauri Mock
// ============================================================================

/**
 * Mock implementation of Tauri's invoke function.
 * Routes commands to the mock handlers defined above.
 */
async function mockInvoke(cmd: string, args?: InvokeArgs): Promise<unknown> {
  const handler = mockCommands[cmd];
  if (!handler) {
    throw new Error(`Unknown command: ${cmd}`);
  }
  // Simulate async behavior
  await Promise.resolve();
  return handler(args ?? {});
}

// ============================================================================
// Test Setup/Teardown
// ============================================================================

/**
 * Mock the @tauri-apps/api/core module.
 */
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(mockInvoke),
}));

/**
 * Mock the @tauri-apps/api/event module for process output events.
 */
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(() => Promise.resolve()),
}));

// Reset database before each test
beforeEach(() => {
  testDb = createTestDatabase();
  vi.clearAllMocks();
});

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a test project with default values.
 */
export function createTestProject(
  overrides: Partial<CreateProjectRequest> = {}
): CreateProjectRequest {
  return {
    name: 'Test Project',
    gitRepoPath: '/path/to/test/repo',
    ...overrides,
  };
}

/**
 * Create a test task with default values.
 */
export function createTestTask(
  projectId: string,
  overrides: Partial<CreateTaskRequest> = {}
): CreateTaskRequest {
  return {
    projectId,
    title: 'Test Task',
    ...overrides,
  };
}

/**
 * Create a test chat with default values.
 */
export function createTestChat(
  taskId: string,
  projectId: string,
  overrides: Partial<CreateChatRequest> = {}
): CreateChatRequest {
  return {
    taskId,
    projectId,
    ...overrides,
  };
}

/**
 * Seed the test database with sample data.
 */
export async function seedTestData(): Promise<{
  project: Project;
  tasks: Task[];
  chats: Chat[];
}> {
  const { invoke } = await import('@tauri-apps/api/core');

  // Create a project
  const project = (await invoke('create_project', {
    request: createTestProject({ name: 'Seeded Project' }),
  })) as Project;

  // Create tasks
  const task1 = (await invoke('create_task', {
    request: createTestTask(project.id, { title: 'Seeded Task 1' }),
  })) as Task;

  const task2 = (await invoke('create_task', {
    request: createTestTask(project.id, { title: 'Seeded Task 2' }),
  })) as Task;

  // Create chats
  const chat1 = (await invoke('create_chat', {
    request: createTestChat(task1.id, project.id),
  })) as Chat;

  return {
    project,
    tasks: [task1, task2],
    chats: [chat1],
  };
}

/**
 * Wait for a condition to be true (useful for async operations).
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 1000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('waitFor timeout');
}
