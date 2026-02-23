# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and route handlers (`/api/*`).
- `src/app/api`: Backend endpoints (auth, courses, admin, learning, setup).
- `src/lib`: Shared server utilities (auth, DB access, MinIO, certificates).
- `src/lib/db`: Drizzle DB client and schema definitions.
- `src/components`: Reusable UI components.
- `public`: Static assets (logos, images, downloadable files).
- `scripts`: Utility scripts (for example `scripts/seed.ts`).
- `drizzle`: Generated migration metadata.
- `docs`: Additional project documentation.

## Build, Test, and Development Commands
- `npm run dev`: Start local development server on port `3005`.
- `npm run build`: Build production bundle and run type checks.
- `npm run start`: Run production server on port `3005`.
- `npm run db:push`: Apply schema changes to the configured database.
- `npm run db:seed`: Seed initial data (admin, sample records).
- `npm run db:studio`: Open Drizzle Studio for DB inspection.

Example local flow:
```bash
cp .env.example .env.local
npm install
npm run db:push
npm run dev
```

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with React function components.
- Indentation: 2 spaces; prefer semicolons and explicit return types on exported functions.
- Naming:
  - Components/pages: `PascalCase` for components, route folders in `kebab` or dynamic `[param]`.
  - Utilities/functions: `camelCase`.
  - Constants/env keys: `UPPER_SNAKE_CASE`.
- Keep route logic thin; move reusable logic to `src/lib`.

## Testing Guidelines
- No dedicated automated test suite is configured yet.
- Minimum quality gate for changes: `npm run build` must pass.
- For API/auth changes, manually verify key flows:
  - login/register/logout
  - Google OAuth start/callback
  - protected routes (`/dashboard`, `/admin`)

## Commit & Pull Request Guidelines
- Current history uses short imperative commits (e.g., `update Dockerfile`, `add docker-compose ...`).
- Prefer: `<verb> <scope>` such as `fix auth callback` or `update admin analytics`.
- PRs should include:
  - concise summary of behavior changes
  - affected routes/files
  - env/config updates (`.env` keys, compose changes)
  - screenshots for UI updates (login, dashboard, admin pages)

## Security & Configuration Tips
- Never commit real secrets in `.env.local`.
- Keep `AUTH_SECRET`, Google OAuth credentials, and MinIO keys only in environment variables.
- Ensure `GOOGLE_REDIRECT_URI` exactly matches Google Console settings in production.
