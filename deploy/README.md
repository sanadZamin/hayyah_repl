# Jenkins deploy — Hayyah web (CRM)

## On the server (`DEPLOY_DIR`, default `/hayyah`)

1. Copy [`docker-compose.yaml`](./docker-compose.yaml) to the deploy directory.
2. Optional `.env`:

```bash
API_UPSTREAM=https://hayyah.me
```

3. Ensure Docker Compose v2 is installed. The app is published on **host port 88** (container nginx listens on 80).

## Jenkins

1. Credential **`dockerhub-deploy`** — Docker Hub username + access token.
2. SSH — `/var/jenkins_home/.ssh/id_deploy` or parameter **`DEPLOY_SSH_CREDENTIALS_ID`**.
3. Bind **`VITE_CLIENT_SECRET`** (Secret text) as an environment variable on the pipeline job.
4. Run root **`Jenkinsfile`** — builds **`Dockerfile.web`**, pushes **`DOCKER_REPO`** (default `altshiftcreative/hayyah-web`), deploys the **`web`** service.
5. Leave **SYNC_COMPOSE_FILE** enabled (default) so Jenkins uploads this folder’s `docker-compose.yaml` to the server (fixes “No such service: web” when the host file is outdated).
6. If you manage compose manually, set **COMPOSE_SERVICE** to match your service name (e.g. `frontend`).

## Image tags

- `IMAGE_TAG` = Jenkins `BUILD_NUMBER`
- Optional `:latest` when **PUSH_LATEST** is true

Compose on the host:

```yaml
image: ${DOCKER_REPO}:${IMAGE_TAG}
```
