# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Website for a psychology practice: a public site plus a hidden management panel. The code, comments, docs and UI text are in **Romanian**; keep new comments and user-facing strings in Romanian. Comments often cite sections of the external spec `../PLAN_IMPLEMENTARE_Cabinet_Psihologic_Adina_Gghita.md` (`plan §N`). `README.md` and `DEPLOY.md` hold the full setup and deploy notes.

## Commands

```powershell
# API — http://localhost:5180, Swagger at /swagger (migrations + seed run on startup)
cd src\PsihoAdinaGghita.Api; dotnet run

# Client — http://localhost:5173, proxies /api → :5180 (vite.config.ts)
cd client; npm install; npm run dev
npm run build        # tsc -b && vite build → client/dist
npm run lint         # eslint
npm run typecheck    # tsc -b

# Tests (xUnit integration tests, tests/PsihoAdinaGghita.Api.Tests)
dotnet test
dotnet test --filter "FullyQualifiedName~AuthFlowTests"         # one class
dotnet test --filter "FullyQualifiedName~AuthFlowTests.<Method>" # one test

# EF migrations (dotnet-ef pinned in .config/dotnet-tools.json → `dotnet tool restore`)
dotnet dotnet-ef migrations add <Name> `
  --project src\PsihoAdinaGghita.Infrastructure `
  --startup-project src\PsihoAdinaGghita.Infrastructure `
  --output-dir Persistence\Migrations

# Production image (single container serving SPA + API on :8080)
docker build -t psiho .
```

There are no frontend tests.

## Architecture

**Backend: .NET 8 Clean Architecture.** Dependencies go `Api → Infrastructure, Application`, `Infrastructure → Application, Domain`, `Application → Domain`. The EF SQLite provider exists **only** in Infrastructure. EF tooling uses `AppDbContextFactory` so Api does not need `EntityFrameworkCore.Design`.

- **Application** is organized by feature: `Features/<Feature>/{Commands,Queries,Dtos}`, with MediatR handlers and FluentValidation validators. `Common/Behaviors/ValidationBehavior` runs the validators in the MediatR pipeline. `Common/Exceptions` (`ValidationException`, `NotFoundException`, `ConflictException`) are mapped to HTTP responses by `Api/Middleware/ExceptionHandlingMiddleware`.
- **Controllers** are thin: they inject `ISender` and `Send` a command or query. Public endpoints live in `XController` with `[AllowAnonymous]`. Admin endpoints live in `AdminXController` under `/api/admin/*`.
- **Auth is secure by default.** `Program.cs` sets a fallback authorization policy, so any endpoint without `[AllowAnonymous]` requires a JWT. The access token stays in client memory only; the refresh token lives in an HttpOnly cookie.
- **Rate limit policies** in `Program.cs`: `login` (5 per 15 min per IP) and `public-forms` (3 per hour per IP). Public forms also have a honeypot field.
- **Startup** runs `Database.MigrateAsync()`, then `DbSeeder` (idempotent: creates the admin user with `MustChangePassword = true`, plus demo content when `AdminSeed:SeedDemoContent` is set). Enums are serialized as strings (`JsonStringEnumConverter`), and the TS types depend on that.
- **Config/secrets**: nothing sensitive goes in `appsettings.json`. Use User Secrets in dev and env vars (`Jwt__SigningKey`, `Smtp__*`, `ConnectionStrings__Default`, `Cors__AllowedOrigins`, `Site__PublicUrl`) in prod. Outside Development the app refuses to start without a `Jwt:SigningKey` of at least 32 bytes. With `Smtp:Enabled=false`, emails are only logged.
- **SPA hosting**: `MapFallbackToFile("index.html")` is enabled only if `wwwroot/index.html` exists. The Dockerfile copies `client/dist` into `wwwroot`. `wwwroot/uploads` and the SQLite DB (`/data/psiho.db` in Docker) must be persistent volumes.

**Tests** (`PsihoApiFactory`): each test class boots the real API (with migrations and seed) on its own temp SQLite DB. This keeps rate limiters from leaking between classes, so use `IClassFixture<PsihoApiFactory>` and do not share a factory. `WithDb(...)` gives direct `AppDbContext` access for assertions.

**Frontend: React 19 + Vite 7 + MUI 7**, react-router 7, react-hook-form + zod, TipTap (article editor), DOMPurify (sanitize rendered article HTML), react-helmet-async (SEO).

- `src/api/client.ts` holds the **single axios instance**. It attaches the in-memory bearer token, and on a 401 it refreshes once (deduplicated) and retries. Every endpoint has a wrapper in `src/api/<resource>.ts`, with shared types in `src/api/types.ts`; components never build URLs. `VITE_API_BASE_URL` stays empty in dev.
- `src/pages/` + `components/` hold the public site (Romanian route slugs: `/despre`, `/servicii/:slug`, `/blog/:slug`, …). `features/management/` holds the admin panel at `/management`, lazy-loaded into a separate chunk and wrapped in `AuthProvider` and `ProtectedRoute`. The panel must stay unlinked from the public site, excluded from `sitemap.xml` (`SeoController`) and disallowed in `robots.txt`. A test checks this.
- Admin CRUD pages reuse `CrudPageShell`. The theme lives in `theme.ts` and `themeMode.tsx` (light/dark toggle).
- Practice contact and identity data are centralized in `src/config/site.ts` (env-overridable `VITE_*`); don't hardcode them in components. Missing practice photos use `PlaceholderImage`, which `PhotoImage` replaces using the same props.

**Online booking** (proposal A in `resources/Adina Gghita Booking Proposals.md`, phase 1):
- `AppointmentRequest` doubles as the appointment, with `Status` Pending/Confirmed/Rejected/Cancelled/Legacy. Legacy = old free-text requests from `POST /api/appointments`.
- Free slots come from the pure `Application/Features/Booking/Services/SlotCalculator` (weekly `AvailabilityRule`s + per-date `AvailabilityException`s + the `BookingSettings` row + Pending/Confirmed bookings + optional Google FreeBusy). All math is in Europe/Bucharest and stored as UTC.
- Double booking is blocked by a filtered unique index on `StartAt`. Confirm/cancel save the database first and call Google Calendar (`ICalendarService`) and SMTP afterwards; network failures only set `GoogleSyncState = Failed`, and the admin can resync.
- Not built yet (phase 2): reschedule, client self-cancel link, outbox, admin week view.

`graphify-out/` contains a generated knowledge graph of the codebase (see the graphify skill).
