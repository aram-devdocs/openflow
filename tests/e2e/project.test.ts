/**
 * E2E Tests for Project CRUD Operations
 *
 * Tests the project queries module with mocked Tauri invoke.
 */

import type { Project } from '@openflow/generated';
import { projectQueries } from '@openflow/queries';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestProject, getTestDatabase } from './setup';

describe('Project CRUD Operations', () => {
  describe('projectQueries.create', () => {
    it('should create a new project with required fields', async () => {
      const request = createTestProject({
        name: 'My New Project',
        gitRepoPath: '/path/to/repo',
      });

      const project = await projectQueries.create(request);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('My New Project');
      expect(project.gitRepoPath).toBe('/path/to/repo');
      expect(project.baseBranch).toBe('main'); // Default value
      expect(project.icon).toBe('folder'); // Default value
      expect(project.workflowsFolder).toBe('.openflow/workflows'); // Default value
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should create a project with all optional fields', async () => {
      const request = createTestProject({
        name: 'Full Project',
        gitRepoPath: '/full/path',
        baseBranch: 'develop',
        setupScript: 'npm install',
        devScript: 'npm run dev',
        cleanupScript: 'npm run clean',
        copyFiles: '["file1.txt", "file2.txt"]',
        icon: 'code',
        ruleFolders: '[".rules"]',
        alwaysIncludedRules: '["rule1.md"]',
        workflowsFolder: '.custom/workflows',
        verificationConfig: '{"lint": "npm run lint"}',
      });

      const project = await projectQueries.create(request);

      expect(project.name).toBe('Full Project');
      expect(project.baseBranch).toBe('develop');
      expect(project.setupScript).toBe('npm install');
      expect(project.devScript).toBe('npm run dev');
      expect(project.cleanupScript).toBe('npm run clean');
      expect(project.copyFiles).toBe('["file1.txt", "file2.txt"]');
      expect(project.icon).toBe('code');
      expect(project.ruleFolders).toBe('[".rules"]');
      expect(project.alwaysIncludedRules).toBe('["rule1.md"]');
      expect(project.workflowsFolder).toBe('.custom/workflows');
      expect(project.verificationConfig).toBe('{"lint": "npm run lint"}');
    });

    it('should store the project in the database', async () => {
      const request = createTestProject({ name: 'Stored Project' });

      const project = await projectQueries.create(request);
      const db = getTestDatabase();

      expect(db.projects.has(project.id)).toBe(true);
      expect(db.projects.get(project.id)?.name).toBe('Stored Project');
    });
  });

  describe('projectQueries.list', () => {
    it('should return empty array when no projects exist', async () => {
      const projects = await projectQueries.list();

      expect(projects).toEqual([]);
    });

    it('should return all projects', async () => {
      await projectQueries.create(createTestProject({ name: 'Project 1' }));
      await projectQueries.create(createTestProject({ name: 'Project 2' }));
      await projectQueries.create(createTestProject({ name: 'Project 3' }));

      const projects = await projectQueries.list();

      expect(projects).toHaveLength(3);
      expect(projects.map((p) => p.name)).toContain('Project 1');
      expect(projects.map((p) => p.name)).toContain('Project 2');
      expect(projects.map((p) => p.name)).toContain('Project 3');
    });
  });

  describe('projectQueries.get', () => {
    let existingProject: Project;

    beforeEach(async () => {
      existingProject = await projectQueries.create(
        createTestProject({ name: 'Existing Project' })
      );
    });

    it('should return a project by ID', async () => {
      const project = await projectQueries.get(existingProject.id);

      expect(project.id).toBe(existingProject.id);
      expect(project.name).toBe('Existing Project');
    });

    it('should throw error for non-existent project', async () => {
      await expect(projectQueries.get('non-existent-id')).rejects.toThrow(
        'Project not found: non-existent-id'
      );
    });
  });

  describe('projectQueries.update', () => {
    let existingProject: Project;

    beforeEach(async () => {
      existingProject = await projectQueries.create(
        createTestProject({
          name: 'Original Name',
          gitRepoPath: '/original/path',
          baseBranch: 'main',
        })
      );
    });

    it('should update project name', async () => {
      const updated = await projectQueries.update(existingProject.id, {
        name: 'Updated Name',
      });

      expect(updated.id).toBe(existingProject.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.gitRepoPath).toBe('/original/path'); // Unchanged
    });

    it('should update multiple fields at once', async () => {
      const updated = await projectQueries.update(existingProject.id, {
        name: 'New Name',
        baseBranch: 'develop',
        setupScript: 'yarn install',
      });

      expect(updated.name).toBe('New Name');
      expect(updated.baseBranch).toBe('develop');
      expect(updated.setupScript).toBe('yarn install');
    });

    it('should update the updatedAt timestamp', async () => {
      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await projectQueries.update(existingProject.id, {
        name: 'Updated',
      });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(existingProject.updatedAt).getTime()
      );
    });

    it('should throw error for non-existent project', async () => {
      await expect(projectQueries.update('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        'Project not found: non-existent-id'
      );
    });

    it('should not modify undefined fields', async () => {
      const updated = await projectQueries.update(existingProject.id, {
        name: 'New Name',
        // Other fields are undefined
      });

      expect(updated.gitRepoPath).toBe(existingProject.gitRepoPath);
      expect(updated.baseBranch).toBe(existingProject.baseBranch);
    });
  });

  describe('projectQueries.delete', () => {
    let existingProject: Project;

    beforeEach(async () => {
      existingProject = await projectQueries.create(createTestProject({ name: 'To Be Deleted' }));
    });

    it('should delete a project', async () => {
      await projectQueries.delete(existingProject.id);

      const db = getTestDatabase();
      expect(db.projects.has(existingProject.id)).toBe(false);
    });

    it('should throw error for non-existent project', async () => {
      await expect(projectQueries.delete('non-existent-id')).rejects.toThrow(
        'Project not found: non-existent-id'
      );
    });

    it('should cascade delete associated tasks', async () => {
      // Import task queries to create associated tasks
      const { taskQueries } = await import('@openflow/queries');

      const task = await taskQueries.create({
        projectId: existingProject.id,
        title: 'Associated Task',
      });

      const db = getTestDatabase();
      expect(db.tasks.has(task.id)).toBe(true);

      // Delete the project
      await projectQueries.delete(existingProject.id);

      // Task should also be deleted
      expect(db.tasks.has(task.id)).toBe(false);
    });

    it('should not affect other projects', async () => {
      const otherProject = await projectQueries.create(
        createTestProject({ name: 'Other Project' })
      );

      await projectQueries.delete(existingProject.id);

      const db = getTestDatabase();
      expect(db.projects.has(otherProject.id)).toBe(true);
    });
  });

  describe('Integration: Full Project Lifecycle', () => {
    it('should handle create, read, update, delete lifecycle', async () => {
      // Create
      const created = await projectQueries.create(createTestProject({ name: 'Lifecycle Test' }));
      expect(created.id).toBeDefined();

      // Read (list)
      const listed = await projectQueries.list();
      expect(listed).toHaveLength(1);
      expect(listed[0]?.id).toBe(created.id);

      // Read (get)
      const fetched = await projectQueries.get(created.id);
      expect(fetched.name).toBe('Lifecycle Test');

      // Update
      const updated = await projectQueries.update(created.id, {
        name: 'Updated Lifecycle Test',
      });
      expect(updated.name).toBe('Updated Lifecycle Test');

      // Verify update persisted
      const refetched = await projectQueries.get(created.id);
      expect(refetched.name).toBe('Updated Lifecycle Test');

      // Delete
      await projectQueries.delete(created.id);

      // Verify deletion
      const finalList = await projectQueries.list();
      expect(finalList).toHaveLength(0);

      // Verify get throws
      await expect(projectQueries.get(created.id)).rejects.toThrow();
    });
  });
});
