# Jenkins deploy — Hayyah web (CRM)

## On the server (`DEPLOY_DIR`, default `/hayyah/frontend`)

1. Keep your own **`docker-compose.yaml`** (or `.yml`) in that directory — **Jenkins does not upload or overwrite it.**
2. The web service image line should use env vars Jenkins exports on deploy:

```yaml
services:
  web:
    image: ${DOCKER_REPO}:${IMAGE_TAG}   # not :latest — Jenkins writes .env with BUILD_NUMBER
```

Jenkins creates `/hayyah/frontend/.env` on each deploy with `IMAGE_TAG` and `DOCKER_REPO`. If the compose file still has `image: ...:latest`, the pipeline **auto-patches** that line to `image: ${DOCKER_REPO}:${IMAGE_TAG}` (backup: `docker-compose.yaml.bak.jenkins`).

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

## Old images on the server

After a successful deploy, Jenkins can prune unused images (job params):

- **PRUNE_DOCKER_IMAGES** (default on) — runs cleanup on the deploy host
- **KEEP_WEB_IMAGE_TAGS** (default `5`) — keeps the 5 newest numeric build tags, plus the running tag and any tag still used by a container

It runs `docker image prune -f`, removes old numeric build tags beyond the keep count, removes **`latest`** if no container uses it, and removes **`<none>`** (untagged) layers for that repo.

**Manual cleanup on the server** (review before running):

```bash
# Safe: dangling layers only
docker image prune -f

# Remove unused images for hayyah-web only (example: delete tags 1–15, keep 16+)
docker images altshiftcreative/hayyah-web --format '{{.Tag}}' | grep -E '^[0-9]+$' | sort -n

# Aggressive: ALL unused images on the host (can remove cached API/DB images too)
docker image prune -af
```

## `container name "/hayyah_frontend" is already in use`

Your server compose sets `container_name: hayyah_frontend`. An **old** container with that name still exists (often from project `hayyah` or `hayyah_frontend` while Jenkins now uses `-p hayyah-web`). Compose cannot create a second container with the same fixed name.

**One-time fix on the server:**

```bash
docker rm -f hayyah_frontend
cd /hayyah/frontend
docker compose -p hayyah-web -f docker-compose.yaml up -d web
```

**Ongoing:** the pipeline removes a stale `container_name` when it belongs to a different compose project, then runs `compose rm` + `up`. Align `name:` / `COMPOSE_PROJECT_NAME` with how you run the stack, or drop `container_name` and let Compose assign names (e.g. `hayyah-web-web-1`).

## `kex_exchange_identification: read: Connection reset by peer`

SSH never reached deploy — the **server closed port 22** during the handshake. This is not a Docker/compose issue.

**Check from the Jenkins machine** (same host that runs the pipeline):

```bash
ssh -vvv -i /var/jenkins_home/.ssh/id_deploy root@149.102.140.178 true
```

**On the deploy server** (console / another SSH session):

```bash
systemctl status ssh
journalctl -u ssh -n 50 --no-pager
fail2ban-client status sshd 2>/dev/null || true
ss -tn state established '( sport = :22 )'
grep -E 'MaxStartups|AllowUsers|DenyUsers' /etc/ssh/sshd_config
```

**Common causes**

| Cause | What to do |
|--------|------------|
| **fail2ban** blocked Jenkins IP | Unban: `fail2ban-client set sshd unbanip <jenkins-ip>`; whitelist Jenkins in jail |
| **Firewall / security group** | Allow Jenkins agent public IP on TCP 22 |
| **sshd overload** (`MaxStartups`) | Raise `MaxStartups` in `sshd_config`, restart sshd |
| **Server reboot / sshd down** | `systemctl restart ssh` |
| **Wrong host / routing** | Confirm `DEPLOY_HOST` and that the box is up |

After SSH works manually from Jenkins, re-run the pipeline. The Jenkinsfile retries SSH up to 5 times with backoff for transient resets.
