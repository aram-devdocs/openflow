# Refactor Workflow

> A structured workflow for safely refactoring code while maintaining functionality.

## Variables

- `{@artifacts_path}` - Task-specific artifact folder
- `{@project_root}` - Project git repository root
- `{@worktree_path}` - Current worktree path

---

## Steps

### [ ] Step: Analysis

Analyze the current code and understand what needs to be refactored.

**Tasks:**
1. Identify the code to be refactored
2. Understand current functionality and behavior
3. Document all public interfaces and contracts
4. Map dependencies (what uses this code)
5. Identify code smells and technical debt
6. Assess test coverage of affected code
7. Determine refactoring goals and success criteria

**Deliverable:**
Save analysis to `{@artifacts_path}/analysis.md`

**Include:**
- Current code structure overview
- Public interfaces and contracts to preserve
- Dependency map (consumers of this code)
- Issues identified (code smells, complexity, etc.)
- Current test coverage assessment
- Refactoring goals and success criteria
- Risk assessment

---

### [ ] Step: Planning

Create a detailed refactoring plan with safe, incremental steps.

**Tasks:**
1. Review the analysis document
2. Define the target architecture
3. Break refactoring into small, atomic steps
4. Order steps to maintain working code at each stage
5. Identify points where verification is critical
6. Plan for backward compatibility if needed
7. Consider feature flags for gradual rollout

**Deliverable:**
Save the refactoring plan to `{@artifacts_path}/plan.md`

**Include:**
- Target architecture description
- Ordered list of refactoring steps
- Each step should:
  - Be atomic and independently deployable
  - Maintain all tests passing
  - Include verification criteria
- Rollback strategy for each step
- Dependencies between steps
- Estimated complexity per step

**Guiding Principles:**
- Never break functionality during refactoring
- Each step should leave code in a working state
- Tests must pass after every step
- Commit frequently with clear messages

---

### [ ] Step: Implementation

Execute the refactoring plan step by step.

**Tasks:**
1. Read the plan from `{@artifacts_path}/plan.md`
2. Execute each step in order
3. Run tests after each step
4. Update plan.md to mark completed steps with `[x]`
5. Commit after each logical change
6. Handle any issues without breaking existing functionality

**Guidelines:**
- Follow the boy scout rule: leave code cleaner than you found it
- Add tests for any untested code paths discovered
- Keep refactoring changes separate from behavior changes
- If a step fails, roll back and reassess
- Update documentation as interfaces change

**Verification after each step:**
- All tests pass
- Type checking passes
- No new linting errors
- Application still works as expected

---

### [ ] Step: Verification

Thoroughly verify the refactoring maintains all existing functionality.

**Tasks:**
1. Run the complete test suite
2. Verify all public interfaces work as before
3. Test all identified consumers/dependencies
4. Check for performance regressions
5. Review code for any missed issues
6. Validate against original refactoring goals

**Deliverable:**
Save verification results to `{@artifacts_path}/verification.md`

**Include:**
- Test suite results
- Interface contract verification
- Dependency verification results
- Performance comparison (if applicable)
- Code quality improvements achieved
- Goals met vs outstanding items

**Verification Commands:**
Run the project's configured verification commands:
- Tests
- Type checking
- Linting
- Build

---

### [ ] Step: Documentation

Update documentation and prepare for review.

**Tasks:**
1. Update code documentation/comments
2. Update architecture documentation if changed
3. Update API documentation if interfaces changed
4. Create migration guide if needed
5. Write clear commit messages and PR description
6. Document any breaking changes

**Deliverable:**
Refactoring ready for pull request with:
- Clean commit history (squash if needed)
- Passing CI checks
- Updated documentation
- Clear PR description explaining:
  - Why refactoring was needed
  - What changed
  - What stayed the same
  - Testing performed
  - Any migration steps needed
