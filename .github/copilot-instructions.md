# ReMeal Backend Instructions

## Project Stack
- Backend platform for ReMeal, a marketplace for culinary products sold near closing time.
- Use Node.js 20+, Express.js, and ES Modules (`import`/`export`).
- Use Supabase for the database and authentication, Zod for validation, and Vercel for serverless deployment.

## API Contract
- `docs/openapi.yaml` is the source of truth for the API. Use `/api/v1` as the base path.
- Do not add, change, or rename endpoints, fields, or status codes beyond what the OpenAPI contract defines without explicit approval.
- Keep request and response shapes, authentication, roles, and status codes consistent with the contract.

## Roles and Errors
- The supported user roles are `consumer`, `seller`, and `super_admin`.
- Every error response must use the `Error` schema from the OpenAPI contract: `{ code, message, details }`.
- User-facing error messages must be in Indonesian. Code and variable names must be in English.
- Use these status codes: validation failure `422`, unauthenticated `401`, invalid role or account status `403`, not found `404`, and conflict `409`.

## Architecture
- Keep the request flow in the `routes -> controllers -> services` layers.
- Routes only register paths and middleware.
- Controllers only read the request and send the response; keep business logic and Supabase queries out of controllers.
- Put business logic and all Supabase queries in services.
- Put Zod schemas and request validation in validators.

## File Naming
- Use lowercase kebab-case module names and these suffixes: `<module>.routes.js`, `<module>.controller.js`, `<module>.service.js`, and `<module>.validator.js`.

## Secrets and Dependencies
- Read secrets only from environment variables. Never place keys or secrets in source code.
- Before installing a new package, state which package is needed and why, and wait for approval.