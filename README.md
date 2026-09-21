# Admission Portal (ADM-F000)

NestJS implementation of **Admissions Intake & Offering Management**.

## Stack

- NestJS 12 (ESM)
- Config + env validation
- class-validator / class-transformer

## Project structure

```
src/
├── main.ts                 # Bootstrap, global pipes/filters/interceptors
├── app.module.ts           # Root composition
├── config/                 # App config & env validation
├── common/                 # Shared cross-cutting concerns
│   ├── constants/          # Permission catalogue, etc.
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── database/               # DB module + migrations (ORM next)
├── integrations/
│   └── base-platform/      # IAM / tenant access adapter
└── modules/
    ├── admissions.module.ts
    ├── health/
    ├── departments/
    ├── programmes/
    ├── criteria-types/
    ├── intakes/
    ├── programme-offerings/
    ├── admission-criteria/
    ├── programme-fees/
    ├── offering-fees/
    └── supporting-information/
```

Each feature module follows:

```
<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
└── entities/
```

## Database migrations

PostgreSQL + TypeORM. Tables match `ADM-F000_Extracted_Tables_and_Sample_Data_v2.xlsx`.

Supports local Postgres or **Nhost** via `DATABASE_URL` (+ SSL).

```bash
cp .env.example .env   # set DATABASE_URL for Nhost, or DATABASE_* for local
npm run migration:run  # schema + fee_types / criteria_types seeds
npm run migration:show
npm run migration:revert
```

### Nhost setup
1. [Nhost Dashboard](https://app.nhost.io) → your project → **Settings → Database**
2. Enable **Public Access**
3. Copy the Postgres connection string into `.env` as `DATABASE_URL`
4. Set `DATABASE_SSL=true`
5. Run `npm run migration:run`

Migrations:

1. `1760000000001-InitAdmF000Schema` — all 11 tables (initial `admissions_*` names)
2. `1760000000002-SeedFeeAndCriteriaTypes` — `fee_types` + `criteria_types` seed rows
3. `1760000000003-RemoveAdmissionsTablePrefix` — renames tables to drop `admissions_` prefix

## API

- Global prefix: `api/v1`
- Health: `GET /api/v1/health`
- Swagger UI: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs/json

### Intakes

Required headers: `x-tenant-id`, `x-user-id`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/admissions/intake` | Create intake |
| `GET` | `/api/v1/admissions/intake` | List intakes |
| `GET` | `/api/v1/admissions/intake/{intakeId}` | Get intake |
| `PATCH` | `/api/v1/admissions/intake/{intakeId}` | Update intake |
| `PUT` | `/api/v1/admissions/intake/{intakeId}/application-window` | Set application window |

### Offering Management

Required headers: `x-tenant-id`, `x-user-id`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/admissions/intakes/{intakeId}/offerings` | Associate programme offering with intake |
| `GET` | `/api/v1/admissions/intakes/{intakeId}/offerings` | List offerings for intake |
| `PATCH` | `/api/v1/admissions/offerings/{offeringId}` | Update applicant-facing offering info |
