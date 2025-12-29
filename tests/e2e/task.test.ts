/**
 * E2E Tests for Task CRUD Operations
 *
 * Tests the task queries module with mocked Tauri invoke.
 */

import type { Project, Task, TaskStatus } from '@openflow/generated';
import { projectQueries, taskQueries } from '@openflow/queries';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestProject, createTestTask, getTestDatabase } from './setup';

describe('Task CRUD Operations', () => {
  let project: Project;

  beforeEach(async () => {
    // Create a project for all task tests
    project = await projectQueries.create(createTestProject({ name: 'Task Test Project' }));
  });

  describe('taskQueries.create', () => {
    it('should create a new task with required fields', async () => {
      const request = createTestTask(project.id, {
        title: 'My New Task',
      });

      const task = await taskQueries.create(request);

      expect(task.id).toBeDefined();
      expect(task.projectId).toBe(project.id);
      expect(task.title).toBe('My New Task');
      expect(task.status).toBe('todo'); // Default status
      expect(task.actionsRequiredCount).toBe(0);
      expect(task.autoStartNextStep).toBe(false);
      expect(task.archivedAt).toBeUndefined();
      expect(task.createdAt).toBeDefined();
      expect(task.updatedAt).toBeDefined();
    });

    it('should create a task with all optional fields', async () => {
      const request = createTestTask(project.id, {
        title: 'Full Task',
        description: 'A detailed description',
        workflowTemplate: 'feature.md',
        baseBranch: 'develop',
      });

      const task = await taskQueries.create(request);

      expect(task.title).toBe('Full Task');
      expect(task.description).toBe('A detailed description');
      expect(task.workflowTemplate).toBe('feature.md');
      expect(task.baseBranch).toBe('develop');
    });

    it('should throw error for non-existent project', async () => {
      const request = createTestTask('non-existent-project', {
        title: 'Orphan Task',
      });

      await expect(taskQueries.create(request)).rejects.toThrow(
        'Project not found: non-existent-project'
      );
    });

    it('should support parent task relationship', async () => {
      const parentTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Parent Task' })
      );

      const childTask = await taskQueries.create(
        createTestTask(project.id, {
          title: 'Child Task',
          parentTaskId: parentTask.id,
        })
      );

      expect(childTask.parentTaskId).toBe(parentTask.id);
    });
  });

  describe('taskQueries.list', () => {
    it('should return empty array when no tasks exist', async () => {
      const tasks = await taskQueries.list(project.id);

      expect(tasks).toEqual([]);
    });

    it('should return all tasks for a project', async () => {
      await taskQueries.create(createTestTask(project.id, { title: 'Task 1' }));
      await taskQueries.create(createTestTask(project.id, { title: 'Task 2' }));
      await taskQueries.create(createTestTask(project.id, { title: 'Task 3' }));

      const tasks = await taskQueries.list(project.id);

      expect(tasks).toHaveLength(3);
      expect(tasks.map((t) => t.title)).toContain('Task 1');
      expect(tasks.map((t) => t.title)).toContain('Task 2');
      expect(tasks.map((t) => t.title)).toContain('Task 3');
    });

    it('should not return tasks from other projects', async () => {
      const otherProject = await projectQueries.create(
        createTestProject({ name: 'Other Project' })
      );

      await taskQueries.create(createTestTask(project.id, { title: 'Project 1 Task' }));
      await taskQueries.create(createTestTask(otherProject.id, { title: 'Project 2 Task' }));

      const tasks = await taskQueries.list(project.id);

      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.title).toBe('Project 1 Task');
    });

    it('should filter by status', async () => {
      const task1 = await taskQueries.create(createTestTask(project.id, { title: 'Todo Task' }));
      const task2 = await taskQueries.create(
        createTestTask(project.id, { title: 'In Progress Task' })
      );

      // Update task2 status
      await taskQueries.update(task2.id, { status: 'inprogress' as TaskStatus });

      const todoTasks = await taskQueries.list(project.id, 'todo' as TaskStatus);
      const inProgressTasks = await taskQueries.list(project.id, 'inprogress' as TaskStatus);

      expect(todoTasks).toHaveLength(1);
      expect(todoTasks[0]?.id).toBe(task1.id);

      expect(inProgressTasks).toHaveLength(1);
      expect(inProgressTasks[0]?.id).toBe(task2.id);
    });

    it('should exclude archived tasks by default', async () => {
      const activeTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Active Task' })
      );
      const archivedTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Archived Task' })
      );

      await taskQueries.archive(archivedTask.id);

      const tasks = await taskQueries.list(project.id);

      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.id).toBe(activeTask.id);
    });

    it('should include archived tasks when requested', async () => {
      const activeTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Active Task' })
      );
      const archivedTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Archived Task' })
      );

      await taskQueries.archive(archivedTask.id);

      const tasks = await taskQueries.list(project.id, undefined, true);

      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toContain(activeTask.id);
      expect(tasks.map((t) => t.id)).toContain(archivedTask.id);
    });
  });

  describe('taskQueries.get', () => {
    let existingTask: Task;

    beforeEach(async () => {
      existingTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Existing Task' })
      );
    });

    it('should return a task with its chats', async () => {
      const result = await taskQueries.get(existingTask.id);

      expect(result.task.id).toBe(existingTask.id);
      expect(result.task.title).toBe('Existing Task');
      expect(result.chats).toEqual([]); // No chats created yet
    });

    it('should include associated chats', async () => {
      // Import chat queries to create associated chats
      const { chatQueries } = await import('@openflow/queries');

      await chatQueries.create({ taskId: existingTask.id });
      await chatQueries.create({ taskId: existingTask.id });

      const result = await taskQueries.get(existingTask.id);

      expect(result.chats).toHaveLength(2);
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskQueries.get('non-existent-id')).rejects.toThrow(
        'Task not found: non-existent-id'
      );
    });
  });

  describe('taskQueries.update', () => {
    let existingTask: Task;

    beforeEach(async () => {
      existingTask = await taskQueries.create(
        createTestTask(project.id, {
          title: 'Original Title',
          description: 'Original Description',
        })
      );
    });

    it('should update task title', async () => {
      const updated = await taskQueries.update(existingTask.id, {
        title: 'Updated Title',
      });

      expect(updated.id).toBe(existingTask.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Original Description'); // Unchanged
    });

    it('should update task status', async () => {
      const updated = await taskQueries.update(existingTask.id, {
        status: 'inprogress' as TaskStatus,
      });

      expect(updated.status).toBe('inprogress');
    });

    it('should update multiple fields at once', async () => {
      const updated = await taskQueries.update(existingTask.id, {
        title: 'New Title',
        description: 'New Description',
        status: 'done' as TaskStatus,
        autoStartNextStep: true,
      });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New Description');
      expect(updated.status).toBe('done');
      expect(updated.autoStartNextStep).toBe(true);
    });

    it('should update the updatedAt timestamp', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await taskQueries.update(existingTask.id, {
        title: 'Updated',
      });

      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(existingTask.updatedAt).getTime()
      );
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskQueries.update('non-existent-id', { title: 'New Title' })).rejects.toThrow(
        'Task not found: non-existent-id'
      );
    });
  });

  describe('taskQueries.archive', () => {
    let existingTask: Task;

    beforeEach(async () => {
      existingTask = await taskQueries.create(
        createTestTask(project.id, { title: 'To Be Archived' })
      );
    });

    it('should archive a task', async () => {
      const archived = await taskQueries.archive(existingTask.id);

      expect(archived.id).toBe(existingTask.id);
      expect(archived.archivedAt).toBeDefined();
    });

    it('should update the updatedAt timestamp', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));

      const archived = await taskQueries.archive(existingTask.id);

      expect(new Date(archived.updatedAt).getTime()).toBeGreaterThan(
        new Date(existingTask.updatedAt).getTime()
      );
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskQueries.archive('non-existent-id')).rejects.toThrow(
        'Task not found: non-existent-id'
      );
    });
  });

  describe('taskQueries.unarchive', () => {
    let archivedTask: Task;

    beforeEach(async () => {
      const task = await taskQueries.create(createTestTask(project.id, { title: 'Archived Task' }));
      archivedTask = await taskQueries.archive(task.id);
    });

    it('should unarchive a task', async () => {
      const unarchived = await taskQueries.unarchive(archivedTask.id);

      expect(unarchived.id).toBe(archivedTask.id);
      expect(unarchived.archivedAt).toBeUndefined();
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskQueries.unarchive('non-existent-id')).rejects.toThrow(
        'Task not found: non-existent-id'
      );
    });
  });

  describe('taskQueries.delete', () => {
    let existingTask: Task;

    beforeEach(async () => {
      existingTask = await taskQueries.create(
        createTestTask(project.id, { title: 'To Be Deleted' })
      );
    });

    it('should delete a task', async () => {
      await taskQueries.delete(existingTask.id);

      const db = getTestDatabase();
      expect(db.tasks.has(existingTask.id)).toBe(false);
    });

    it('should throw error for non-existent task', async () => {
      await expect(taskQueries.delete('non-existent-id')).rejects.toThrow(
        'Task not found: non-existent-id'
      );
    });

    it('should cascade delete associated chats', async () => {
      const { chatQueries } = await import('@openflow/queries');

      const chat = await chatQueries.create({ taskId: existingTask.id });

      const db = getTestDatabase();
      expect(db.chats.has(chat.id)).toBe(true);

      await taskQueries.delete(existingTask.id);

      expect(db.chats.has(chat.id)).toBe(false);
    });

    it('should not affect other tasks', async () => {
      const otherTask = await taskQueries.create(
        createTestTask(project.id, { title: 'Other Task' })
      );

      await taskQueries.delete(existingTask.id);

      const db = getTestDatabase();
      expect(db.tasks.has(otherTask.id)).toBe(true);
    });
  });

  describe('Task Status Workflow', () => {
    it('should transition through status workflow', async () => {
      const task = await taskQueries.create(createTestTask(project.id, { title: 'Workflow Task' }));

      expect(task.status).toBe('todo');

      // Move to in progress
      const inProgress = await taskQueries.update(task.id, {
        status: 'inprogress' as TaskStatus,
      });
      expect(inProgress.status).toBe('inprogress');

      // Move to in review
      const inReview = await taskQueries.update(task.id, {
        status: 'inreview' as TaskStatus,
      });
      expect(inReview.status).toBe('inreview');

      // Move to done
      const done = await taskQueries.update(task.id, {
        status: 'done' as TaskStatus,
      });
      expect(done.status).toBe('done');
    });

    it('should allow cancelling a task', async () => {
      const task = await taskQueries.create(createTestTask(project.id, { title: 'To Cancel' }));

      const cancelled = await taskQueries.update(task.id, {
        status: 'cancelled' as TaskStatus,
      });

      expect(cancelled.status).toBe('cancelled');
    });
  });

  describe('Integration: Full Task Lifecycle', () => {
    it('should handle create, read, update, archive, unarchive, delete lifecycle', async () => {
      // Create
      const created = await taskQueries.create(
        createTestTask(project.id, { title: 'Lifecycle Test' })
      );
      expect(created.id).toBeDefined();

      // Read (list)
      const listed = await taskQueries.list(project.id);
      expect(listed).toHaveLength(1);
      expect(listed[0]?.id).toBe(created.id);

      // Read (get)
      const fetched = await taskQueries.get(created.id);
      expect(fetched.task.title).toBe('Lifecycle Test');

      // Update
      const updated = await taskQueries.update(created.id, {
        title: 'Updated Lifecycle Test',
        status: 'inprogress' as TaskStatus,
      });
      expect(updated.title).toBe('Updated Lifecycle Test');
      expect(updated.status).toBe('inprogress');

      // Archive
      const archived = await taskQueries.archive(created.id);
      expect(archived.archivedAt).toBeDefined();

      // Verify archived task is excluded from default list
      const activeList = await taskQueries.list(project.id);
      expect(activeList).toHaveLength(0);

      // Verify archived task is included when requested
      const allList = await taskQueries.list(project.id, undefined, true);
      expect(allList).toHaveLength(1);

      // Unarchive
      const unarchived = await taskQueries.unarchive(created.id);
      expect(unarchived.archivedAt).toBeUndefined();

      // Verify task is back in active list
      const restoredList = await taskQueries.list(project.id);
      expect(restoredList).toHaveLength(1);

      // Delete
      await taskQueries.delete(created.id);

      // Verify deletion
      const finalList = await taskQueries.list(project.id);
      expect(finalList).toHaveLength(0);

      // Verify get throws
      await expect(taskQueries.get(created.id)).rejects.toThrow();
    });
  });
});
