# Bug Fix Workflow

> A structured workflow for diagnosing and fixing bugs systematically.

## Variables

- `{@artifacts_path}` - Task-specific artifact folder
- `{@project_root}` - Project git repository root
- `{@worktree_path}` - Current worktree path

---

## Steps

### [ ] Step: Reproduce

Confirm the bug and establish reliable reproduction steps.

**Tasks:**
1. Read the bug report carefully
2. Understand the expected vs actual behavior
3. Set up the environment to reproduce the issue
4. Reproduce the bug consistently
5. Document exact reproduction steps
6. Capture evidence (screenshots, logs, error messages)

**Deliverable:**
Save reproduction details to `{@artifacts_path}/reproduction.md`

**Include:**
- Environment details (OS, browser, versions)
- Step-by-step reproduction instructions
- Expected behavior
- Actual behavior
- Error messages or stack traces
- Frequency (always, intermittent, specific conditions)

---

### [ ] Step: Root Cause

Identify the underlying cause of the bug.

**Tasks:**
1. Analyze the code path involved in the bug
2. Use debugging tools to trace execution
3. Review recent changes that might have introduced the bug
4. Identify the exact line(s) of code causing the issue
5. Understand why the bug occurs
6. Consider if this is a symptom of a larger issue

**Deliverable:**
Save root cause analysis to `{@artifacts_path}/analysis.md`

**Include:**
- Code location(s) responsible for the bug
- Explanation of why the bug occurs
- Any related issues discovered
- Impact assessment (what else might be affected)
- Potential solutions considered

---

### [ ] Step: Fix

Implement the fix for the identified root cause.

**Tasks:**
1. Review the root cause analysis
2. Design the minimal fix that addresses the issue
3. Implement the fix
4. Add or update tests to cover the bug scenario
5. Ensure the fix doesn't introduce regressions
6. Update any relevant documentation

**Guidelines:**
- Prefer minimal, focused fixes
- Avoid unrelated changes in the same commit
- Write a test that would have caught this bug
- Consider backward compatibility

**Verification:**
- The original bug no longer reproduces
- New test case passes
- Existing tests still pass
- No new linting or type errors

---

### [ ] Step: Verify

Thoroughly verify the fix and check for side effects.

**Tasks:**
1. Verify the original bug is fixed
2. Run the full test suite
3. Test related functionality for regressions
4. Test edge cases around the fix
5. Review the fix for potential issues
6. Check performance impact if applicable

**Deliverable:**
Save verification results to `{@artifacts_path}/verification.md`

**Include:**
- Confirmation that bug is fixed
- Test results summary
- Any edge cases tested
- Related areas verified
- Performance impact (if applicable)

**Verification Commands:**
Run the project's configured verification commands:
- Tests
- Type checking
- Linting
- Build

---

### [ ] Step: Document

Prepare the fix for review and document findings.

**Tasks:**
1. Write a clear commit message explaining the fix
2. Update any relevant documentation
3. Add comments to complex fix logic if needed
4. Prepare PR description with:
   - Bug summary
   - Root cause
   - Solution approach
   - Testing performed

**Deliverable:**
Fix ready for pull request with:
- Atomic commit with descriptive message
- Passing CI checks
- Test coverage for the bug scenario
- Clear PR description
