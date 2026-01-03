//! Workflow Service
//!
//! Handles parsing workflow markdown files, listing templates,
//! managing built-in workflow templates, and variable substitution.
//!
//! ## Logging
//!
//! This service uses structured logging at appropriate levels:
//! - `debug!` - Parsing details, file scanning, variable substitution
//! - `info!` - Template operations (list, parse results with step counts)
//! - `warn!` - Parse failures for individual files, missing templates
//! - `error!` - File system errors, critical failures
//!
//! ## Error Handling
//!
//! All public functions return `ServiceResult<T>` for consistent error handling.
//! Errors include context about the operation and relevant parameters.

use std::collections::HashMap;
use std::path::Path;

use chrono::Utc;
use tracing::{debug, error, info, warn};

use openflow_contracts::{WorkflowContext, WorkflowStep, WorkflowStepStatus, WorkflowTemplate};

use super::{ServiceError, ServiceResult};

/// Parse workflow steps from markdown content.
///
/// Parses markdown looking for step headers in the format:
/// `### [ ] Step: Step Name` (pending)
/// `### [-] Step: Step Name` (in progress)
/// `### [x] Step: Step Name` (completed)
///
/// Returns a vector of parsed workflow steps with their descriptions.
///
/// # Example
///
/// ```rust,ignore
/// use openflow_core::services::workflow;
///
/// let content = r#"
/// # My Workflow
///
/// ### [ ] Step: Requirements
/// Create the requirements document.
///
/// ### [ ] Step: Implementation
/// Implement the feature.
/// "#;
///
/// let steps = workflow::parse(content).unwrap();
/// assert_eq!(steps.len(), 2);
/// assert_eq!(steps[0].name, "Requirements");
/// ```
pub fn parse(content: &str) -> ServiceResult<Vec<WorkflowStep>> {
    debug!(content_len = content.len(), "Parsing workflow content");

    let mut steps = Vec::new();
    let mut current_step: Option<(String, WorkflowStepStatus, Vec<String>)> = None;
    let mut index = 0;

    for line in content.lines() {
        // Check if this line starts a new step
        if let Some((name, status)) = parse_step_header(line) {
            debug!(name = %name, ?status, "Found step header");
            // Save previous step if exists
            if let Some((prev_name, prev_status, prev_lines)) = current_step.take() {
                let description = prev_lines.join("\n").trim().to_string();
                steps.push(WorkflowStep {
                    index,
                    name: prev_name,
                    description,
                    status: prev_status,
                    chat_id: None,
                });
                index += 1;
            }
            // Start new step
            current_step = Some((name, status, Vec::new()));
        } else if let Some((_, _, ref mut lines)) = current_step {
            // Add line to current step's description
            lines.push(line.to_string());
        }
    }

    // Don't forget the last step
    if let Some((name, status, lines)) = current_step {
        let description = lines.join("\n").trim().to_string();
        steps.push(WorkflowStep {
            index,
            name,
            description,
            status,
            chat_id: None,
        });
    }

    // Log summary of parsed steps
    if steps.is_empty() {
        debug!("No workflow steps found in content");
    } else {
        let step_names: Vec<&str> = steps.iter().map(|s| s.name.as_str()).collect();
        let (pending, in_progress, completed) = steps.iter().fold(
            (0usize, 0usize, 0usize),
            |(pending, in_progress, completed), step| match step.status {
                WorkflowStepStatus::Pending => (pending + 1, in_progress, completed),
                WorkflowStepStatus::InProgress => (pending, in_progress + 1, completed),
                WorkflowStepStatus::Completed => (pending, in_progress, completed + 1),
                WorkflowStepStatus::Skipped => (pending, in_progress, completed),
            },
        );
        info!(
            step_count = steps.len(),
            ?step_names,
            pending,
            in_progress,
            completed,
            "Parsed workflow steps"
        );
    }

    Ok(steps)
}

