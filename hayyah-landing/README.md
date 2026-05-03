# Hayyah landing page

Static marketing page aligned with Hayyah CRM colors (navy, blue, mint, Plus Jakarta Sans). Served by **nginx** in its own Docker image.

## Build (from repo root)

```bash
docker build -f hayyah-landing/Dockerfile \
  --build-arg APP_URL="https://hayyah.me" \
  --build-arg AUTH_URL="https://hayyah.me/auth/realms/hayyah/protocol/openid-connect/auth" \
  -t hayyah-landing:latest .
```

Adjust `APP_URL` (main web app or CRM URL) and `AUTH_URL` (Keycloak login URL for your realm).

## Run

```bash
docker run -d --name hayyah-landing -p 8890:80 hayyah-landing:latest
```

Open `http://localhost:8890` (or map `8890` to `80` on your VM reverse proxy).

## Compose snippet

```yaml
hayyah-landing:
  build:
    context: .
    dockerfile: hayyah-landing/Dockerfile
    args:
      APP_URL: https://hayyah.me
      AUTH_URL: https://hayyah.me/auth/realms/hayyah/protocol/openid-connect/auth
  ports:
    - "8890:80"
  restart: unless-stopped
```

Context must be the **repository root** so the Dockerfile can copy `artifacts/hayyah-crm/public/images/*` for logos.
