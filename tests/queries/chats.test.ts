import type { CreateChatRequest, UpdateChatRequest } from '@openflow/generated';
import { chatQueries } from '@openflow/queries';
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

describe('queries/chats', () => {
  describe('list', () => {
    it('calls invoke with taskId', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await chatQueries.list('task-1');
      expect(mockInvoke).toHaveBeenCalledWith('list_chats', { taskId: 'task-1' });
    });

    it('returns array of chats', async () => {
      const mockChats = [
        { id: 'chat-1', title: 'Chat 1' },
        { id: 'chat-2', title: 'Chat 2' },
      ];
      mockInvoke.mockResolvedValueOnce(mockChats);
      const result = await chatQueries.list('task-1');
      expect(result).toEqual(mockChats);
    });
  });

  describe('listStandalone', () => {
    it('calls invoke with projectId', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await chatQueries.listStandalone('proj-1');
      expect(mockInvoke).toHaveBeenCalledWith('list_standalone_chats', { projectId: 'proj-1' });
    });
  });

  describe('listByProject', () => {
    it('calls invoke with projectId', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await chatQueries.listByProject('proj-1');
      expect(mockInvoke).toHaveBeenCalledWith('list_chats_by_project', { projectId: 'proj-1' });
    });
  });

  describe('get', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ chat: { id: '123' }, messages: [] });
      await chatQueries.get('123');
      expect(mockInvoke).toHaveBeenCalledWith('get_chat', { id: '123' });
    });

    it('returns chat with messages', async () => {
      const mockChatWithMessages = {
        chat: { id: '123', title: 'Test Chat' },
        messages: [{ id: 'msg-1', content: 'Hello' }],
      };
      mockInvoke.mockResolvedValueOnce(mockChatWithMessages);
      const result = await chatQueries.get('123');
      expect(result).toEqual(mockChatWithMessages);
    });
  });

  describe('create', () => {
    it('validates and creates chat', async () => {
      const request: CreateChatRequest = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'New Chat',
      };
      mockInvoke.mockResolvedValueOnce({ id: 'new-id', ...request });

      await chatQueries.create(request);
      expect(mockInvoke).toHaveBeenCalledWith('create_chat', {
        request: expect.objectContaining({
          projectId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      });
    });

    it('throws on missing projectId', () => {
      const invalidRequest = {
        title: 'Chat without project',
      } as CreateChatRequest;

      // Zod validation throws synchronously
      expect(() => chatQueries.create(invalidRequest)).toThrow();
    });
  });

  describe('update', () => {
    it('validates and updates chat', async () => {
      const request: UpdateChatRequest = {
        title: 'Updated Title',
      };
      mockInvoke.mockResolvedValueOnce({ id: '123', title: 'Updated Title' });

      await chatQueries.update('123', request);
      expect(mockInvoke).toHaveBeenCalledWith('update_chat', {
        id: '123',
        request: expect.objectContaining({ title: 'Updated Title' }),
      });
    });
  });

  describe('delete', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await chatQueries.delete('123');
      expect(mockInvoke).toHaveBeenCalledWith('delete_chat', { id: '123' });
    });
  });

  describe('archive', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123', archivedAt: '2024-01-01' });
      const result = await chatQueries.archive('123');
      expect(mockInvoke).toHaveBeenCalledWith('archive_chat', { id: '123' });
      expect(result.archivedAt).toBeDefined();
    });
  });

  describe('unarchive', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123', archivedAt: null });
      await chatQueries.unarchive('123');
      expect(mockInvoke).toHaveBeenCalledWith('unarchive_chat', { id: '123' });
    });
  });

  describe('listArchived', () => {
    it('calls invoke with correct command', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await chatQueries.listArchived();
      expect(mockInvoke).toHaveBeenCalledWith('list_archived_chats', undefined);
    });
  });

  describe('startWorkflowStep', () => {
    it('calls invoke with chatId', async () => {
      mockInvoke.mockResolvedValueOnce({ id: 'proc-1', status: 'running' });
      const result = await chatQueries.startWorkflowStep('chat-1');
      expect(mockInvoke).toHaveBeenCalledWith('start_workflow_step', { chatId: 'chat-1' });
      expect(result.status).toBe('running');
    });
  });
});
