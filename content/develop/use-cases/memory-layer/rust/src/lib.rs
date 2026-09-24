//! Library entry point for the agent-memory demo.
//!
//! `src/main.rs` is the runnable binary; this file re-exports the
//! same modules as a library crate so the snippets in the walkthrough
//! (`use agent_memory_demo::session_store::AgentSession;`, and so on)
//! resolve against this package without needing a separate workspace.

pub mod embeddings;
pub mod event_log;
pub mod long_term_memory;
pub mod seed_memory;
pub mod session_store;
