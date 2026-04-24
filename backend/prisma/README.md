# Prisma (backend)

## Common dev commands

- Validate schema:
  - `npx prisma validate`
- Sync schema to local dev DB (no migration history in this repo yet):
  - `npx prisma db push`
  - If Prisma client generation fails on Windows with an `EPERM ... rename query_engine-windows.dll.node.tmp*` error, rerun with:
    - `npx prisma db push --skip-generate`
    - then `npx prisma generate` once file locks are cleared.
- Seed the database:
  - `npx prisma db seed`

