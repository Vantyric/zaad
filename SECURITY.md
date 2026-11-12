# Security and privacy

## Scope

Zaad 1.x is a static, browser-local application. It has no authentication, backend, analytics, remote fonts or user-data API. Data is stored under `zaad:pantry:v1` in the current origin's localStorage. This is not encrypted storage and should not hold sensitive personal information.

## Controls

- React renders user text without HTML injection or dynamic code evaluation.
- Zod validates forms, storage reads and every imported backup. Imports have a 1 MB byte/file-size limit, a strict versioned schema and 500-record limits. Restoring requires reviewing a summary and explicitly replacing current data.
- Quantities must be finite, positive, within 100,000 and have at most three decimal places. Invalid dates, duplicate IDs, unsupported enum values and unknown schema fields are rejected.
- Native modal dialogs make the background inert; keyboard focus is contained and restored on exit. Reset and stock deletion require confirmation.
- Corrupt storage is preserved for recovery. Read and quota failures produce visible feedback rather than a false saved state.
- All shipped assets are local. The HTML CSP limits sources; deployment headers must provide `frame-ancestors` because it cannot be enforced by a meta CSP.
- Secrets, browser profiles, backups, dependency directories, reports and local environment files are not application source. Only synthetic fixtures and screenshots belong in version control.

## Boundaries

The browser profile and any third-party extensions that can access this origin are trusted. Same-browser tabs use last-write-wins; concurrent edits are not transactional. Device theft, malicious extensions, shared profiles and exported backup files are outside the app's encryption guarantees because no encryption is provided. Label dates do not assess food safety.

The development CSP permits a localhost WebSocket for Vite and inline styles. A production host should use stricter HTTP response headers as described in the README. Public hosting is not configured by default.

## Reporting

Do not post real pantry data, tokens or browser storage in a public issue. Use GitHub's private vulnerability reporting for this repository if it is enabled. Otherwise, contact the repository owner through an available private GitHub contact route and provide a minimal, synthetic reproduction. No response-time SLA is promised.
