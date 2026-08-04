# Liara Deployment

This repository should stay as one monorepo. Deploy it as four separate Liara
apps by selecting the service Dockerfile for each app. Splitting the repository
would require publishing or duplicating the shared workspace packages
(`@hatef/contracts`, `@hatef/domain`, `@hatef/localization`, and `@hatef/ui`),
which adds release risk without helping deployment.

All four apps must connect to the same PostgreSQL, Redis, and S3-compatible
object storage services:

| Liara app | Dockerfile | Required app port |
|---|---|---|
| API | `backend/api/Dockerfile` | `API_PORT=8080` |
| Worker | `backend/worker/Dockerfile` | `WORKER_PORT=8080` |
| Admin web | `frontend/admin-web/Dockerfile` | `PORT=8080` |
| Partner web | `frontend/partner-web/Dockerfile` | `PORT=8080` |

Each service folder has its own `liara.json`:

- `backend/api/liara.json`
- `backend/worker/liara.json`
- `frontend/admin-web/liara.json`
- `frontend/partner-web/liara.json`

Replace the placeholder `app` value in any new `liara.json` with the real Liara
app id/name before deploying that service. The existing admin web app id was
preserved.

Run database migrations once before releasing a new API version:

```bash
pnpm --filter @hatef/database db:migrate
```

Production environment notes:

- Set `NODE_ENV=production` on all four apps.
- Set `ADMIN_WEB_URL`, `PARTNER_WEB_URL`, `API_URL`, and `NEXT_PUBLIC_API_URL`
  to the final Liara HTTPS URLs.
- Set `SESSION_SECRET`, `OTP_HASH_PEPPER`, real `SMS_PROVIDER` credentials,
  and production antivirus/storage settings. The backend intentionally refuses
  unsafe production defaults.
- For ملی‌پیامک OTP delivery, set these on the API app environment:
  `SMS_PROVIDER=live`, `FEATURE_SMS_PROVIDER_LIVE=true`,
  `SMS_PROVIDER_USERNAME`, `SMS_PROVIDER_API_KEY` (or `SMS_PROVIDER_PASSWORD`),
  `SMS_PROVIDER_SENDER`, and `SMS_TEMPLATE_OTP_ID` if you use a services-line
  OTP pattern. `SMS_TEMPLATE_OTP_ID` is the ملی‌پیامک
  `BaseServiceNumber`/`bodyId`. Put the same SMS variables on the Worker app
  too if SMS notification delivery is enabled there. The frontend apps do not
  need SMS credentials. If ملی‌پیامک asks for an IP allowlist, put the public outbound
  IP of the deployed API server in the ملی‌پیامک panel.
- The API health check is `GET /health/ready`; web apps can use `/`.
- Keep the worker internal if possible; its HTTP surface is only `/health`.

Suggested deployment order:

1. Provision PostgreSQL, Redis, and object storage.
2. Deploy the API app.
3. Run `pnpm --filter @hatef/database db:migrate` once against production.
4. Deploy the worker app.
5. Deploy `admin-web` and `partner-web`.
