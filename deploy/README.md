# Jenkins deploy — Hayyah web (CRM)

## On the server (`DEPLOY_DIR`, default `/hayyah`)

1. Copy [`docker-compose.yaml`](./docker-compose.yaml) to the deploy directory.
2. Optional `.env`:

```bash
API_UPSTREAM=https://hayyah.me
```

3. Ensure Docker Compose v2 is installed.

## Jenkins

1. Credential **`dockerhub-deploy`** — Docker Hub username + access token.
2. SSH — `/var/jenkins_home/.ssh/id_deploy` or parameter **`DEPLOY_SSH_CREDENTIALS_ID`**.
3. Bind **`VITE_CLIENT_SECRET`** (Secret text) as an environment variable on the pipeline job.
4. Run root **`Jenkinsfile`** — builds **`Dockerfile.web`**, pushes **`DOCKER_REPO`** (default `altshiftcreative/hayyah-web`), deploys only the **`web`** service.

## Image tags

- `IMAGE_TAG` = Jenkins `BUILD_NUMBER`
- Optional `:latest` when **PUSH_LATEST** is true

Compose on the host:

```yaml
image: ${DOCKER_REPO}:${IMAGE_TAG}
```