/// Parse a step header line into (name, status) if valid.
///
/// Valid formats:
/// - `### [ ] Step: Step Name` -> Pending
/// - `### [-] Step: Step Name` -> InProgress
/// - `### [x] Step: Step Name` -> Completed
/// - `### [X] Step: Step Name` -> Completed (case insensitive)
fn parse_step_header(line: &str) -> Option<(String, WorkflowStepStatus)> {
    let trimmed = line.trim();

    // Must start with exactly ### (not ## or ####)
    if !trimmed.starts_with("### ") {
        return None;
    }

    // Check for the bracket pattern (skip the "### " prefix)
    let after_hashes = trimmed[4..].trim();

    // Parse the status from brackets
    let (status, rest) = if let Some(rest) = after_hashes.strip_prefix("[ ]") {
        (WorkflowStepStatus::Pending, rest)
    } else if let Some(rest) = after_hashes.strip_prefix("[-]") {
        (WorkflowStepStatus::InProgress, rest)
    } else if let Some(rest) = after_hashes.strip_prefix("[x]") {
        (WorkflowStepStatus::Completed, rest)
    } else if let Some(rest) = after_hashes.strip_prefix("[X]") {
        (WorkflowStepStatus::Completed, rest)
    } else {
        return None;
    };

    // Extract the step name after "Step:"
    let rest = rest.trim();
    if !rest.starts_with("Step:") {
        return None;
    }

    let name = rest.trim_start_matches("Step:").trim().to_string();
    if name.is_empty() {
        return None;
    }

    Some((name, status))
}

/// List workflow templates from a folder.
///
/// Scans the specified folder for `.md` files and parses them as workflow templates.
/// Returns an empty list if the folder doesn't exist.
///
/// # Arguments
///
/// * `folder_path` - Path to the folder containing workflow markdown files
///
/// # Example
///
/// ```rust,ignore
/// use openflow_core::services::workflow;
/// use std::path::Path;
///
/// let templates = workflow::list_templates(Path::new("./workflows")).await?;
/// for template in templates {
///     println!("Template: {}", template.name);
/// }
/// ```
pub async fn list_templates(folder_path: &Path) -> ServiceResult<Vec<WorkflowTemplate>> {
    debug!(
        folder = %folder_path.display(),
        "Listing workflow templates"
    );

    let mut templates = Vec::new();

    if !folder_path.exists() {
        debug!(folder = %folder_path.display(), "Template folder does not exist");
        return Ok(templates);
    }

    let entries = match std::fs::read_dir(folder_path) {
        Ok(entries) => entries,
        Err(e) => {
            error!(
                folder = %folder_path.display(),
                error = %e,
                "Failed to read template folder"
            );
            return Err(ServiceError::Io(e));
        }
    };

    let mut files_scanned = 0;
    let mut files_parsed = 0;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().is_some_and(|ext| ext == "md") {
            files_scanned += 1;
            debug!(file = %path.display(), "Scanning template file");

            match std::fs::read_to_string(&path) {
                Ok(content) => {
                    let file_name = path.file_stem().unwrap_or_default().to_string_lossy();
                    let name = extract_title(&content).unwrap_or_else(|| {
                        // Convert filename to title case
                        file_name
                            .split(['_', '-'])
                            .map(|word| {
                                let mut chars = word.chars();
                                match chars.next() {
                                    Some(first) => {
                                        first.to_uppercase().chain(chars).collect::<String>()
                                    }
                                    None => String::new(),
                                }
                            })
                            .collect::<Vec<_>>()
                            .join(" ")
                    });

                    let description = extract_description(&content);
                    let steps = parse(&content).unwrap_or_default();
                    let now = Utc::now().to_rfc3339();

                    debug!(
                        template_name = %name,
                        step_count = steps.len(),
                        "Parsed template"
                    );

                    templates.push(WorkflowTemplate {
                        id: format!("file:{}", file_name),
                        name,
                        description,
                        content: content.clone(),
                        is_builtin: false,
                        steps,
                        created_at: now.clone(),
                        updated_at: now,
                    });
                    files_parsed += 1;
                }
                Err(e) => {
                    warn!(
                        file = %path.display(),
                        error = %e,
                        "Failed to read template file"
                    );
                }
            }
        }
    }

    // Sort by name
    templates.sort_by(|a, b| a.name.cmp(&b.name));

    let template_names: Vec<&str> = templates.iter().map(|t| t.name.as_str()).collect();
    info!(
        template_count = templates.len(),
        folder = %folder_path.display(),
        files_scanned,
        files_parsed,
        ?template_names,
        "Listed templates"
    );

    Ok(templates)
}

