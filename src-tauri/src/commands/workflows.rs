//! Workflow command handlers.
//!
//! Provides Tauri commands for workflow template operations.

use std::path::Path;

use tauri::State;

use crate::services::{ProjectService, WorkflowService};
use crate::types::WorkflowTemplate;

use super::AppState;

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
    let project = ProjectService::get(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())?;

    // Get project-specific templates from the workflows folder
    let workflows_path = Path::new(&project.git_repo_path).join(&project.workflows_folder);
    let mut templates = WorkflowService::list_templates(&workflows_path)
        .await
        .map_err(|e| e.to_string())?;

    // Add built-in templates at the beginning
    let mut all_templates = WorkflowService::get_builtin_templates().map_err(|e| e.to_string())?;
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
    WorkflowService::get_builtin_templates().map_err(|e| e.to_string())
}

/// Get a specific workflow template by ID.
///
/// Supports both built-in (e.g., "builtin:feature") and file-based templates.
#[tauri::command]
pub async fn get_workflow_template(
    state: State<'_, AppState>,
    id: String,
    project_id: Option<String>,
) -> Result<WorkflowTemplate, String> {
    // Check if it's a built-in template
    if id.starts_with("builtin:") {
        return WorkflowService::get_builtin_template(&id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Built-in template not found: {}", id));
    }

    // For file-based templates, we need the project
    let project_id = project_id.ok_or("project_id is required for file-based templates")?;
    let pool = state.db.lock().await;

    let project = ProjectService::get(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())?;

    let workflows_path = Path::new(&project.git_repo_path).join(&project.workflows_folder);
    let templates = WorkflowService::list_templates(&workflows_path)
        .await
        .map_err(|e| e.to_string())?;

    templates
        .into_iter()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("Template not found: {}", id))
}

/// Parse workflow markdown content into steps.
///
/// This command parses markdown content and returns a WorkflowTemplate
/// with the extracted steps. Useful for previewing workflow content.
#[tauri::command]
pub async fn parse_workflow_content(content: String) -> Result<WorkflowTemplate, String> {
    let steps = WorkflowService::parse_workflow(&content).map_err(|e| e.to_string())?;

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
}
