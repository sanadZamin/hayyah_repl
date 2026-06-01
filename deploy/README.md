# Jenkins deploy — Hayyah web (CRM)

## On the server (`DEPLOY_DIR`, default `/hayyah/frontend`)

1. Keep your own **`docker-compose.yaml`** (or `.yml`) in that directory — **Jenkins does not upload or overwrite it.**
2. The web service image line should use env vars Jenkins exports on deploy:

```yaml
image: ${DOCKER_REPO}:${IMAGE_TAG}
```

3. Optional `.env` (e.g. `API_UPSTREAM`, secrets).
4. Set Jenkins **COMPOSE_FILE** / **COMPOSE_SERVICE** to match your file (defaults: `docker-compose.yaml`, service `web`).

[`deploy/docker-compose.yaml`](./docker-compose.yaml) in git is a **reference only** for local docs — not copied to the server by the pipeline.

## Jenkins

1. Credential **`dockerhub-deploy`** — Docker Hub username + access token.
2. SSH — `/var/jenkins_home/.ssh/id_deploy` or **`DEPLOY_SSH_CREDENTIALS_ID`**.
3. Bind Keycloak **`web_client`** secret as Jenkins **Secret text** (`KEYCLOAK_CLIENT_SECRET_CRED_ID`). Login uses **`/auth/realms/hayyah/protocol/openid-connect/token`** (Keycloak via nginx), with **`client_secret`** baked at build time.
4. Pipeline builds **`Dockerfile.web`**, pushes **`DOCKER_REPO`**, then on the server: `compose pull` + `up` for **COMPOSE_SERVICE**.

## Image tags

- `IMAGE_TAG` = Jenkins `BUILD_NUMBER`
- Optional `:latest` when **PUSH_LATEST** is true

## Other containers stop when the pipeline runs

**Likely cause:** `docker compose up --remove-orphans` (removed from the pipeline) or a **shared Compose project name**.

Compose groups containers by **project** (`-p` / top-level `name:`). If the server compose file used `name: hayyah` while API/Keycloak also use project `hayyah`, deploy treated their containers as “orphans” and removed them when the file only listed `web`.

**Fix on the server**

1. In `/hayyah/frontend/docker-compose.yaml`, set `name: hayyah-web` (not `hayyah`).
2. Set Jenkins **COMPOSE_PROJECT_NAME** = `hayyah-web` (default).
3. Keep **only** the `web` service in that file if this directory is frontend-only.

**How to debug (SSH to deploy host)**

```bash
cd /hayyah/frontend
docker ps -a
docker compose -p hayyah-web -f docker-compose.yaml config --services
docker compose ls   # lists projects and status
docker inspect -f '{{.Name}} {{index .Config.Labels "com.docker.compose.project"}}' $(docker ps -aq)
```

**Compare before/after a Jenkins run:** the Deploy stage logs `docker ps -a` and compose `ps` for project `hayyah-web` only.

**If containers still disappear:** check whether the compose file in `DEPLOY_DIR` still defines API/DB services, port conflicts (`88:80`), or a host cron doing `docker prune`.
