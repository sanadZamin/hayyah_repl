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
3. Bind Keycloak **`web_client`** secret as Jenkins **Secret text**. Set job parameter **`KEYCLOAK_CLIENT_SECRET_CRED_ID`** to that credential’s ID (default `hayyah-keycloak-client-secret`). The pipeline passes it as **`VITE_CLIENT_SECRET`** at **docker build** only (never in git or deploy compose).
4. Pipeline builds **`Dockerfile.web`**, pushes **`DOCKER_REPO`**, then on the server: `compose pull` + `up` for **COMPOSE_SERVICE**.

## Image tags

- `IMAGE_TAG` = Jenkins `BUILD_NUMBER`
- Optional `:latest` when **PUSH_LATEST** is true