/// Get built-in workflow templates.
///
/// Returns the default workflow templates: Feature, Bug Fix, and Refactor.
/// These templates are always available and don't require file access.
///
/// # Example
///
/// ```rust,ignore
/// use openflow_core::services::workflow;
///
/// let templates = workflow::get_builtin_templates().unwrap();
/// assert_eq!(templates.len(), 3);
/// assert!(templates.iter().any(|t| t.name == "Feature"));
/// ```
pub fn get_builtin_templates() -> ServiceResult<Vec<WorkflowTemplate>> {
    debug!("Retrieving built-in workflow templates");

    let now = Utc::now().to_rfc3339();
    let templates = vec![
        create_feature_template(&now)?,
        create_bugfix_template(&now)?,
        create_refactor_template(&now)?,
    ];

    let template_info: Vec<(&str, usize)> = templates
        .iter()
        .map(|t| (t.name.as_str(), t.steps.len()))
        .collect();
    info!(
        template_count = templates.len(),
        ?template_info,
        "Retrieved built-in templates"
    );

    Ok(templates)
}

/// Get a built-in template by ID.
///
/// # Arguments
///
/// * `id` - The template ID (e.g., "builtin:feature", "builtin:bugfix")
///
/// # Returns
///
/// Returns `Some(template)` if found, `None` if not a valid built-in template.
pub fn get_builtin_template(id: &str) -> ServiceResult<Option<WorkflowTemplate>> {
    debug!(id = %id, "Looking up built-in template");

    let template = get_builtin_templates()?.into_iter().find(|t| t.id == id);

    match &template {
        Some(t) => info!(
            id = %t.id,
            name = %t.name,
            step_count = t.steps.len(),
            "Found built-in template"
        ),
        None => warn!(id = %id, "Built-in template not found"),
    }

    Ok(template)
}

/// Get a template by ID (either built-in or file-based).
///
/// For built-in templates (prefixed with "builtin:"), returns the template directly.
/// For file-based templates, looks up in the specified workflows folder.
///
/// # Arguments
///
/// * `id` - The template ID (e.g., "builtin:feature" or "file:custom")
/// * `workflows_folder_path` - Optional path to the workflows folder for file-based templates
///
/// # Example
///
/// ```rust,ignore
/// use openflow_core::services::workflow;
/// use std::path::Path;
///
/// // Get a built-in template
/// let template = workflow::get_template("builtin:feature", None).await?;
///
/// // Get a file-based template
/// let template = workflow::get_template(
///     "file:custom",
///     Some(Path::new("./workflows"))
/// ).await?;
/// ```
pub async fn get_template(
    id: &str,
    workflows_folder_path: Option<&Path>,
) -> ServiceResult<Option<WorkflowTemplate>> {
    debug!(id = %id, "Looking up template");

    // Check if it's a built-in template
    if id.starts_with("builtin:") {
        return get_builtin_template(id);
    }

    // For file-based templates, we need the workflows folder
    let folder_path = match workflows_folder_path {
        Some(path) => path,
        None => {
            warn!(
                id = %id,
                "No workflows folder path provided for file-based template"
            );
            return Ok(None);
        }
    };

    debug!(
        folder = %folder_path.display(),
        "Searching for file-based template"
    );
    let templates = list_templates(folder_path).await?;

    let template = templates.into_iter().find(|t| t.id == id);

    match &template {
        Some(t) => info!(
            id = %t.id,
            name = %t.name,
            step_count = t.steps.len(),
            "Found file-based template"
        ),
        None => warn!(
            id = %id,
            folder = %folder_path.display(),
            "Template not found"
        ),
    }

    Ok(template)
}

/// Substitute workflow variables in content using a HashMap.
///
/// Variables are in format: {@variable_name}
/// This method is provided for simple use cases with arbitrary variables.
///
/// # Arguments
///
/// * `content` - The content string to substitute variables in
/// * `vars` - A HashMap of variable names to values
///
/// # Example
///
/// ```rust,ignore
/// use openflow_core::services::workflow;
/// use std::collections::HashMap;
///
/// let content = "Hello {@name}, welcome to {@project}!";
/// let mut vars = HashMap::new();
/// vars.insert("name".to_string(), "Alice".to_string());
/// vars.insert("project".to_string(), "OpenFlow".to_string());
///
/// let result = workflow::substitute_variables(content, &vars).unwrap();
/// assert_eq!(result, "Hello Alice, welcome to OpenFlow!");
/// ```
pub fn substitute_variables(
    content: &str,
    vars: &HashMap<String, String>,
) -> ServiceResult<String> {
    debug!(
        var_count = vars.len(),
        content_len = content.len(),
        "Substituting variables"
    );

    let mut result = content.to_string();
    let mut substitutions = 0;

    for (key, value) in vars {
        let pattern = format!("{{@{}}}", key);
        if result.contains(&pattern) {
            result = result.replace(&pattern, value);
            substitutions += 1;
            debug!(key = %key, "Substituted variable");
        }
    }

    debug!(
        total_vars = vars.len(),
        substitutions, "Completed variable substitution"
    );

    Ok(result)
}

