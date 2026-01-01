import type { CreateProjectRequest, UpdateProjectRequest } from '@openflow/generated';
import { projectQueries } from '@openflow/queries';
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

describe('queries/projects', () => {
  describe('list', () => {
    it('calls invoke with correct command', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await projectQueries.list();
      expect(mockInvoke).toHaveBeenCalledWith('list_projects', undefined);
    });

    it('returns array of projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ];
      mockInvoke.mockResolvedValueOnce(mockProjects);
      const result = await projectQueries.list();
      expect(result).toEqual(mockProjects);
    });
  });

  describe('get', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123' });
      await projectQueries.get('123');
      expect(mockInvoke).toHaveBeenCalledWith('get_project', { id: '123' });
    });

    it('returns the project', async () => {
      const mockProject = { id: '123', name: 'Test Project' };
      mockInvoke.mockResolvedValueOnce(mockProject);
      const result = await projectQueries.get('123');
      expect(result).toEqual(mockProject);
    });
  });

  describe('create', () => {
    it('validates and creates project', async () => {
      const request: CreateProjectRequest = {
        name: 'New Project',
        gitRepoPath: '/path/to/repo',
      };
      mockInvoke.mockResolvedValueOnce({ id: 'new-id', ...request });

      await projectQueries.create(request);
      expect(mockInvoke).toHaveBeenCalledWith('create_project', {
        request: expect.objectContaining({ name: 'New Project' }),
      });
    });

    it('throws on invalid request', async () => {
      const invalidRequest = {
        // missing required fields
      } as CreateProjectRequest;

      // Zod validation throws in async function
      await expect(projectQueries.create(invalidRequest)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('validates and updates project', async () => {
      const request: UpdateProjectRequest = {
        name: 'Updated Name',
      };
      mockInvoke.mockResolvedValueOnce({ id: '123', name: 'Updated Name' });

      await projectQueries.update('123', request);
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        id: '123',
        request: expect.objectContaining({ name: 'Updated Name' }),
      });
    });

    it('allows partial updates', async () => {
      const request: UpdateProjectRequest = {
        setupScript: 'npm install',
      };
      mockInvoke.mockResolvedValueOnce({ id: '123' });

      await projectQueries.update('123', request);
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        id: '123',
        request: expect.objectContaining({ setupScript: 'npm install' }),
      });
    });
  });

  describe('delete', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);
      await projectQueries.delete('123');
      expect(mockInvoke).toHaveBeenCalledWith('delete_project', { id: '123' });
    });
  });

  describe('archive', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123', archivedAt: '2024-01-01' });
      const result = await projectQueries.archive('123');
      expect(mockInvoke).toHaveBeenCalledWith('archive_project', { id: '123' });
      expect(result.archivedAt).toBeDefined();
    });
  });

  describe('unarchive', () => {
    it('calls invoke with correct command and id', async () => {
      mockInvoke.mockResolvedValueOnce({ id: '123', archivedAt: null });
      await projectQueries.unarchive('123');
      expect(mockInvoke).toHaveBeenCalledWith('unarchive_project', { id: '123' });
    });
  });

  describe('listArchived', () => {
    it('calls invoke with correct command', async () => {
      mockInvoke.mockResolvedValueOnce([]);
      await projectQueries.listArchived();
      expect(mockInvoke).toHaveBeenCalledWith('list_archived_projects', undefined);
    });

    it('returns archived projects', async () => {
      const archived = [{ id: '1', archivedAt: '2024-01-01' }];
      mockInvoke.mockResolvedValueOnce(archived);
      const result = await projectQueries.listArchived();
      expect(result).toEqual(archived);
    });
  });
});
