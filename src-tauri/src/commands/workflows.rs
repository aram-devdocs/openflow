//! Workflow command handlers.
//!
//! Provides Tauri commands for workflow template operations.
//!
//! All commands are thin wrappers around `openflow_core::services::workflow` functions.

use std::collections::HashMap;
use std::path::Path;

use tauri::State;

use openflow_contracts::{WorkflowContext, WorkflowStep, WorkflowTemplate};
use openflow_core::services::{project, workflow};

use super::AppState;

/// Resolve the workflows folder path for a project.
///
/// Returns the path to the workflows folder if project_id is provided.
async fn resolve_workflows_path(
    state: &State<'_, AppState>,
    project_id: Option<&str>,
) -> Result<Option<std::path::PathBuf>, String> {
    let pid = match project_id {
        Some(p) => p,
        None => return Ok(None),
    };
    let pool = state.db.lock().await;
    let proj = project::get(&pool, pid).await.map_err(|e| e.to_string())?;
    Ok(Some(
        Path::new(&proj.git_repo_path).join(&proj.workflows_folder),
    ))
}

/// List all workflow templates for a project.
///
/// Returns both built-in templates and project-specific templates
/// from the project's workflows folder.
#[tauri::command]
pub async fn list_workflow_templates(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<WorkflowTemplate>, String> {
    let pool = state.db.lock().await;

    // Get the project to find its workflows folder
    let proj = project::get(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())?;

    // Get project-specific templates from the workflows folder
    let workflows_path = Path::new(&proj.git_repo_path).join(&proj.workflows_folder);
    let mut templates = workflow::list_templates(&workflows_path)
        .await
        .map_err(|e| e.to_string())?;

    // Add built-in templates at the beginning
    let mut all_templates = workflow::get_builtin_templates().map_err(|e| e.to_string())?;
    all_templates.append(&mut templates);

    Ok(all_templates)
}

/// Get all built-in workflow templates.
///
/// These are templates bundled with the application:
/// - Feature
/// - Bug Fix
/// - Refactor
#[tauri::command]
pub async fn get_builtin_workflow_templates() -> Result<Vec<WorkflowTemplate>, String> {
    workflow::get_builtin_templates().map_err(|e| e.to_string())
}

/// Get a specific workflow template by ID.
///
/// Supports both built-in (e.g., "builtin:feature") and file-based templates.
/// For file-based templates, project_id is required to locate the workflows folder.
#[tauri::command]
pub async fn get_workflow_template(
    state: State<'_, AppState>,
    id: String,
    project_id: Option<String>,
) -> Result<WorkflowTemplate, String> {
    let workflows_path = resolve_workflows_path(&state, project_id.as_deref()).await?;
    workflow::get_template(&id, workflows_path.as_deref())
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Template not found: {}", id))
}

/// Parse workflow markdown content into steps.
///
/// This command parses markdown content and returns a WorkflowTemplate
/// with the extracted steps. Useful for previewing workflow content.
#[tauri::command]
pub async fn parse_workflow_content(content: String) -> Result<WorkflowTemplate, String> {
    let steps = workflow::parse(&content).map_err(|e| e.to_string())?;

    // Create a temporary template for the parsed content
    let now = chrono::Utc::now().to_rfc3339();
    Ok(WorkflowTemplate {
        id: "parsed".to_string(),
        name: "Parsed Workflow".to_string(),
        description: None,
        content,
        is_builtin: false,
        steps,
        created_at: now.clone(),
        updated_at: now,
    })
}

/// Parse workflow markdown content into steps only.
///
/// This is a simpler version of parse_workflow_content that returns
/// just the parsed steps without wrapping them in a template.
#[tauri::command]
pub async fn parse_workflow_steps(content: String) -> Result<Vec<WorkflowStep>, String> {
    workflow::parse(&content).map_err(|e| e.to_string())
}

/// Substitute variables in workflow content using a HashMap.
///
/// Variables are in format: {@variable_name}
/// This provides a simple interface for arbitrary variable substitution.
#[tauri::command]
pub async fn substitute_workflow_variables(
    content: String,
    variables: HashMap<String, String>,
) -> Result<String, String> {
    workflow::substitute_variables(&content, &variables).map_err(|e| e.to_string())
}

/// Substitute variables in workflow content using a WorkflowContext.
///
/// This uses the standard workflow context variables:
/// - artifacts_path
/// - project_root
/// - worktree_path
/// - task_id
/// - task_title
/// - project_name
#[tauri::command]
pub async fn substitute_workflow_with_context(
    content: String,
    context: WorkflowContext,
) -> Result<String, String> {
    workflow::substitute_with_context(&content, &context).map_err(|e| e.to_string())
}

/// Get a specific built-in template by ID.
///
/// Returns the template if found, or an error if not found.
/// Built-in template IDs are: "builtin:feature", "builtin:bugfix", "builtin:refactor"
#[tauri::command]
pub async fn get_builtin_workflow_template(id: String) -> Result<WorkflowTemplate, String> {
    workflow::get_builtin_template(&id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Built-in template not found: {}", id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_builtin_workflow_templates() {
        let templates = get_builtin_workflow_templates().await.unwrap();
        assert_eq!(templates.len(), 3);
        assert!(templates.iter().any(|t| t.id == "builtin:feature"));
        assert!(templates.iter().any(|t| t.id == "builtin:bugfix"));
        assert!(templates.iter().any(|t| t.id == "builtin:refactor"));
    }

    #[tokio::test]
    async fn test_parse_workflow_content() {
        let content = r#"
# Test Workflow

### [ ] Step: First Step
Do something.

### [ ] Step: Second Step
Do something else.
"#
        .to_string();

        let template = parse_workflow_content(content).await.unwrap();
        assert_eq!(template.steps.len(), 2);
        assert_eq!(template.steps[0].name, "First Step");
        assert_eq!(template.steps[1].name, "Second Step");
    }

    #[tokio::test]
    async fn test_parse_workflow_steps() {
        let content = r#"
### [ ] Step: Requirements
Create the requirements document.

### [x] Step: Implementation
Done.
"#
        .to_string();

        let steps = parse_workflow_steps(content).await.unwrap();
        assert_eq!(steps.len(), 2);
        assert_eq!(steps[0].name, "Requirements");
        assert_eq!(steps[1].name, "Implementation");
    }

    #[tokio::test]
    async fn test_substitute_workflow_variables() {
        let content = "Save to {@path}/file.txt".to_string();
        let mut vars = HashMap::new();
        vars.insert("path".to_string(), "/tmp/artifacts".to_string());

        let result = substitute_workflow_variables(content, vars).await.unwrap();
        assert_eq!(result, "Save to /tmp/artifacts/file.txt");
    }

    #[tokio::test]
    async fn test_substitute_workflow_with_context() {
        let content = "Save to {@artifacts_path}/spec.md in {@project_root}".to_string();
        let context = WorkflowContext {
            artifacts_path: Some("/tasks/123".to_string()),
            project_root: Some("/home/project".to_string()),
            ..Default::default()
        };

        let result = substitute_workflow_with_context(content, context)
            .await
            .unwrap();
        assert_eq!(result, "Save to /tasks/123/spec.md in /home/project");
    }

    #[tokio::test]
    async fn test_get_builtin_workflow_template() {
        let template = get_builtin_workflow_template("builtin:feature".to_string())
            .await
            .unwrap();
        assert_eq!(template.name, "Feature");
        assert!(template.is_builtin);
        assert_eq!(template.steps.len(), 4);
    }

    #[tokio::test]
    async fn test_get_builtin_workflow_template_not_found() {
        let result = get_builtin_workflow_template("builtin:nonexistent".to_string()).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Built-in template not found"));
    }
}
