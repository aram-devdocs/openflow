//! Workflow parsing and management service.
//!
//! Handles markdown workflow parsing and template management.

use std::path::Path;

use crate::types::{WorkflowStep, WorkflowTemplate};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for workflow operations.
pub struct WorkflowService;

impl WorkflowService {
    /// Parse workflow steps from markdown content.
    ///
    /// Expects steps in format:
    /// ```markdown
    /// ### [ ] Step: Step Name
    /// Step instructions here
    /// ```
    pub fn parse_workflow(content: &str) -> ServiceResult<Vec<WorkflowStep>> {
        // TODO: Implement in next step
        let _ = content;
        todo!()
    }

    /// List workflow templates from a folder.
    pub async fn list_templates(folder_path: &Path) -> ServiceResult<Vec<WorkflowTemplate>> {
        // TODO: Implement in next step
        let _ = folder_path;
        todo!()
    }

    /// Get built-in workflow templates.
    pub fn get_builtin_templates() -> Vec<WorkflowTemplate> {
        // TODO: Implement in next step
        todo!()
    }

    /// Substitute variables in workflow content.
    ///
    /// Variables are in format: {@variable_name}
    pub fn substitute_variables(
        content: &str,
        vars: &std::collections::HashMap<String, String>,
    ) -> String {
        let mut result = content.to_string();
        for (key, value) in vars {
            let pattern = format!("{{@{}}}", key);
            result = result.replace(&pattern, value);
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_substitute_variables() {
        let content = "Hello {@name}, welcome to {@project}!";
        let mut vars = HashMap::new();
        vars.insert("name".to_string(), "Alice".to_string());
        vars.insert("project".to_string(), "OpenFlow".to_string());

        let result = WorkflowService::substitute_variables(content, &vars);
        assert_eq!(result, "Hello Alice, welcome to OpenFlow!");
    }

    #[test]
    fn test_substitute_variables_missing() {
        let content = "Hello {@name}, welcome to {@project}!";
        let vars = HashMap::new();

        let result = WorkflowService::substitute_variables(content, &vars);
        assert_eq!(result, "Hello {@name}, welcome to {@project}!");
    }
}
