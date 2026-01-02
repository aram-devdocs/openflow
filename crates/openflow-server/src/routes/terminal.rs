//! Terminal Routes
//!
//! REST API endpoints for terminal spawning and management.

use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{DefaultShellResponse, ExecutionProcess, SpawnTerminalRequest};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::terminal;

use crate::{error::ServerResult, state::AppState};

/// Create terminal routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/spawn", post(spawn_terminal))
        .route("/shell", get(get_default_shell))
        .route("/shell/details", get(get_default_shell_response))
}

/// POST /api/terminal/spawn
///
/// Spawn a new terminal session.
async fn spawn_terminal(
    State(state): State<AppState>,
    Json(request): Json<SpawnTerminalRequest>,
) -> ServerResult<Json<ExecutionProcess>> {
    let process = terminal::spawn_terminal(&state.pool, &state.process_service, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(
        EntityType::Process,
        process.id.clone(),
        &process,
    ));

    Ok(Json(process))
}

/// GET /api/terminal/shell
///
/// Get the default shell path.
async fn get_default_shell() -> ServerResult<Json<String>> {
    let shell = terminal::get_default_shell()?;
    Ok(Json(shell))
}

/// GET /api/terminal/shell/details
///
/// Get detailed default shell information.
async fn get_default_shell_response() -> ServerResult<Json<DefaultShellResponse>> {
    let response = terminal::get_default_shell_response()?;
    Ok(Json(response))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }
}
