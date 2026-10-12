# Authentication & sprite upload

## Hosts

| Environment | App URL | OIDC client |
|-------------|---------|-------------|
| Local | `http://localhost:3000` | `dotv-creator-local` |
| Stage | `https://creator-stage.dragonsofthevoid.com` | `dotv-creator-stage` |
| Prod | `https://creator.dragonsofthevoid.com` | `dotv-creator` |

Clients are registered in `dotv-login/Clients.cs` (deploy IdentityServer after changing).

## Requirements

- Game account with **`admin`** or **`designer`** on the user document (Mongo). Designers must **not** use `admin: true` — that unlocks admin-tool and other `/api/admin/*` routes.
- **VPN** so API requests include `do-connecting-ip` matching `vpn.adminip` (same as admin-tool)
- Target API env: stage host → `api-stage`; prod host → `api`

### Granting designer access

Set `designer: true` on the user in Mongo (leave `admin: false`). Example:

```js
db.users.updateOne({ _id: "USER_ID" }, { $set: { designer: true } })
```

(Collection name may differ — use your existing user store.)

## Environment configuration

`npm start` follows `DEV_DOTV_ENV` in `src/config/dotvEnv.ts` (same idea as `stageEnv` in the web app's `packages/web/src/config/env.ts`). It defaults to stage. Set it to `"local"`, `"stage"`, or `"production"` and the dev server reloads.

| `DEV_DOTV_ENV` | API | Login |
|----------------|-----|-------|
| `"local"` | `http://localhost:8082` | `login-stage` |
| `"stage"` | `api-stage` | `login-stage` |
| `"production"` | `api` | `login` |

On `localhost`, OIDC always uses `dotv-creator-local` and `http://localhost:3000/callback.html`, so the callback stays on your machine. That client is in `dotv-login/Clients.cs` and has to be deployed to the login host you are calling before the redirect succeeds.

| Command | Env file | API | Login |
|---------|----------|-----|-------|
| `npm run build:stage` | `.env.staging` | `api-stage` | `login-stage` |
| `npm run build` | `.env.production` | `api` | `login` |

Dev console logs `[creator] environment` with the resolved URLs.

## Local dev

```bash
npm install
npm start
```

`npm install` uses `.npmrc` (`legacy-peer-deps=true`) because Create React App 5 declares a TypeScript 4 peer while this project uses TypeScript 5. The build is verified with that setting.

Opens `http://localhost:3000` → OIDC redirect → `callback.html` → app.

Upload: **Upload** nav or per-item link on equipment set detail → `POST /api/admin/equipment-character-image`.

## Deploy

1. Deploy `dotv-login` with new clients.
2. DNS + TLS for `creator` / `creator-stage` subdomains.
3. `npm run build` (prod) or `npm run build:stage` and publish `build/` to static hosting.