/// Substitute workflow variables in content using the WorkflowContext.
///
/// Uses the WorkflowContext::substitute method for consistent variable substitution.
/// This is the preferred method when using standard workflow variables.
///
/// # Arguments
///
/// * `content` - The content string to substitute variables in
/// * `context` - The WorkflowContext containing variable values
///
/// # Example
///
/// ```rust,ignore
/// use openflow_core::services::workflow;
/// use openflow_contracts::WorkflowContext;
///
/// let content = "Save to {@artifacts_path}/spec.md in {@project_root}";
/// let context = WorkflowContext::new()
///     .with_artifacts_path("/tasks/123")
///     .with_project_root("/home/project");
///
/// let result = workflow::substitute_with_context(content, &context).unwrap();
/// assert_eq!(result, "Save to /tasks/123/spec.md in /home/project");
/// ```
pub fn substitute_with_context(content: &str, context: &WorkflowContext) -> ServiceResult<String> {
    debug!(
        content_len = content.len(),
        has_artifacts_path = context.artifacts_path.is_some(),
        has_project_root = context.project_root.is_some(),
        has_worktree_path = context.worktree_path.is_some(),
        has_task_id = context.task_id.is_some(),
        has_task_title = context.task_title.is_some(),
        has_project_name = context.project_name.is_some(),
        "Substituting workflow context variables"
    );

    Ok(context.substitute(content))
}

/// Extract the title from markdown content (first # heading).
fn extract_title(content: &str) -> Option<String> {
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("# ") && !trimmed.starts_with("##") {
            return Some(trimmed.trim_start_matches('#').trim().to_string());
        }
    }
    None
}

/// Extract description from markdown content (text after title, before first ##).
fn extract_description(content: &str) -> Option<String> {
    let mut found_title = false;
    let mut description_lines = Vec::new();

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("# ") && !trimmed.starts_with("##") {
            found_title = true;
            continue;
        }

        if found_title {
            if trimmed.starts_with("##") {
                break;
            }
            if !trimmed.is_empty() {
                description_lines.push(trimmed);
            }
        }
    }

    if description_lines.is_empty() {
        None
    } else {
        Some(description_lines.join(" "))
    }
}

/// Create the Feature workflow template.
fn create_feature_template(timestamp: &str) -> ServiceResult<WorkflowTemplate> {
    let content = r#"# Feature Workflow

A structured workflow for implementing new features with proper requirements gathering, specification, planning, and implementation.

## Steps

### [ ] Step: Requirements
Create a Product Requirements Document (PRD) based on the feature description.

**Tasks:**
1. Review existing codebase to understand current architecture
2. Analyze the feature definition and scope
3. Ask clarifying questions if needed
4. Document functional and non-functional requirements
5. Save to `{@artifacts_path}/requirements.md`

### [ ] Step: Technical Specification
Create a detailed technical specification based on the PRD.

**Tasks:**
1. Review the requirements document
2. Design the technical architecture
3. Define API contracts and data models
4. Document integration points
5. Save to `{@artifacts_path}/spec.md`

### [ ] Step: Planning
Create a detailed implementation plan with micro-steps.

**Tasks:**
1. Break down the spec into implementable tasks
2. Define dependencies between tasks
3. Identify potential risks and mitigations
4. Save to `{@artifacts_path}/plan.md`

### [ ] Step: Implementation
Execute the implementation plan step by step.

**Tasks:**
1. Follow the plan.md implementation steps
2. Write tests before implementation (TDD)
3. Commit changes atomically
4. Update plan.md as steps are completed
"#;

    let steps = parse(content)?;

    Ok(WorkflowTemplate {
        id: "builtin:feature".to_string(),
        name: "Feature".to_string(),
        description: Some(
            "A structured workflow for implementing new features with proper requirements gathering, specification, planning, and implementation."
                .to_string(),
        ),
        content: content.to_string(),
        is_builtin: true,
        steps,
        created_at: timestamp.to_string(),
        updated_at: timestamp.to_string(),
    })
}

