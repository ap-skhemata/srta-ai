# AI Development Log

This project was developed with AI assistance in a local coding-agent workflow.

For the complete transcript-style session record, see `docs/ai-log/full-chat-transcript.md`.

## How AI Tools Were Used

AI assistance was used for:

- inspecting the generated frontend structure
- planning the backend module layout
- implementing the FastAPI API layer
- implementing the SQLite persistence helpers
- implementing the deterministic agent state machine
- creating mock fixtures and tool functions
- wiring the existing frontend screens to the backend API
- drafting documentation and test coverage
- running local validation commands and summarizing failures

## Human Direction

The requirements and constraints were provided up front:

- preserve the generated frontend
- build a FastAPI backend
- use SQLite
- keep all systems local and mocked
- implement resumable state-machine behavior
- require operator approval for risky actions
- avoid authentication, cloud integrations, paid APIs, and major UI redesign

The AI-generated implementation was guided by those constraints and validated with tests and local build checks.

## Review And Validation

The resulting code was checked with:

- backend compile check
- backend API/runtime tests
- frontend TypeScript check
- frontend production build using Webpack
- manual API smoke testing of create, approval, and completion flow

## Limitations

AI assistance accelerated implementation and documentation, but the final project should still be reviewed as normal engineering work. Areas worth reviewing closely are background-thread behavior, persistence boundaries, and frontend polling behavior.
