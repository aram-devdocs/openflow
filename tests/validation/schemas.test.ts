/**
 * Validation Schemas Unit Tests
 *
 * Tests for Zod schemas used for input validation.
 * These tests ensure schemas properly validate input and reject invalid data.
 */

import {
  chatRoleSchema,
  commitSchema,
  createChatSchema,
  createExecutorProfileSchema,
  createMessageSchema,
  createProjectSchema,
  createTaskSchema,
  createWorkflowTemplateSchema,
  diffHunkSchema,
  fileDiffSchema,
  messageRoleSchema,
  processStatusSchema,
  searchQuerySchema,
  setSettingSchema,
  taskStatusSchema,
  updateChatSchema,
  updateExecutorProfileSchema,
  updateProjectSchema,
  updateTaskSchema,
  updateWorkflowTemplateSchema,
  workflowStepSchema,
  // Output schemas
  workflowStepStatusSchema,
  workflowTemplateSchema,
} from '@openflow/validation';
import { describe, expect, it } from 'vitest';

// =============================================================================
// Enum Schema Tests
// =============================================================================

describe('Enum Schemas', () => {
  describe('taskStatusSchema', () => {
    it('should accept valid task statuses', () => {
      expect(taskStatusSchema.safeParse('todo').success).toBe(true);
      expect(taskStatusSchema.safeParse('inprogress').success).toBe(true);
      expect(taskStatusSchema.safeParse('inreview').success).toBe(true);
      expect(taskStatusSchema.safeParse('done').success).toBe(true);
      expect(taskStatusSchema.safeParse('cancelled').success).toBe(true);
    });

    it('should reject invalid task statuses', () => {
      expect(taskStatusSchema.safeParse('invalid').success).toBe(false);
      expect(taskStatusSchema.safeParse('').success).toBe(false);
      expect(taskStatusSchema.safeParse(123).success).toBe(false);
    });
  });

  describe('chatRoleSchema', () => {
    it('should accept valid chat roles', () => {
      expect(chatRoleSchema.safeParse('main').success).toBe(true);
      expect(chatRoleSchema.safeParse('review').success).toBe(true);
      expect(chatRoleSchema.safeParse('test').success).toBe(true);
      expect(chatRoleSchema.safeParse('terminal').success).toBe(true);
    });

    it('should reject invalid chat roles', () => {
      expect(chatRoleSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('messageRoleSchema', () => {
    it('should accept valid message roles', () => {
      expect(messageRoleSchema.safeParse('user').success).toBe(true);
      expect(messageRoleSchema.safeParse('assistant').success).toBe(true);
      expect(messageRoleSchema.safeParse('system').success).toBe(true);
    });

    it('should reject invalid message roles', () => {
      expect(messageRoleSchema.safeParse('admin').success).toBe(false);
    });
  });

  describe('processStatusSchema', () => {
    it('should accept valid process statuses', () => {
      expect(processStatusSchema.safeParse('running').success).toBe(true);
      expect(processStatusSchema.safeParse('completed').success).toBe(true);
      expect(processStatusSchema.safeParse('failed').success).toBe(true);
      expect(processStatusSchema.safeParse('killed').success).toBe(true);
    });
  });
});

// =============================================================================
// Project Schema Tests
// =============================================================================

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('should accept valid project data', () => {
      const validProject = {
        name: 'My Project',
        gitRepoPath: '/path/to/repo',
      };
      expect(createProjectSchema.safeParse(validProject).success).toBe(true);
    });

    it('should accept project with all optional fields', () => {
      const fullProject = {
        name: 'My Project',
        gitRepoPath: '/path/to/repo',
        setupScript: 'pnpm install',
        devScript: 'pnpm dev',
        cleanupScript: 'pnpm clean',
        copyFiles: 'src/**',
        icon: 'rocket',
        ruleFolders: '.rules',
        alwaysIncludedRules: 'base.md',
        workflowsFolder: '.workflows',
      };
      expect(createProjectSchema.safeParse(fullProject).success).toBe(true);
    });

    it('should reject project without name', () => {
      const invalidProject = {
        gitRepoPath: '/path/to/repo',
      };
      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('should reject project without gitRepoPath', () => {
      const invalidProject = {
        name: 'My Project',
      };
      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidProject = {
        name: '',
        gitRepoPath: '/path/to/repo',
      };
      const result = createProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('should accept partial updates', () => {
      expect(updateProjectSchema.safeParse({ name: 'New Name' }).success).toBe(true);
      expect(updateProjectSchema.safeParse({ setupScript: 'npm install' }).success).toBe(true);
    });

    it('should accept empty object', () => {
      expect(updateProjectSchema.safeParse({}).success).toBe(true);
    });
  });
});

// =============================================================================
// Task Schema Tests
// =============================================================================

describe('Task Schemas', () => {
  describe('createTaskSchema', () => {
    it('should accept valid task data', () => {
      const validTask = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Implement feature X',
      };
      expect(createTaskSchema.safeParse(validTask).success).toBe(true);
    });

    it('should accept task with optional fields', () => {
      const fullTask = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Implement feature X',
        description: 'This is a detailed description',
        status: 'inprogress',
        autoStartNextStep: true,
        defaultExecutorProfileId: '550e8400-e29b-41d4-a716-446655440001',
      };
      expect(createTaskSchema.safeParse(fullTask).success).toBe(true);
    });

    it('should reject invalid project ID', () => {
      const invalidTask = {
        projectId: 'not-a-uuid',
        title: 'Task',
      };
      const result = createTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidTask = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: '',
      };
      const result = createTaskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('should accept partial updates', () => {
      expect(updateTaskSchema.safeParse({ title: 'New Title' }).success).toBe(true);
      expect(updateTaskSchema.safeParse({ status: 'done' }).success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = updateTaskSchema.safeParse({ status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Chat Schema Tests
// =============================================================================

describe('Chat Schemas', () => {
  describe('createChatSchema', () => {
    it('should accept valid chat data', () => {
      const validChat = {
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(createChatSchema.safeParse(validChat).success).toBe(true);
    });

    it('should accept chat with all optional fields', () => {
      const fullChat = {
        taskId: '550e8400-e29b-41d4-a716-446655440001',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Chat Title',
        executor: 'claude',
        baseBranch: 'develop',
        initialPrompt: 'Start with this',
        hiddenPrompt: 'System context',
        isPlanContainer: false,
        executorProfileId: '550e8400-e29b-41d4-a716-446655440002',
        mainChatId: '550e8400-e29b-41d4-a716-446655440003',
        chatRole: 'review',
      };
      expect(createChatSchema.safeParse(fullChat).success).toBe(true);
    });
  });

  describe('updateChatSchema', () => {
    it('should accept partial updates', () => {
      expect(updateChatSchema.safeParse({ title: 'New Title' }).success).toBe(true);
      expect(updateChatSchema.safeParse({ branch: 'feature-branch' }).success).toBe(true);
    });

    it('should accept datetime for setupCompletedAt', () => {
      const result = updateChatSchema.safeParse({
        setupCompletedAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// Message Schema Tests
// =============================================================================

describe('Message Schemas', () => {
  describe('createMessageSchema', () => {
    it('should accept valid message data', () => {
      const validMessage = {
        chatId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'user',
        content: 'Hello, world!',
      };
      expect(createMessageSchema.safeParse(validMessage).success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidMessage = {
        chatId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'user',
        content: '',
      };
      const result = createMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidMessage = {
        chatId: '550e8400-e29b-41d4-a716-446655440000',
        role: 'admin',
        content: 'Content',
      };
      const result = createMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Executor Profile Schema Tests
// =============================================================================

describe('Executor Profile Schemas', () => {
  describe('createExecutorProfileSchema', () => {
    it('should accept valid profile data', () => {
      const validProfile = {
        name: 'Claude Code',
        command: 'claude',
      };
      expect(createExecutorProfileSchema.safeParse(validProfile).success).toBe(true);
    });

    it('should accept profile with optional fields', () => {
      const fullProfile = {
        name: 'Claude Code',
        command: 'claude',
        args: '--verbose',
        isDefault: true,
      };
      expect(createExecutorProfileSchema.safeParse(fullProfile).success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidProfile = {
        name: '',
        command: 'claude',
      };
      const result = createExecutorProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('updateExecutorProfileSchema', () => {
    it('should accept partial updates', () => {
      expect(updateExecutorProfileSchema.safeParse({ name: 'New Name' }).success).toBe(true);
      expect(updateExecutorProfileSchema.safeParse({ isDefault: true }).success).toBe(true);
    });
  });
});

// =============================================================================
// Search Schema Tests
// =============================================================================

describe('Search Schemas', () => {
  describe('searchQuerySchema', () => {
    it('should accept valid search query', () => {
      const validQuery = {
        query: 'test search',
      };
      expect(searchQuerySchema.safeParse(validQuery).success).toBe(true);
    });

    it('should accept query with all options', () => {
      const fullQuery = {
        query: 'test search',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        resultTypes: ['task', 'project'],
        limit: 50,
      };
      expect(searchQuerySchema.safeParse(fullQuery).success).toBe(true);
    });

    it('should reject empty query', () => {
      const invalidQuery = {
        query: '',
      };
      const result = searchQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('should reject limit > 100', () => {
      const invalidQuery = {
        query: 'test',
        limit: 150,
      };
      const result = searchQuerySchema.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Settings Schema Tests
// =============================================================================

describe('Settings Schemas', () => {
  describe('setSettingSchema', () => {
    it('should accept valid setting', () => {
      const validSetting = {
        key: 'theme',
        value: 'dark',
      };
      expect(setSettingSchema.safeParse(validSetting).success).toBe(true);
    });

    it('should reject empty key', () => {
      const invalidSetting = {
        key: '',
        value: 'dark',
      };
      const result = setSettingSchema.safeParse(invalidSetting);
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// Workflow Template Schema Tests
// =============================================================================

describe('Workflow Template Schemas', () => {
  describe('createWorkflowTemplateSchema', () => {
    it('should accept valid template data', () => {
      const validTemplate = {
        name: 'Feature Workflow',
        content: '### [ ] Step: Implementation\nImplement the feature',
      };
      expect(createWorkflowTemplateSchema.safeParse(validTemplate).success).toBe(true);
    });

    it('should accept template with description', () => {
      const fullTemplate = {
        name: 'Feature Workflow',
        description: 'A workflow for implementing new features',
        content: '### [ ] Step: Implementation\nImplement the feature',
      };
      expect(createWorkflowTemplateSchema.safeParse(fullTemplate).success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidTemplate = {
        name: '',
        content: 'Some content',
      };
      const result = createWorkflowTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const invalidTemplate = {
        name: 'Template',
        content: '',
      };
      const result = createWorkflowTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });
  });

  describe('updateWorkflowTemplateSchema', () => {
    it('should accept partial updates', () => {
      expect(updateWorkflowTemplateSchema.safeParse({ name: 'New Name' }).success).toBe(true);
      expect(updateWorkflowTemplateSchema.safeParse({ description: 'New desc' }).success).toBe(
        true
      );
      expect(updateWorkflowTemplateSchema.safeParse({ content: 'New content' }).success).toBe(true);
    });

    it('should accept empty object', () => {
      expect(updateWorkflowTemplateSchema.safeParse({}).success).toBe(true);
    });
  });
});

// =============================================================================
// Output Schema Tests (API Response Types)
// =============================================================================

describe('Output Schemas', () => {
  describe('workflowStepStatusSchema', () => {
    it('should accept valid workflow step statuses', () => {
      expect(workflowStepStatusSchema.safeParse('pending').success).toBe(true);
      expect(workflowStepStatusSchema.safeParse('inprogress').success).toBe(true);
      expect(workflowStepStatusSchema.safeParse('completed').success).toBe(true);
      expect(workflowStepStatusSchema.safeParse('skipped').success).toBe(true);
    });

    it('should reject invalid workflow step statuses', () => {
      expect(workflowStepStatusSchema.safeParse('invalid').success).toBe(false);
      expect(workflowStepStatusSchema.safeParse('done').success).toBe(false);
    });
  });

  describe('workflowStepSchema', () => {
    it('should accept valid workflow step', () => {
      const validStep = {
        index: 0,
        name: 'Implementation',
        description: 'Implement the feature',
        status: 'pending',
      };
      expect(workflowStepSchema.safeParse(validStep).success).toBe(true);
    });

    it('should accept workflow step with chatId', () => {
      const stepWithChat = {
        index: 1,
        name: 'Review',
        description: 'Review the implementation',
        status: 'inprogress',
        chatId: '550e8400-e29b-41d4-a716-446655440000',
      };
      expect(workflowStepSchema.safeParse(stepWithChat).success).toBe(true);
    });

    it('should reject negative index', () => {
      const invalidStep = {
        index: -1,
        name: 'Step',
        description: 'Description',
        status: 'pending',
      };
      expect(workflowStepSchema.safeParse(invalidStep).success).toBe(false);
    });

    it('should reject invalid chatId', () => {
      const invalidStep = {
        index: 0,
        name: 'Step',
        description: 'Description',
        status: 'pending',
        chatId: 'not-a-uuid',
      };
      expect(workflowStepSchema.safeParse(invalidStep).success).toBe(false);
    });
  });

  describe('workflowTemplateSchema', () => {
    it('should accept valid workflow template', () => {
      const validTemplate = {
        id: 'feature-workflow',
        name: 'Feature Workflow',
        content: '### [ ] Step: Implementation\nImplement the feature',
        isBuiltin: true,
        steps: [
          {
            index: 0,
            name: 'Implementation',
            description: 'Implement the feature',
            status: 'pending',
          },
        ],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };
      expect(workflowTemplateSchema.safeParse(validTemplate).success).toBe(true);
    });

    it('should accept workflow template with description', () => {
      const templateWithDesc = {
        id: 'feature-workflow',
        name: 'Feature Workflow',
        description: 'A workflow for implementing new features',
        content: '### [ ] Step: Implementation\nImplement the feature',
        isBuiltin: false,
        steps: [],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      };
      expect(workflowTemplateSchema.safeParse(templateWithDesc).success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidTemplate = {
        id: 'template',
        name: 'Template',
        // missing content, isBuiltin, steps, createdAt, updatedAt
      };
      expect(workflowTemplateSchema.safeParse(invalidTemplate).success).toBe(false);
    });
  });

  describe('commitSchema', () => {
    it('should accept valid commit', () => {
      const validCommit = {
        hash: 'a'.repeat(40),
        shortHash: 'a'.repeat(7),
        message: 'Initial commit',
        author: 'John Doe',
        authorEmail: 'john@example.com',
        date: '2024-01-15T10:30:00Z',
        filesChanged: 5,
        additions: 100,
        deletions: 20,
      };
      expect(commitSchema.safeParse(validCommit).success).toBe(true);
    });

    it('should reject invalid hash length', () => {
      const invalidCommit = {
        hash: 'abc123', // too short
        shortHash: 'abc1234',
        message: 'Commit',
        author: 'Author',
        authorEmail: 'author@example.com',
        date: '2024-01-15T10:30:00Z',
        filesChanged: 1,
        additions: 10,
        deletions: 5,
      };
      expect(commitSchema.safeParse(invalidCommit).success).toBe(false);
    });

    it('should reject invalid shortHash length', () => {
      const invalidCommit = {
        hash: 'a'.repeat(40),
        shortHash: 'abc', // too short
        message: 'Commit',
        author: 'Author',
        authorEmail: 'author@example.com',
        date: '2024-01-15T10:30:00Z',
        filesChanged: 1,
        additions: 10,
        deletions: 5,
      };
      expect(commitSchema.safeParse(invalidCommit).success).toBe(false);
    });

    it('should reject invalid email', () => {
      const invalidCommit = {
        hash: 'a'.repeat(40),
        shortHash: 'a'.repeat(7),
        message: 'Commit',
        author: 'Author',
        authorEmail: 'not-an-email',
        date: '2024-01-15T10:30:00Z',
        filesChanged: 1,
        additions: 10,
        deletions: 5,
      };
      expect(commitSchema.safeParse(invalidCommit).success).toBe(false);
    });

    it('should reject negative counts', () => {
      const invalidCommit = {
        hash: 'a'.repeat(40),
        shortHash: 'a'.repeat(7),
        message: 'Commit',
        author: 'Author',
        authorEmail: 'author@example.com',
        date: '2024-01-15T10:30:00Z',
        filesChanged: -1,
        additions: 10,
        deletions: 5,
      };
      expect(commitSchema.safeParse(invalidCommit).success).toBe(false);
    });
  });

  describe('diffHunkSchema', () => {
    it('should accept valid diff hunk', () => {
      const validHunk = {
        oldStart: 10,
        oldLines: 5,
        newStart: 12,
        newLines: 7,
        content: '+added line\n-removed line\n context line',
      };
      expect(diffHunkSchema.safeParse(validHunk).success).toBe(true);
    });

    it('should accept hunk with zero lines', () => {
      const emptyHunk = {
        oldStart: 0,
        oldLines: 0,
        newStart: 0,
        newLines: 0,
        content: '',
      };
      expect(diffHunkSchema.safeParse(emptyHunk).success).toBe(true);
    });

    it('should reject negative line numbers', () => {
      const invalidHunk = {
        oldStart: -1,
        oldLines: 5,
        newStart: 10,
        newLines: 5,
        content: 'content',
      };
      expect(diffHunkSchema.safeParse(invalidHunk).success).toBe(false);
    });
  });

  describe('fileDiffSchema', () => {
    it('should accept valid file diff', () => {
      const validDiff = {
        path: 'src/file.ts',
        hunks: [
          {
            oldStart: 10,
            oldLines: 5,
            newStart: 10,
            newLines: 7,
            content: '+new line\n context',
          },
        ],
        additions: 2,
        deletions: 0,
        isBinary: false,
        isNew: false,
        isDeleted: false,
        isRenamed: false,
      };
      expect(fileDiffSchema.safeParse(validDiff).success).toBe(true);
    });

    it('should accept file diff with oldPath (rename)', () => {
      const renamedFile = {
        path: 'src/newfile.ts',
        oldPath: 'src/oldfile.ts',
        hunks: [],
        additions: 0,
        deletions: 0,
        isBinary: false,
        isNew: false,
        isDeleted: false,
        isRenamed: true,
      };
      expect(fileDiffSchema.safeParse(renamedFile).success).toBe(true);
    });

    it('should accept new file diff', () => {
      const newFile = {
        path: 'src/newfile.ts',
        hunks: [
          {
            oldStart: 0,
            oldLines: 0,
            newStart: 1,
            newLines: 10,
            content: '+line 1\n+line 2',
          },
        ],
        additions: 10,
        deletions: 0,
        isBinary: false,
        isNew: true,
        isDeleted: false,
        isRenamed: false,
      };
      expect(fileDiffSchema.safeParse(newFile).success).toBe(true);
    });

    it('should accept deleted file diff', () => {
      const deletedFile = {
        path: 'src/removed.ts',
        hunks: [],
        additions: 0,
        deletions: 50,
        isBinary: false,
        isNew: false,
        isDeleted: true,
        isRenamed: false,
      };
      expect(fileDiffSchema.safeParse(deletedFile).success).toBe(true);
    });

    it('should accept binary file diff', () => {
      const binaryFile = {
        path: 'assets/image.png',
        hunks: [],
        additions: 0,
        deletions: 0,
        isBinary: true,
        isNew: false,
        isDeleted: false,
        isRenamed: false,
      };
      expect(fileDiffSchema.safeParse(binaryFile).success).toBe(true);
    });

    it('should reject missing required boolean flags', () => {
      const invalidDiff = {
        path: 'src/file.ts',
        hunks: [],
        additions: 0,
        deletions: 0,
        // missing isBinary, isNew, isDeleted, isRenamed
      };
      expect(fileDiffSchema.safeParse(invalidDiff).success).toBe(false);
    });
  });
});