/// Create the Bug Fix workflow template.
fn create_bugfix_template(timestamp: &str) -> ServiceResult<WorkflowTemplate> {
    let content = r#"# Bug Fix Workflow

A methodical workflow for diagnosing and fixing bugs with proper root cause analysis and verification.

## Steps

### [ ] Step: Reproduce
Reproduce the bug and document the reproduction steps.

**Tasks:**
1. Understand the reported bug behavior
2. Set up the environment to reproduce
3. Document exact reproduction steps
4. Capture any error messages or logs
5. Save to `{@artifacts_path}/bug-report.md`

### [ ] Step: Root Cause Analysis
Identify the root cause of the bug.

**Tasks:**
1. Trace the code path
2. Identify the problematic code section
3. Understand why the bug occurs
4. Document the root cause analysis
5. Save to `{@artifacts_path}/analysis.md`

### [ ] Step: Fix
Implement the fix for the bug.

**Tasks:**
1. Write a failing test that reproduces the bug
2. Implement the minimal fix
3. Ensure the test passes
4. Check for regressions

### [ ] Step: Verify
Verify the fix is complete and doesn't cause regressions.

**Tasks:**
1. Run all related tests
2. Manually verify the fix
3. Check edge cases
4. Document the fix in `{@artifacts_path}/resolution.md`
"#;

    let steps = parse(content)?;

    Ok(WorkflowTemplate {
        id: "builtin:bugfix".to_string(),
        name: "Bug Fix".to_string(),
        description: Some(
            "A methodical workflow for diagnosing and fixing bugs with proper root cause analysis and verification."
                .to_string(),
        ),
        content: content.to_string(),
        is_builtin: true,
        steps,
        created_at: timestamp.to_string(),
        updated_at: timestamp.to_string(),
    })
}

