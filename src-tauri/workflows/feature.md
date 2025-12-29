# Feature Workflow

> A structured workflow for implementing new features from requirements to completion.

## Variables

- `{@artifacts_path}` - Task-specific artifact folder
- `{@project_root}` - Project git repository root
- `{@worktree_path}` - Current worktree path

---

## Steps

### [ ] Step: Requirements

Analyze the feature request and create a comprehensive Product Requirements Document (PRD).

**Tasks:**
1. Review the existing codebase to understand current architecture and patterns
2. Analyze the feature definition and user requirements
3. Identify stakeholders and use cases
4. Define acceptance criteria
5. List any constraints, dependencies, or technical limitations
6. Ask clarifying questions if requirements are ambiguous

**Deliverable:**
Save the PRD to `{@artifacts_path}/requirements.md`

**The PRD should include:**
- Executive summary
- Problem statement
- Proposed solution
- User stories and use cases
- Acceptance criteria
- Out of scope items
- Dependencies and constraints

---

### [ ] Step: Technical Specification

Create a detailed technical specification based on the PRD.

**Tasks:**
1. Review the requirements document
2. Analyze existing codebase architecture
3. Design the technical solution
4. Identify components to create or modify
5. Define data models and API contracts
6. Consider error handling and edge cases
7. Plan for testing strategy

**Deliverable:**
Save the technical spec to `{@artifacts_path}/spec.md`

**The spec should include:**
- Architecture overview
- Component design
- Data models and schemas
- API endpoints (if applicable)
- Integration points
- Security considerations
- Performance considerations
- Testing approach

---

### [ ] Step: Planning

Create a detailed implementation plan with actionable steps.

**Tasks:**
1. Review requirements and technical spec
2. Break down work into discrete, testable units
3. Order tasks by dependencies
4. Identify potential risks and mitigation strategies
5. Estimate complexity for each step

**Deliverable:**
Save the implementation plan to `{@artifacts_path}/plan.md`

**The plan should include:**
- Ordered list of implementation steps
- Each step should be:
  - Atomic (completable in one session)
  - Testable (has clear verification criteria)
  - Specific (no ambiguity)
- Verification commands for each step
- Rollback considerations

---

### [ ] Step: Implementation

Execute the implementation plan step by step.

**Tasks:**
1. Read the implementation plan from `{@artifacts_path}/plan.md`
2. Execute each step in order
3. Run verification after each step
4. Update plan.md to mark completed steps with `[x]`
5. Commit changes after each logical unit
6. Handle any issues that arise during implementation

**Guidelines:**
- Follow existing code patterns in the codebase
- Write tests alongside implementation
- Keep commits atomic and well-documented
- If blocked, document the issue and ask for help

**Verification:**
Run the project's configured verification commands:
- Tests
- Type checking
- Linting
- Build

---

### [ ] Step: Review

Prepare the feature for code review.

**Tasks:**
1. Ensure all tests pass
2. Review own code for issues
3. Update documentation if needed
4. Create a summary of changes
5. Address any technical debt introduced

**Deliverable:**
Feature ready for pull request with:
- Clean commit history
- Passing CI checks
- Documentation updated
- PR description drafted
