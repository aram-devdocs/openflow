/**
 * Unit tests for useAgentSession hooks
 *
 * Tests cover:
 * - Query key factory structure and consistency
 * - Hook exports and availability
 * - Channel helper functions
 *
 * Note: These tests focus on the exported constants and query key structure.
 * Full hook behavior is tested via integration tests with a real backend.
 *
 * @module tests/hooks/useAgentSession.test
 */

import { agentSessionKeys, useAgentRawStream } from '@openflow/hooks';
import { rawOutputChannel } from '@openflow/hooks';
import { describe, expect, it } from 'vitest';

// ============================================================================
// Query Key Factory Tests
// ============================================================================

describe('agentSessionKeys', () => {
  describe('all', () => {
    it('should return base agent-sessions key', () => {
      expect(agentSessionKeys.all).toEqual(['agent-sessions']);
    });
  });

  describe('rawOutput', () => {
    it('should include session id', () => {
      const key = agentSessionKeys.rawOutput('session-123');
      expect(key).toEqual(['agent-sessions', 'raw-output', 'session-123']);
    });

    it('should create unique keys for different session IDs', () => {
      const key1 = agentSessionKeys.rawOutput('session-1');
      const key2 = agentSessionKeys.rawOutput('session-2');
      expect(key1).not.toEqual(key2);
    });

    it('should extend from all', () => {
      const key = agentSessionKeys.rawOutput('session-123');
      expect(key[0]).toBe('agent-sessions');
    });
  });

  describe('session', () => {
    it('should include session id', () => {
      const key = agentSessionKeys.session('session-123');
      expect(key).toEqual(['agent-sessions', 'sessions', 'session-123']);
    });
  });

  describe('sessionWithState', () => {
    it('should include session id and with-state suffix', () => {
      const key = agentSessionKeys.sessionWithState('session-123');
      expect(key).toEqual(['agent-sessions', 'sessions', 'session-123', 'with-state']);
    });
  });
});

// ============================================================================
// Channel Helper Tests
// ============================================================================

describe('rawOutputChannel', () => {
  it('should generate correct channel name', () => {
    const channel = rawOutputChannel('session-abc');
    expect(channel).toBe('raw-output-session-abc');
  });

  it('should generate unique channels for different session IDs', () => {
    const channel1 = rawOutputChannel('session-1');
    const channel2 = rawOutputChannel('session-2');
    expect(channel1).not.toBe(channel2);
  });

  it('should use hyphen-separated format', () => {
    const channel = rawOutputChannel('test-session');
    expect(channel).toMatch(/^raw-output-/);
  });
});

// ============================================================================
// Hook Export Tests
// ============================================================================

describe('useAgentRawStream', () => {
  it('should be exported as a function', () => {
    expect(typeof useAgentRawStream).toBe('function');
  });

  it('should have correct function name', () => {
    expect(useAgentRawStream.name).toBe('useAgentRawStream');
  });
});