/// Create the Refactor workflow template.
fn create_refactor_template(timestamp: &str) -> ServiceResult<WorkflowTemplate> {
    let content = r#"# Refactor Workflow

A safe workflow for refactoring code with proper analysis, planning, and verification.

## Steps

### [ ] Step: Analysis
Analyze the code to be refactored and document current state.

**Tasks:**
1. Identify code smells and issues
2. Map dependencies and usages
3. Measure current metrics (complexity, coverage)
4. Document findings in `{@artifacts_path}/analysis.md`

### [ ] Step: Planning
Plan the refactoring approach with safety measures.

**Tasks:**
1. Define the target architecture
2. Break down into safe, incremental steps
3. Identify risks and rollback strategies
4. Save to `{@artifacts_path}/plan.md`

### [ ] Step: Implementation
Execute the refactoring plan incrementally.

**Tasks:**
1. Ensure comprehensive test coverage first
2. Refactor in small, reversible steps
3. Run tests after each change
4. Commit frequently with clear messages

### [ ] Step: Verification
Verify the refactoring is complete and behavior is preserved.

**Tasks:**
1. Run full test suite
2. Compare metrics before/after
3. Review all changes
4. Document improvements in `{@artifacts_path}/summary.md`
"#;

    let steps = parse(content)?;

    Ok(WorkflowTemplate {
        id: "builtin:refactor".to_string(),
        name: "Refactor".to_string(),
        description: Some(
            "A safe workflow for refactoring code with proper analysis, planning, and verification."
                .to_string(),
        ),
        content: content.to_string(),
        is_builtin: true,
        steps,
        created_at: timestamp.to_string(),
        updated_at: timestamp.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_parse_empty_content() {
        let content = "";
        let steps = parse(content).unwrap();
        assert!(steps.is_empty());
    }

    #[test]
    fn test_parse_no_steps() {
        let content = r#"
# My Workflow

Some description here.

## Configuration

Nothing relevant.
"#;
        let steps = parse(content).unwrap();
        assert!(steps.is_empty());
    }

    #[test]
    fn test_parse_single_step_pending() {
        let content = r#"
# Workflow

### [ ] Step: Requirements
Create the requirements document.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 1);
        assert_eq!(steps[0].index, 0);
        assert_eq!(steps[0].name, "Requirements");
        assert_eq!(steps[0].status, WorkflowStepStatus::Pending);
        assert!(steps[0].description.contains("Create the requirements"));
    }

    #[test]
    fn test_parse_single_step_completed() {
        let content = r#"
### [x] Step: Done Step
This step is done.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 1);
        assert_eq!(steps[0].name, "Done Step");
        assert_eq!(steps[0].status, WorkflowStepStatus::Completed);
    }

    #[test]
    fn test_parse_single_step_in_progress() {
        let content = r#"
### [-] Step: Working On It
Currently in progress.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 1);
        assert_eq!(steps[0].name, "Working On It");
        assert_eq!(steps[0].status, WorkflowStepStatus::InProgress);
    }

    #[test]
    fn test_parse_multiple_steps() {
        let content = r#"
# Feature Workflow

## Steps

### [x] Step: Requirements
PRD completed.

### [-] Step: Specification
Working on spec.

### [ ] Step: Planning
Not started yet.

### [ ] Step: Implementation
Will do later.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 4);

        assert_eq!(steps[0].index, 0);
        assert_eq!(steps[0].name, "Requirements");
        assert_eq!(steps[0].status, WorkflowStepStatus::Completed);

        assert_eq!(steps[1].index, 1);
        assert_eq!(steps[1].name, "Specification");
        assert_eq!(steps[1].status, WorkflowStepStatus::InProgress);

        assert_eq!(steps[2].index, 2);
        assert_eq!(steps[2].name, "Planning");
        assert_eq!(steps[2].status, WorkflowStepStatus::Pending);

        assert_eq!(steps[3].index, 3);
        assert_eq!(steps[3].name, "Implementation");
        assert_eq!(steps[3].status, WorkflowStepStatus::Pending);
    }

    #[test]
    fn test_parse_step_with_multiline_description() {
        let content = r#"
### [ ] Step: Complex Step
First line of description.

Second paragraph.

- List item 1
- List item 2

```rust
fn example() {}
```

### [ ] Step: Next Step
Next step description.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 2);
        assert!(steps[0].description.contains("First line"));
        assert!(steps[0].description.contains("Second paragraph"));
        assert!(steps[0].description.contains("List item 1"));
        assert!(steps[0].description.contains("fn example()"));
    }

    #[test]
    fn test_parse_case_insensitive_completed() {
        let content = r#"
### [X] Step: Done With Capital X
Done.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 1);
        assert_eq!(steps[0].status, WorkflowStepStatus::Completed);
    }

    #[test]
    fn test_parse_step_header_invalid_formats() {
        // Missing brackets
        assert!(parse_step_header("### Step: Name").is_none());

        // Wrong bracket content
        assert!(parse_step_header("### [?] Step: Name").is_none());

        // Not a step
        assert!(parse_step_header("### [ ] Task: Name").is_none());

        // Wrong heading level
        assert!(parse_step_header("## [ ] Step: Name").is_none());
        assert!(parse_step_header("#### [ ] Step: Name").is_none());

        // Empty name
        assert!(parse_step_header("### [ ] Step:").is_none());
        assert!(parse_step_header("### [ ] Step:   ").is_none());
    }

    #[test]
    fn test_get_builtin_templates() {
        let templates = get_builtin_templates().unwrap();

        assert_eq!(templates.len(), 3);

        // Check Feature template
        let feature = templates
            .iter()
            .find(|t| t.id == "builtin:feature")
            .unwrap();
        assert_eq!(feature.name, "Feature");
        assert!(feature.is_builtin);
        assert_eq!(feature.steps.len(), 4);
        assert_eq!(feature.steps[0].name, "Requirements");
        assert_eq!(feature.steps[1].name, "Technical Specification");
        assert_eq!(feature.steps[2].name, "Planning");
        assert_eq!(feature.steps[3].name, "Implementation");

        // Check Bug Fix template
        let bugfix = templates.iter().find(|t| t.id == "builtin:bugfix").unwrap();
        assert_eq!(bugfix.name, "Bug Fix");
        assert!(bugfix.is_builtin);
        assert_eq!(bugfix.steps.len(), 4);
        assert_eq!(bugfix.steps[0].name, "Reproduce");
        assert_eq!(bugfix.steps[1].name, "Root Cause Analysis");
        assert_eq!(bugfix.steps[2].name, "Fix");
        assert_eq!(bugfix.steps[3].name, "Verify");

        // Check Refactor template
        let refactor = templates
            .iter()
            .find(|t| t.id == "builtin:refactor")
            .unwrap();
        assert_eq!(refactor.name, "Refactor");
        assert!(refactor.is_builtin);
        assert_eq!(refactor.steps.len(), 4);
    }

    #[test]
    fn test_get_builtin_template_by_id() {
        let feature = get_builtin_template("builtin:feature").unwrap();
        assert!(feature.is_some());
        assert_eq!(feature.unwrap().name, "Feature");

        let bugfix = get_builtin_template("builtin:bugfix").unwrap();
        assert!(bugfix.is_some());
        assert_eq!(bugfix.unwrap().name, "Bug Fix");

        let nonexistent = get_builtin_template("builtin:nonexistent").unwrap();
        assert!(nonexistent.is_none());
    }

    #[test]
    fn test_substitute_variables() {
        let content = "Hello {@name}, welcome to {@project}!";
        let mut vars = HashMap::new();
        vars.insert("name".to_string(), "Alice".to_string());
        vars.insert("project".to_string(), "OpenFlow".to_string());

        let result = substitute_variables(content, &vars).unwrap();
        assert_eq!(result, "Hello Alice, welcome to OpenFlow!");
    }

    #[test]
    fn test_substitute_variables_missing() {
        let content = "Hello {@name}, welcome to {@project}!";
        let vars = HashMap::new();

        let result = substitute_variables(content, &vars).unwrap();
        assert_eq!(result, "Hello {@name}, welcome to {@project}!");
    }

    #[test]
    fn test_substitute_with_context() {
        let content = "Save to {@artifacts_path}/spec.md in {@project_root}";
        let context = WorkflowContext {
            artifacts_path: Some("/tasks/123".to_string()),
            project_root: Some("/home/project".to_string()),
            ..Default::default()
        };

        let result = substitute_with_context(content, &context).unwrap();
        assert_eq!(result, "Save to /tasks/123/spec.md in /home/project");
    }

    #[test]
    fn test_substitute_with_context_partial() {
        let content = "Path: {@artifacts_path}, Worktree: {@worktree_path}";
        let context = WorkflowContext {
            artifacts_path: Some("/tasks/123".to_string()),
            ..Default::default()
        };

        let result = substitute_with_context(content, &context).unwrap();
        assert_eq!(result, "Path: /tasks/123, Worktree: {@worktree_path}");
    }

    #[test]
    fn test_substitute_with_context_all() {
        let content = "{@artifacts_path} {@project_root} {@worktree_path} {@task_id} {@task_title} {@project_name}";
        let context = WorkflowContext {
            artifacts_path: Some("A".to_string()),
            project_root: Some("B".to_string()),
            worktree_path: Some("C".to_string()),
            task_id: Some("D".to_string()),
            task_title: Some("E".to_string()),
            project_name: Some("F".to_string()),
        };

        let result = substitute_with_context(content, &context).unwrap();
        assert_eq!(result, "A B C D E F");
    }

    #[test]
    fn test_extract_title() {
        let content = r#"
# My Workflow Title

Some description.
"#;
        let title = extract_title(content);
        assert_eq!(title, Some("My Workflow Title".to_string()));
    }

    #[test]
    fn test_extract_title_no_title() {
        let content = "## Not a title\n\nSome content.";
        let title = extract_title(content);
        assert!(title.is_none());
    }

    #[test]
    fn test_extract_description() {
        let content = r#"
# My Workflow

This is the description paragraph.

## Steps

### [ ] Step: First
"#;
        let desc = extract_description(content);
        assert_eq!(desc, Some("This is the description paragraph.".to_string()));
    }

    #[test]
    fn test_extract_description_multiline() {
        let content = r#"
# My Workflow

First line.
Second line.

## Steps
"#;
        let desc = extract_description(content);
        assert_eq!(desc, Some("First line. Second line.".to_string()));
    }

    #[tokio::test]
    async fn test_list_templates_empty_folder() {
        let temp_dir = TempDir::new().unwrap();
        let templates = list_templates(temp_dir.path()).await.unwrap();
        assert!(templates.is_empty());
    }

    #[tokio::test]
    async fn test_list_templates_nonexistent_folder() {
        let path = Path::new("/nonexistent/path/that/does/not/exist");
        let templates = list_templates(path).await.unwrap();
        assert!(templates.is_empty());
    }

    #[tokio::test]
    async fn test_list_templates_with_files() {
        let temp_dir = TempDir::new().unwrap();

        // Create test workflow files
        let workflow1 = r#"
# Custom Feature Workflow

A custom workflow for features.

## Steps

### [ ] Step: Step One
Description one.

### [ ] Step: Step Two
Description two.
"#;

        let workflow2 = r#"
# Bug Fix Custom

Custom bug fix workflow.

## Steps

### [ ] Step: Investigate
Look into it.
"#;

        std::fs::write(temp_dir.path().join("custom-feature.md"), workflow1).unwrap();
        std::fs::write(temp_dir.path().join("bug-fix-custom.md"), workflow2).unwrap();

        // Also add a non-md file that should be ignored
        std::fs::write(temp_dir.path().join("readme.txt"), "ignore this").unwrap();

        let templates = list_templates(temp_dir.path()).await.unwrap();

        assert_eq!(templates.len(), 2);

        // Should be sorted by name
        let first = &templates[0];
        assert_eq!(first.name, "Bug Fix Custom");
        assert!(!first.is_builtin);
        assert_eq!(first.steps.len(), 1);
        assert_eq!(first.steps[0].name, "Investigate");

        let second = &templates[1];
        assert_eq!(second.name, "Custom Feature Workflow");
        assert!(!second.is_builtin);
        assert_eq!(second.steps.len(), 2);
    }

    #[tokio::test]
    async fn test_list_templates_uses_filename_when_no_title() {
        let temp_dir = TempDir::new().unwrap();

        // Workflow without a title
        let workflow = r#"
## Steps

### [ ] Step: Do Something
Instructions here.
"#;

        std::fs::write(temp_dir.path().join("my_custom_workflow.md"), workflow).unwrap();

        let templates = list_templates(temp_dir.path()).await.unwrap();

        assert_eq!(templates.len(), 1);
        assert_eq!(templates[0].name, "My Custom Workflow");
    }

    #[test]
    fn test_builtin_templates_have_variables() {
        let templates = get_builtin_templates().unwrap();

        for template in templates {
            // Each template should use {@artifacts_path}
            assert!(
                template.content.contains("{@artifacts_path}"),
                "Template '{}' should use {{@artifacts_path}}",
                template.name
            );
        }
    }

    #[test]
    fn test_parse_real_plan_format() {
        // Test with the actual format used in plan.md
        let content = r#"
## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: 02b58aa2-9d97-4608-8118-5da0ea097de3 -->
PRD completed in `requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: 6bc34eb7-80d8-4863-9cd1-a220ea507d4e -->
Technical spec completed in `spec.md`.

### [-] Step: Implementation
<!-- chat-id: current -->
Working on it.

### [ ] Step: Testing
Not started.
"#;
        let steps = parse(content).unwrap();

        assert_eq!(steps.len(), 4);
        assert_eq!(steps[0].status, WorkflowStepStatus::Completed);
        assert_eq!(steps[1].status, WorkflowStepStatus::Completed);
        assert_eq!(steps[2].status, WorkflowStepStatus::InProgress);
        assert_eq!(steps[3].status, WorkflowStepStatus::Pending);

        // Chat ID comments should be in the description
        assert!(steps[0].description.contains("chat-id:"));
    }

    #[tokio::test]
    async fn test_get_template_builtin() {
        let template = get_template("builtin:feature", None).await.unwrap();
        assert!(template.is_some());
        assert_eq!(template.unwrap().name, "Feature");
    }

    #[tokio::test]
    async fn test_get_template_file_based_no_folder() {
        let template = get_template("file:custom", None).await.unwrap();
        assert!(template.is_none());
    }

    #[tokio::test]
    async fn test_get_template_file_based_with_folder() {
        let temp_dir = TempDir::new().unwrap();

        let workflow = r#"
# Custom Workflow

## Steps

### [ ] Step: Test
Test step.
"#;

        std::fs::write(temp_dir.path().join("custom.md"), workflow).unwrap();

        let template = get_template("file:custom", Some(temp_dir.path()))
            .await
            .unwrap();
        assert!(template.is_some());
        assert_eq!(template.unwrap().name, "Custom Workflow");
    }

    #[tokio::test]
    async fn test_get_template_file_based_not_found() {
        let temp_dir = TempDir::new().unwrap();

        let template = get_template("file:nonexistent", Some(temp_dir.path()))
            .await
            .unwrap();
        assert!(template.is_none());
    }
}
