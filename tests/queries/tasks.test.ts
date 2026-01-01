import type { CreateTaskRequest, TaskStatus, UpdateTaskRequest } from '@openflow/generated';
import { taskQueries } from '@openflow/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Get the mocked invoke
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;

// Set up Tauri context
beforeEach(() => {
  vi.clearAllMocks();
  // Mock window with Tauri internals
  global.window = {
    __TAURI_INTERNALS__: {},
  } as unknown as Window & typeof globalThis;
});

describe('queries/tasks', () => {
  describe('list', () => {
    it('calls invoke with projectId only', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await taskQueries.list('proj-1');
      expect(mockInvoke).toHaveBeenCalledWith('list_tasks', {
        projectId: 'proj-1',
        status: undefined,
        includeArchived: undefined,
      });
    });

    it('calls invoke with status filter', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await taskQueries.list('proj-1', 'inprogress' as TaskStatus);
      expect(mockInvoke).toHaveBeenCalledWith('list_tasks', {
        projectId: 'proj-1',
        status: 'inprogress',
        includeArchived: undefined,
      });
    });

    it('calls invoke with includeArchived flag', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await taskQueries.list('proj-1', undefined, true);
      expect(mockInvoke).toHaveBeenCalledWith('list_tasks', {
        projectId: 'proj-1',
        status: undefined,
        includeArchived: true,
      });
    });

    it('returns array of tasks', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];
      mockInvoke.mockResolvedValueOnce(mockTasks);
      const result = await taskQueries.list('proj-1');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('get', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ task: { id: '123' }, chats: [] });
      await taskQueries.get('123');
      expect(mockInvoke).toHaveBeenCalledWith('get_task', { id: '123' });
    });

    it('returns task with chats', async () => {
      const mockTaskWithChats = {
        task: { id: '123', title: 'Test Task' },
        chats: [{ id: 'chat-1' }],
      };
      mockInvoke.mockResolvedValueOnce(mockTaskWithChats);
      const result = await taskQueries.get('123');
      expect(result).toEqual(mockTaskWithChats);
    });
  });

  describe('create', () => {
    it('validates and creates task', async () => {
      const request: CreateTaskRequest = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'New Task',
      };
      mockInvoke.mockResolvedValueOnce({ id: 'new-id', ...request });

      await taskQueries.create(request);
      expect(mockInvoke).toHaveBeenCalledWith('create_task', {
        request: expect.objectContaining({
          projectId: '550e8400-e29b-41d4-a716-446655440000',
          title: 'New Task',
        }),
      });
    });

    it('throws on missing required fields', async () => {
      const invalidRequest = {
        title: 'Task without project',
      } as CreateTaskRequest;

      // Zod validation throws in async function
      await expect(taskQueries.create(invalidRequest)).rejects.toThrow();
    });

    it('throws on empty title', async () => {
      const invalidRequest = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
      } as CreateTaskRequest;

      // Zod validation throws in async function
      await expect(taskQueries.create(invalidRequest)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('validates and updates task', async () => {
      const request: UpdateTaskRequest = {
        title: 'Updated Title',
      };
      mockInvoke.mockResolvedValueOnce({ id: '123', title: 'Updated Title' });

      await taskQueries.update('123', request);
      expect(mockInvoke).toHaveBeenCalledWith('update_task', {
        id: '123',
        request: expect.objectContaining({ title: 'Updated Title' }),
      });
    });

    it('allows status update', async () => {
      const request: UpdateTaskRequest = {
        status: 'done' as TaskStatus,
      };
      mockInvoke.mockResolvedValueOnce({ id: '123', status: 'done' });

      await taskQueries.update('123', request);
      expect(mockInvoke).toHaveBeenCalledWith('update_task', {
        id: '123',
        request: expect.objectContaining({ status: 'done' }),
      });
    });
  });

  describe('archive', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123', archivedAt: '2024-01-01' });
      const result = await taskQueries.archive('123');
      expect(mockInvoke).toHaveBeenCalledWith('archive_task', { id: '123' });
      expect(result.archivedAt).toBeDefined();
    });
  });

  describe('unarchive', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123', archivedAt: null });
      await taskQueries.unarchive('123');
      expect(mockInvoke).toHaveBeenCalledWith('unarchive_task', { id: '123' });
    });
  });

  describe('delete', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await taskQueries.delete('123');
      expect(mockInvoke).toHaveBeenCalledWith('delete_task', { id: '123' });
    });
  });
});
