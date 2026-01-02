//! OpenFlow API Contracts
//!
//! This crate defines all API types and contracts as the single source of truth.
//! Code generators read these definitions to produce:
//! - TypeScript types (via typeshare)
//! - Zod validation schemas
//! - TypeScript query functions
//! - Axum route handlers
//! - Tauri command handlers
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    openflow-contracts (this crate)                       │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │  entities/    - Domain entities (Project, Task, Chat, etc.)             │
//! │  requests/    - Request types (CreateProjectRequest, etc.)              │
//! │  responses/   - Response types and API responses                        │
//! │  events/      - WebSocket/Tauri event types                             │
//! │  validation/  - Validation attribute definitions                        │
//! │  endpoints/   - Endpoint metadata definitions                           │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage
//!
//! This crate contains NO business logic, only type definitions and metadata.
//! All other crates depend on this for type definitions.

pub mod entities;
pub mod endpoints;
pub mod events;
pub mod requests;
pub mod responses;
pub mod validation;

// Re-export commonly used items for convenience
pub use entities::*;
pub use events::*;
pub use requests::*;
pub use responses::*;
